/**
 * Altie Reality — hero carousel.
 *
 * A radial spoke-wheel: sector cards hinged on a central vertical axis,
 * fanning outward and turning slowly, over a depth field. Written against
 * raw WebGL1 so the hero costs no third-party bytes.
 *
 * Degrades silently: if WebGL is unavailable or the user prefers reduced
 * motion, nothing runs and the CSS gradient backdrop carries the hero.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("hero-field");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SECTORS = (window.__ALTIE_CAROUSEL__ || []).slice();
  if (!SECTORS.length) return;

  // The wheel wants enough blades to read as a fanned deck rather than a few
  // lonely spokes, so the sector list repeats around the full turn. Each
  // texture is uploaded once and shared by every blade that uses it.
  var TARGET_BLADES = window.innerWidth < 900 ? 12 : 16;
  var CARDS = [];
  for (var bi = 0; CARDS.length < TARGET_BLADES; bi++) {
    CARDS.push(SECTORS[bi % SECTORS.length]);
  }

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

  var NARROW = window.innerWidth < 900;

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

  var scratch = new Float32Array(16);
  function multiply(out, a, b) {
    for (var c = 0; c < 4; c++) {
      for (var i = 0; i < 4; i++) {
        scratch[c * 4 + i] =
          a[i] * b[c * 4] + a[4 + i] * b[c * 4 + 1] +
          a[8 + i] * b[c * 4 + 2] + a[12 + i] * b[c * 4 + 3];
      }
    }
    out.set(scratch);
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

  /** Translate * rotateY(ry) * rotateX(rx) * rotateZ(rz) */
  function trs(out, tx, ty, tz, rx, ry, rz) {
    var cx=Math.cos(rx), sx=Math.sin(rx);
    var cy=Math.cos(ry), sy=Math.sin(ry);
    var cz=Math.cos(rz), sz=Math.sin(rz);
    out[0]=cy*cz + sy*sx*sz; out[1]=cx*sz;  out[2]=-sy*cz + cy*sx*sz; out[3]=0;
    out[4]=-cy*sz + sy*sx*cz; out[5]=cx*cz; out[6]=sy*sz + cy*sx*cz;  out[7]=0;
    out[8]=sy*cx;             out[9]=-sx;   out[10]=cy*cx;            out[11]=0;
    out[12]=tx; out[13]=ty; out[14]=tz; out[15]=1;
    return out;
  }

  /* ================= card geometry ================= */
  // The card hangs off the hub: x runs from the spine outward.
  var HUB = 0.16;
  var CARD_W = 1.18;
  var CARD_H = 0.74;

  var cardPos = new Float32Array([
    HUB, -CARD_H / 2, 0,
    HUB + CARD_W, -CARD_H / 2, 0,
    HUB + CARD_W, CARD_H / 2, 0,
    HUB, CARD_H / 2, 0,
  ]);
  var cardUv = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
  var cardIdx = new Uint16Array([0, 1, 2, 0, 2, 3]);

  var posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, cardPos, gl.STATIC_DRAW);
  var uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, cardUv, gl.STATIC_DRAW);
  var idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cardIdx, gl.STATIC_DRAW);

  /* ================= textures ================= */
  function makeTexture() {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // A neutral 1x1 stands in until the image arrives, so the first frame
    // draws immediately rather than flashing empty.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([18, 24, 40, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  SECTORS.forEach(function (card) {
    card.tex = makeTexture();
    card.ready = 0;
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, card.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      card.ready = 1;
      if (!running) draw(lastT);
    };
    img.onerror = function () { card.ready = 0; };
    img.src = card.src;
  });

  /* ================= programs ================= */
  var CARD_VS = [
    "attribute vec3 a_pos;",
    "attribute vec2 a_uv;",
    "uniform mat4 u_mvp;",
    "uniform mat4 u_model;",
    "varying vec2 v_uv;",
    "varying float v_depth;",
    "varying float v_facing;",
    "void main() {",
    "  vec4 world = u_model * vec4(a_pos, 1.0);",
    // Card normal is the model's +Z axis.
    "  vec3 n = normalize(mat3(u_model) * vec3(0.0, 0.0, 1.0));",
    "  vec3 toEye = normalize(vec3(0.0, 0.0, 0.0) - world.xyz);",
    "  v_facing = dot(n, toEye);",
    "  vec4 pos = u_mvp * vec4(a_pos, 1.0);",
    "  v_depth = pos.w;",
    "  v_uv = a_uv;",
    "  gl_Position = pos;",
    "}",
  ].join("\n");

  var CARD_FS = [
    "precision mediump float;",
    "varying vec2 v_uv;",
    "varying float v_depth;",
    "varying float v_facing;",
    "uniform sampler2D u_tex;",
    "uniform float u_ready;",
    "uniform float u_ratio;",
    "uniform float u_time;",
    "uniform float u_opacity;",
    "void main() {",
    // Rounded rectangle mask so the cards read as panels, not raw quads.
    "  vec2 p = (v_uv - 0.5) * vec2(u_ratio, 1.0);",
    "  float r = 0.055;",
    "  vec2 q = abs(p) - (vec2(0.5 * u_ratio, 0.5) - r);",
    "  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;",
    "  float mask = 1.0 - smoothstep(-0.004, 0.004, d);",
    "  if (mask <= 0.001) discard;",
    // Cards are double sided: the far half of the wheel samples with U
    // flipped so its image reads correctly rather than mirrored, and sits
    // a little darker so the near half still leads.
    "  float front = step(0.0, v_facing);",
    "  vec2 uv = vec2(mix(1.0 - v_uv.x, v_uv.x, front), v_uv.y);",
    "  vec3 img = texture2D(u_tex, uv).rgb;",
    "  vec3 base = mix(vec3(0.055, 0.075, 0.125), img, u_ready);",
    "  vec3 col = base * mix(0.55, 1.0, front);",
    // Edge light along the rounded border.
    "  float edge = smoothstep(-0.016, -0.002, d);",
    "  col += vec3(0.35, 0.62, 1.0) * edge * 0.55;",
    // Depth haze so the far side of the wheel recedes.
    "  float haze = clamp((v_depth - 3.6) / 4.6, 0.0, 1.0);",
    "  col = mix(col, vec3(0.016, 0.024, 0.043), haze * 0.6);",
    "  float alpha = mask * mix(0.9, 1.0, front) * (1.0 - haze * 0.25);",
    "  gl_FragColor = vec4(col, alpha * u_opacity);",
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
    "  gl_PointSize = u_scale * (11.0 / max(pos.w, 0.7));",
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
    "  gl_FragColor = vec4(col, soft * fade * 0.55);",
    "}",
  ].join("\n");

  var cardProg = program(CARD_VS, CARD_FS);
  var fieldProg = program(FIELD_VS, FIELD_FS);
  if (!cardProg || !fieldProg) return;

  var C = {
    aPos: gl.getAttribLocation(cardProg, "a_pos"),
    aUv: gl.getAttribLocation(cardProg, "a_uv"),
    uMvp: gl.getUniformLocation(cardProg, "u_mvp"),
    uModel: gl.getUniformLocation(cardProg, "u_model"),
    uTex: gl.getUniformLocation(cardProg, "u_tex"),
    uReady: gl.getUniformLocation(cardProg, "u_ready"),
    uRatio: gl.getUniformLocation(cardProg, "u_ratio"),
    uTime: gl.getUniformLocation(cardProg, "u_time"),
    uOpacity: gl.getUniformLocation(cardProg, "u_opacity"),
  };
  var F = {
    aGrid: gl.getAttribLocation(fieldProg, "a_grid"),
    uMvp: gl.getUniformLocation(fieldProg, "u_mvp"),
    uTime: gl.getUniformLocation(fieldProg, "u_time"),
    uScale: gl.getUniformLocation(fieldProg, "u_scale"),
  };

  /* ================= depth field ================= */
  var N = NARROW ? 30 : 50;
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
    resizeTimer = setTimeout(function () { resize(); NARROW = window.innerWidth < 900; }, 150);
  });

  /* ================= interaction ================= */
  var spin = 0;
  var spinVel = 0;
  var AUTO = 0.16;          // radians per second when idle
  var dragging = false;
  var lastPointerX = 0;
  var idleAt = 0;
  var tiltX = 0, tiltTarget = 0;

  canvas.style.touchAction = "pan-y";

  canvas.addEventListener("pointerdown", function (e) {
    dragging = true;
    lastPointerX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", function (e) {
    tiltTarget = (e.clientY / window.innerHeight - 0.5) * 0.34;
    if (!dragging) return;
    var dx = e.clientX - lastPointerX;
    lastPointerX = e.clientX;
    spinVel = (dx / window.innerWidth) * 9;
    spin += spinVel;
    idleAt = performance.now() + 1400;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    if (e && e.pointerId != null && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    canvas.style.cursor = "grab";
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", endDrag);

  if (window.matchMedia("(pointer: fine)").matches) {
    canvas.style.cursor = "grab";
  }

  /* ================= draw ================= */
  var proj = new Float32Array(16);
  var view = new Float32Array(16);
  var model = new Float32Array(16);
  var mv = new Float32Array(16);
  var mvp = new Float32Array(16);
  var vp = new Float32Array(16);

  var lastT = 0;
  var lastFrame = 0;

  function draw(t) {
    var dt = Math.min(Math.max(t - lastFrame, 0), 0.05);
    lastFrame = t;
    lastT = t;

    // Momentum after a drag, easing back to the idle rotation.
    if (!dragging) {
      spinVel *= 0.94;
      var auto = performance.now() > idleAt ? AUTO : 0;
      spin += (spinVel + auto * dt);
    }
    tiltX += (tiltTarget - tiltX) * 0.05;

    perspective(proj, 0.92, w / h, 0.1, 40);

    // Right of the headline on wide screens; centred and further back on
    // narrow ones so it never competes with the copy.
    var offsetX = NARROW ? 0.0 : 1.52;
    var offsetY = NARROW ? -1.5 : -0.05;
    var dist = NARROW ? -9.2 : -4.85;
    trs(view, offsetX, offsetY, dist, 0.20 + tiltX, 0, 0);
    multiply(vp, proj, view);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* --- depth field behind the wheel --- */
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(fieldProg);
    trs(model, 0, -1.55, 0, 0, 0, 0);
    multiply(mvp, vp, model);
    gl.uniformMatrix4fv(F.uMvp, false, mvp);
    gl.uniform1f(F.uTime, t);
    gl.uniform1f(F.uScale, dpr * (NARROW ? 0.8 : 1.05));
    gl.bindBuffer(gl.ARRAY_BUFFER, fieldBuf);
    gl.enableVertexAttribArray(F.aGrid);
    gl.vertexAttribPointer(F.aGrid, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, N * N);

    /* --- the wheel --- */
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(cardProg);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(C.aPos);
    gl.vertexAttribPointer(C.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.enableVertexAttribArray(C.aUv);
    gl.vertexAttribPointer(C.aUv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);

    gl.uniform1f(C.uRatio, CARD_W / CARD_H);
    gl.uniform1f(C.uTime, t);
    gl.uniform1f(C.uOpacity, NARROW ? 0.45 : 1.0);
    gl.uniform1i(C.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);

    var step = (Math.PI * 2) / CARDS.length;
    // Painter's order: farthest first, so alpha edges composite correctly
    // even where depth testing alone would not.
    var order = CARDS.map(function (card, i) {
      var a = spin + i * step;
      return { i: i, a: a, z: Math.cos(a) };
    }).sort(function (p, q) { return p.z - q.z; });

    for (var k = 0; k < order.length; k++) {
      var card = CARDS[order[k].i];
      var angle = order[k].a;
      // A gentle wave so the fan is not perfectly rigid.
      var roll = Math.sin(angle * 2 + t * 0.5) * 0.055;
      trs(model, 0, 0, 0, 0, angle, roll);
      multiply(mv, view, model);
      multiply(mvp, proj, mv);
      gl.uniformMatrix4fv(C.uMvp, false, mvp);
      gl.uniformMatrix4fv(C.uModel, false, mv);
      gl.uniform1f(C.uReady, card.ready);
      gl.bindTexture(gl.TEXTURE_2D, card.tex);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    gl.disable(gl.DEPTH_TEST);
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
