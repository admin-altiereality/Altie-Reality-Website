/**
 * Altie Reality — hero scene.
 *
 * A holographic headset with floating spatial panels, drifting over a depth
 * field. Written against raw WebGL1 so the hero costs no third-party bytes.
 *
 * Degrades silently: if WebGL is unavailable or the user prefers reduced
 * motion, nothing runs and the CSS gradient backdrop carries the hero.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("hero-field");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var gl;
  try {
    gl =
      canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        depth: true,
        // Keeps the last frame on screen when the loop is throttled rather
        // than compositing an empty buffer over the hero.
        preserveDrawingBuffer: true,
      }) || canvas.getContext("experimental-webgl", { alpha: true, antialias: true });
  } catch (e) {
    return;
  }
  if (!gl) return;

  var LOW_POWER = window.innerWidth < 900;

  /* ================= shader plumbing ================= */
  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function program(vsrc, fsrc) {
    var vs = compile(gl.VERTEX_SHADER, vsrc);
    var fs = compile(gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) return null;
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return p;
  }

  /* ================= matrices ================= */
  function identity(m) {
    m[0]=1;m[1]=0;m[2]=0;m[3]=0; m[4]=0;m[5]=1;m[6]=0;m[7]=0;
    m[8]=0;m[9]=0;m[10]=1;m[11]=0; m[12]=0;m[13]=0;m[14]=0;m[15]=1;
    return m;
  }

  function multiply(out, a, b) {
    var r = new Float32Array(16);
    for (var c = 0; c < 4; c++) {
      for (var i = 0; i < 4; i++) {
        r[c * 4 + i] =
          a[i] * b[c * 4] + a[4 + i] * b[c * 4 + 1] +
          a[8 + i] * b[c * 4 + 2] + a[12 + i] * b[c * 4 + 3];
      }
    }
    out.set(r);
    return out;
  }

  function perspective(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    identity(out);
    out[0] = f / aspect; out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    out[15] = 0;
    return out;
  }

  function trs(out, tx, ty, tz, rx, ry, rz, sx, sy, sz) {
    var cx=Math.cos(rx), sxr=Math.sin(rx);
    var cy=Math.cos(ry), syr=Math.sin(ry);
    var cz=Math.cos(rz), szr=Math.sin(rz);
    // R = Ry * Rx * Rz
    var m00 = cy*cz + syr*sxr*szr, m01 = cx*szr, m02 = -syr*cz + cy*sxr*szr;
    var m10 = -cy*szr + syr*sxr*cz, m11 = cx*cz, m12 = syr*szr + cy*sxr*cz;
    var m20 = syr*cx, m21 = -sxr, m22 = cy*cx;
    out[0]=m00*sx; out[1]=m10*sx; out[2]=m20*sx; out[3]=0;
    out[4]=m01*sy; out[5]=m11*sy; out[6]=m21*sy; out[7]=0;
    out[8]=m02*sz; out[9]=m12*sz; out[10]=m22*sz; out[11]=0;
    out[12]=tx; out[13]=ty; out[14]=tz; out[15]=1;
    return out;
  }

  /* ================= geometry ================= */
  /** Smooth vertex normals accumulated from face normals. */
  function computeNormals(pos, idx) {
    var n = new Float32Array(pos.length);
    for (var i = 0; i < idx.length; i += 3) {
      var a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      var ux = pos[b] - pos[a], uy = pos[b+1] - pos[a+1], uz = pos[b+2] - pos[a+2];
      var vx = pos[c] - pos[a], vy = pos[c+1] - pos[a+1], vz = pos[c+2] - pos[a+2];
      var nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
      n[a]+=nx; n[a+1]+=ny; n[a+2]+=nz;
      n[b]+=nx; n[b+1]+=ny; n[b+2]+=nz;
      n[c]+=nx; n[c+1]+=ny; n[c+2]+=nz;
    }
    for (var j = 0; j < n.length; j += 3) {
      var l = Math.hypot(n[j], n[j+1], n[j+2]) || 1;
      n[j]/=l; n[j+1]/=l; n[j+2]/=l;
    }
    return n;
  }

  function sgnPow(v, e) {
    return (v < 0 ? -1 : 1) * Math.pow(Math.abs(v), e);
  }

  /**
   * Superellipsoid — a single parametric surface that yields a rounded box,
   * which is the headset visor silhouette without hand-authoring a mesh.
   */
  function superellipsoid(a, b, c, e1, e2, segU, segV) {
    var pos = [], idx = [];
    for (var i = 0; i <= segV; i++) {
      var v = -Math.PI / 2 + (Math.PI * i) / segV;
      var cv = Math.cos(v), sv = Math.sin(v);
      for (var j = 0; j <= segU; j++) {
        var u = -Math.PI + (2 * Math.PI * j) / segU;
        var cu = Math.cos(u), su = Math.sin(u);
        pos.push(
          a * sgnPow(cv, e1) * sgnPow(cu, e2),
          b * sgnPow(sv, e1),
          c * sgnPow(cv, e1) * sgnPow(su, e2)
        );
      }
    }
    for (var y = 0; y < segV; y++) {
      for (var x = 0; x < segU; x++) {
        var p0 = y * (segU + 1) + x, p1 = p0 + 1;
        var p2 = p0 + segU + 1, p3 = p2 + 1;
        idx.push(p0, p2, p1, p1, p2, p3);
      }
    }
    var P = new Float32Array(pos);
    var I = new Uint16Array(idx);
    return { pos: P, nrm: computeNormals(P, I), idx: I };
  }

  /** Partial torus, used for the head strap. */
  function torus(R, r, arc, segU, segV) {
    var pos = [], idx = [];
    for (var i = 0; i <= segU; i++) {
      var u = (arc * i) / segU - arc / 2;
      var cu = Math.cos(u), su = Math.sin(u);
      for (var j = 0; j <= segV; j++) {
        var v = (2 * Math.PI * j) / segV;
        var cv = Math.cos(v), sv = Math.sin(v);
        pos.push((R + r * cv) * cu, r * sv, (R + r * cv) * su);
      }
    }
    for (var y = 0; y < segU; y++) {
      for (var x = 0; x < segV; x++) {
        var p0 = y * (segV + 1) + x, p1 = p0 + 1;
        var p2 = p0 + segV + 1, p3 = p2 + 1;
        idx.push(p0, p2, p1, p1, p2, p3);
      }
    }
    var P = new Float32Array(pos);
    var I = new Uint16Array(idx);
    return { pos: P, nrm: computeNormals(P, I), idx: I };
  }

  function plane(w, h) {
    var P = new Float32Array([
      -w, -h, 0,  w, -h, 0,  w, h, 0,  -w, h, 0,
    ]);
    var I = new Uint16Array([0, 1, 2, 0, 2, 3]);
    return { pos: P, nrm: computeNormals(P, I), idx: I };
  }

  function upload(mesh) {
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.pos, gl.STATIC_DRAW);
    var nbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.nrm, gl.STATIC_DRAW);
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);
    return { vbo: vbo, nbo: nbo, ibo: ibo, count: mesh.idx.length };
  }

  /* ================= programs ================= */
  var SOLID_VS = [
    "attribute vec3 a_pos;",
    "attribute vec3 a_nrm;",
    "uniform mat4 u_mvp;",
    "uniform mat4 u_model;",
    "varying vec3 v_nrm;",
    "varying vec3 v_world;",
    "void main() {",
    "  vec4 w = u_model * vec4(a_pos, 1.0);",
    "  v_world = w.xyz;",
    "  v_nrm = normalize(mat3(u_model) * a_nrm);",
    "  gl_Position = u_mvp * vec4(a_pos, 1.0);",
    "}",
  ].join("\n");

  var SOLID_FS = [
    "precision mediump float;",
    "varying vec3 v_nrm;",
    "varying vec3 v_world;",
    "uniform vec3 u_tint;",
    "uniform float u_time;",
    "uniform float u_alpha;",
    "void main() {",
    "  vec3 N = normalize(v_nrm);",
    "  vec3 V = normalize(vec3(0.0, 0.35, 3.2) - v_world);",
    "  float facing = max(dot(N, V), 0.0);",
    // Rim light: the edge glow that reads as a hologram.
    "  float rim = pow(1.0 - facing, 2.6);",
    "  vec3 key = normalize(vec3(-0.5, 0.9, 0.7));",
    "  float lambert = max(dot(N, key), 0.0);",
    // Horizontal scan bands drifting up the surface.
    "  float scan = 0.5 + 0.5 * sin(v_world.y * 70.0 - u_time * 2.2);",
    "  vec3 col = u_tint * (0.22 + 0.48 * lambert);",
    "  col += mix(u_tint, vec3(0.45, 0.90, 1.0), 0.30) * rim * 1.05;",
    "  col += vec3(0.34, 0.89, 0.92) * scan * 0.05;",
    "  float a = clamp(u_alpha * (0.42 + rim * 0.85 + lambert * 0.22), 0.0, 0.96);",
    "  gl_FragColor = vec4(col, a);",
    "}",
  ].join("\n");

  var PANEL_FS = [
    "precision mediump float;",
    "varying vec3 v_nrm;",
    "varying vec3 v_world;",
    "uniform vec3 u_tint;",
    "uniform float u_time;",
    "uniform float u_alpha;",
    "void main() {",
    // A spatial UI surface: faint grid, brighter border.
    "  vec2 uv = v_world.xy;",
    "  vec2 g = abs(fract(uv * 5.0) - 0.5);",
    "  float grid = smoothstep(0.46, 0.5, max(g.x, g.y));",
    "  float pulse = 0.6 + 0.4 * sin(u_time * 0.9 + v_world.x * 2.0);",
    "  vec3 col = u_tint * (0.25 + grid * 0.8) * pulse;",
    "  gl_FragColor = vec4(col, u_alpha * (0.10 + grid * 0.34));",
    "}",
  ].join("\n");

  var FIELD_VS = [
    "attribute vec2 a_grid;",
    "uniform mat4 u_mvp;",
    "uniform float u_time;",
    "uniform float u_scale;",
    "varying float v_depth;",
    "varying float v_height;",
    "void main() {",
    "  float x = a_grid.x;",
    "  float z = a_grid.y;",
    "  float h = sin(x * 2.1 + u_time * 0.42) * 0.28;",
    "  h += sin(z * 1.7 - u_time * 0.31) * 0.24;",
    "  h += sin((x + z) * 1.15 + u_time * 0.22) * 0.16;",
    "  h *= 1.0 - 0.22 * length(vec2(x, z));",
    "  vec4 pos = u_mvp * vec4(x, h, z, 1.0);",
    "  gl_Position = pos;",
    "  v_depth = clamp((pos.w - 1.0) / 7.0, 0.0, 1.0);",
    "  v_height = h;",
    "  gl_PointSize = u_scale * (13.0 / max(pos.w, 0.7));",
    "}",
  ].join("\n");

  var FIELD_FS = [
    "precision mediump float;",
    "varying float v_depth;",
    "varying float v_height;",
    "void main() {",
    "  vec2 d = gl_PointCoord - vec2(0.5);",
    "  float r = dot(d, d);",
    "  if (r > 0.25) discard;",
    "  float soft = smoothstep(0.25, 0.02, r);",
    "  vec3 blue = vec3(0.271, 0.376, 0.910);",
    "  vec3 cyan = vec3(0.341, 0.886, 0.914);",
    "  vec3 col = mix(blue, cyan, clamp(v_height * 1.5 + 0.5, 0.0, 1.0));",
    "  float fade = 1.0 - smoothstep(0.15, 0.95, v_depth);",
    "  gl_FragColor = vec4(col, soft * fade * 0.7);",
    "}",
  ].join("\n");

  var solidProg = program(SOLID_VS, SOLID_FS);
  var panelProg = program(SOLID_VS, PANEL_FS);
  var fieldProg = program(FIELD_VS, FIELD_FS);
  if (!solidProg || !panelProg || !fieldProg) return;

  var loc = {};
  [["solid", solidProg], ["panel", panelProg]].forEach(function (pair) {
    loc[pair[0]] = {
      prog: pair[1],
      aPos: gl.getAttribLocation(pair[1], "a_pos"),
      aNrm: gl.getAttribLocation(pair[1], "a_nrm"),
      uMvp: gl.getUniformLocation(pair[1], "u_mvp"),
      uModel: gl.getUniformLocation(pair[1], "u_model"),
      uTint: gl.getUniformLocation(pair[1], "u_tint"),
      uTime: gl.getUniformLocation(pair[1], "u_time"),
      uAlpha: gl.getUniformLocation(pair[1], "u_alpha"),
    };
  });
  loc.field = {
    prog: fieldProg,
    aGrid: gl.getAttribLocation(fieldProg, "a_grid"),
    uMvp: gl.getUniformLocation(fieldProg, "u_mvp"),
    uTime: gl.getUniformLocation(fieldProg, "u_time"),
    uScale: gl.getUniformLocation(fieldProg, "u_scale"),
  };

  /* ================= scene ================= */
  var detail = LOW_POWER ? 0.6 : 1;
  var visor = upload(
    superellipsoid(0.88, 0.37, 0.21, 0.30, 0.28,
      Math.round(56 * detail), Math.round(34 * detail))
  );
  var strap = upload(
    torus(0.66, 0.05, Math.PI * 2,
      Math.round(64 * detail), Math.round(12 * detail))
  );
  var panelMesh = upload(plane(0.62, 0.42));
  var topStrap = upload(
    torus(0.60, 0.045, Math.PI * 2,
      Math.round(56 * detail), Math.round(10 * detail))
  );

  // Floating spatial panels: [x, y, z, rotY, scale, driftSpeed]
  var PANELS = [
    [-1.85, 0.62, -0.6, 0.55, 1.0, 0.7],
    [1.72, 0.30, -0.35, -0.5, 0.85, 0.9],
    [-1.35, -0.72, 0.35, 0.32, 0.7, 1.15],
    [1.42, -0.85, -0.9, -0.38, 0.62, 0.8],
  ];

  var N = LOW_POWER ? 34 : 58;
  var pts = new Float32Array(N * N * 2);
  var pi = 0;
  for (var gx = 0; gx < N; gx++) {
    for (var gz = 0; gz < N; gz++) {
      pts[pi++] = ((gx / (N - 1)) * 2 - 1) * 3.4;
      pts[pi++] = ((gz / (N - 1)) * 2 - 1) * 3.4;
    }
  }
  var fieldBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fieldBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);

  /* ================= sizing ================= */
  var dpr = 1, w = 0, h = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width * dpr));
    h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  }
  resize();
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  /* ================= pointer ================= */
  var targetX = 0, targetY = 0, curX = 0, curY = 0;
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", function (e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* ================= draw ================= */
  var proj = new Float32Array(16);
  var view = new Float32Array(16);
  var model = new Float32Array(16);
  var mvp = new Float32Array(16);
  var assembly = new Float32Array(16);
  var local = new Float32Array(16);
  var vp = new Float32Array(16);

  function bindMesh(L, mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.enableVertexAttribArray(L.aPos);
    gl.vertexAttribPointer(L.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nbo);
    gl.enableVertexAttribArray(L.aNrm);
    gl.vertexAttribPointer(L.aNrm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
  }

  function drawMesh(L, mesh, t, tint, alpha) {
    multiply(mvp, vp, model);
    gl.uniformMatrix4fv(L.uMvp, false, mvp);
    gl.uniformMatrix4fv(L.uModel, false, model);
    gl.uniform3fv(L.uTint, tint);
    gl.uniform1f(L.uTime, t);
    gl.uniform1f(L.uAlpha, alpha);
    bindMesh(L, mesh);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  var BRAND = new Float32Array([0.35, 0.48, 1.0]);
  var CYAN = new Float32Array([0.30, 0.82, 0.90]);
  var STRAP = new Float32Array([0.28, 0.44, 0.92]);

  function draw(t) {
    curX += (targetX - curX) * 0.045;
    curY += (targetY - curY) * 0.045;

    var aspect = w / h;
    perspective(proj, 0.9, aspect, 0.1, 40);

    // Right of the headline on wide screens; on narrow ones it drops below
    // the copy and further back so it reads as a backdrop, not an obstacle.
    var narrow = window.innerWidth < 900;
    var offsetX = narrow ? 0.1 : 1.38;
    var offsetY = narrow ? -1.15 : -0.10;
    var dist = narrow ? -7.6 : -5.1;
    trs(view, offsetX, offsetY, dist, 0.16 + curY * 0.07, curX * 0.22, 0, 1, 1, 1);
    multiply(vp, proj, view);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- depth field, behind everything ---
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(loc.field.prog);
    trs(model, 0, -1.5, 0, 0, 0, 0, 1, 1, 1);
    multiply(mvp, vp, model);
    gl.uniformMatrix4fv(loc.field.uMvp, false, mvp);
    gl.uniform1f(loc.field.uTime, t);
    gl.uniform1f(loc.field.uScale, dpr * (LOW_POWER ? 0.8 : 1.1));
    gl.bindBuffer(gl.ARRAY_BUFFER, fieldBuf);
    gl.enableVertexAttribArray(loc.field.aGrid);
    gl.vertexAttribPointer(loc.field.aGrid, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, N * N);

    // --- spatial panels ---
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(loc.panel.prog);
    for (var i = 0; i < PANELS.length; i++) {
      var p = PANELS[i];
      var bob = Math.sin(t * 0.5 * p[5] + i * 1.7) * 0.09;
      trs(model, p[0], p[1] + bob, p[2],
        Math.sin(t * 0.25 + i) * 0.08, p[3] + Math.sin(t * 0.18 + i) * 0.06, 0,
        p[4], p[4], p[4]);
      drawMesh(loc.panel, panelMesh, t, i % 2 ? CYAN : BRAND, 1.0);
    }

    // --- headset ---
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // Without culling the translucent shell shows its own interior faces,
    // which read as bright bands across the visor.
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.frontFace(gl.CCW);
    gl.useProgram(loc.solid.prog);

    var spin = t * 0.18;
    var lift = Math.sin(t * 0.42) * 0.055;

    trs(assembly, 0, lift, 0, 0.10 + Math.sin(t * 0.3) * 0.06, spin, 0, 1, 1, 1);

    // Visor sits forward of the head centre.
    trs(local, 0, 0.02, 0.52, 0, 0, 0, 1, 1, 1);
    multiply(model, assembly, local);
    drawMesh(loc.solid, visor, t, BRAND, 1.0);

    // Side band, centred behind the visor so it emerges at the temples
    // instead of cutting across the face.
    trs(local, 0, 0.02, -0.36, 0, 0, 0, 1, 1, 1);
    multiply(model, assembly, local);
    drawMesh(loc.solid, strap, t, STRAP, 0.8);

    // Over-the-top band, upright and equally clear of the visor.
    trs(local, 0, 0.04, -0.36, Math.PI / 2, 0, 0, 1, 1, 1);
    multiply(model, assembly, local);
    drawMesh(loc.solid, topStrap, t, STRAP, 0.7);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
  }

  /* ================= loop ================= */
  var running = true, raf = null;
  var start = performance.now();

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running && raf === null) raf = requestAnimationFrame(frame);
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting && !document.hidden;
      if (running && raf === null) raf = requestAnimationFrame(frame);
    }, { threshold: 0 }).observe(canvas);
  }

  function frame(now) {
    if (!running) { raf = null; return; }
    draw((now - start) / 1000);
    raf = requestAnimationFrame(frame);
  }

  canvas.classList.add("is-live");
  draw(0);
  raf = requestAnimationFrame(frame);
})();
