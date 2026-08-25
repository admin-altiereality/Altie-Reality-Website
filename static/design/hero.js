/**
 * Altie Reality — hero spatial field.
 *
 * A WebGL point-lattice that reads as a spatial scan: a grid sampled in 3D,
 * displaced over time, drawn with depth attenuation. Written against raw
 * WebGL1 so the hero costs no third-party bytes.
 *
 * Degrades silently: if WebGL is unavailable, the user prefers reduced
 * motion, or the device is small, nothing runs and the CSS gradient
 * backdrop beneath the canvas carries the hero on its own.
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
        depth: false,
        // Keeps the last rendered frame on screen when the loop is throttled
        // (background tab, low-power mode) instead of compositing an empty
        // buffer over the hero.
        preserveDrawingBuffer: true,
      }) ||
      canvas.getContext("experimental-webgl", { alpha: true, antialias: true });
  } catch (e) {
    return;
  }
  if (!gl) return;

  /* --- Shaders ----------------------------------------------------------- */
  var VERT = [
    "attribute vec2 a_grid;",
    "uniform mat4 u_mvp;",
    "uniform float u_time;",
    "uniform float u_scale;",
    "varying float v_depth;",
    "varying float v_height;",
    "void main() {",
    "  float x = a_grid.x;",
    "  float z = a_grid.y;",
    // Layered sines: a calm, non-repeating swell rather than a wave.
    "  float h = sin(x * 2.1 + u_time * 0.42) * 0.28;",
    "  h += sin(z * 1.7 - u_time * 0.31) * 0.24;",
    "  h += sin((x + z) * 1.15 + u_time * 0.22) * 0.16;",
    "  h *= 1.0 - 0.22 * length(vec2(x, z));",
    "  vec4 pos = u_mvp * vec4(x, h, z, 1.0);",
    "  gl_Position = pos;",
    "  v_depth = clamp((pos.w - 1.0) / 7.0, 0.0, 1.0);",
    "  v_height = h;",
    "  gl_PointSize = u_scale * (16.0 / max(pos.w, 0.7));",
    "}",
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "varying float v_depth;",
    "varying float v_height;",
    "void main() {",
    "  vec2 d = gl_PointCoord - vec2(0.5);",
    "  float r = dot(d, d);",
    "  if (r > 0.25) discard;",
    "  float soft = smoothstep(0.25, 0.02, r);",
    // Brand blue at rest, cyan on the crests.
    "  vec3 blue = vec3(0.357, 0.486, 1.0);",
    "  vec3 cyan = vec3(0.341, 0.886, 0.914);",
    "  vec3 col = mix(blue, cyan, clamp(v_height * 1.5 + 0.5, 0.0, 1.0));",
    "  float fade = 1.0 - smoothstep(0.15, 0.95, v_depth);",
    "  gl_FragColor = vec4(col, soft * fade);",
    "}",
  ].join("\n");

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

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  /* --- Geometry ---------------------------------------------------------- */
  // Grid density scales down on small screens to protect the frame budget.
  var N = window.innerWidth < 700 ? 40 : window.innerWidth < 1200 ? 56 : 72;
  var points = new Float32Array(N * N * 2);
  var i = 0;
  for (var gx = 0; gx < N; gx++) {
    for (var gz = 0; gz < N; gz++) {
      points[i++] = ((gx / (N - 1)) * 2 - 1) * 3.2;
      points[i++] = ((gz / (N - 1)) * 2 - 1) * 3.2;
    }
  }

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

  var aGrid = gl.getAttribLocation(prog, "a_grid");
  gl.enableVertexAttribArray(aGrid);
  gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0);

  var uMvp = gl.getUniformLocation(prog, "u_mvp");
  var uTime = gl.getUniformLocation(prog, "u_time");
  var uScale = gl.getUniformLocation(prog, "u_scale");

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  /* --- Matrices ----------------------------------------------------------
     Column-major 4x4, composed explicitly rather than pre-multiplied by hand
     so the transform stays verifiable. */
  function identity(m) {
    m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
    m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
    m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
    m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
    return m;
  }

  function multiply(out, a, b) {
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        out[c * 4 + r] =
          a[r] * b[c * 4] +
          a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] +
          a[12 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }

  var proj = new Float32Array(16);
  var view = new Float32Array(16);
  var tmp = new Float32Array(16);
  var mvp = new Float32Array(16);

  function perspective(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    identity(out);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    out[15] = 0;
    return out;
  }

  // View = translate(0, yOff, tz) * rotateX(pitch) * rotateY(yaw)
  function viewMatrix(out, yaw, pitch, xOff, yOff, tz) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var cp = Math.cos(pitch), sp = Math.sin(pitch);

    // rotateX(pitch) * rotateY(yaw), written column-major.
    out[0] = cy;       out[1] = sp * sy;  out[2] = -cp * sy; out[3] = 0;
    out[4] = 0;        out[5] = cp;       out[6] = sp;       out[7] = 0;
    out[8] = sy;       out[9] = -sp * cy; out[10] = cp * cy; out[11] = 0;
    out[12] = xOff;    out[13] = yOff;    out[14] = tz;      out[15] = 1;
    return out;
  }

  function buildMvp(aspect, yaw, pitch, xOff) {
    perspective(proj, 0.9, aspect, 0.1, 30);
    // Sits low and right so the headline column stays clear.
    viewMatrix(view, yaw, pitch, xOff, -0.62, -3.2);
    return multiply(mvp, proj, view);
  }

  /* --- Sizing ------------------------------------------------------------ */
  var dpr = 1;
  var w = 0, h = 0;

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

  /* --- Pointer parallax --------------------------------------------------- */
  var targetX = 0, targetY = 0, curX = 0, curY = 0;

  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener(
      "pointermove",
      function (e) {
        targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true }
    );
  }

  /* --- Loop -------------------------------------------------------------- */
  var running = true;
  var raf = null;
  var start = performance.now();

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running && raf === null) raf = requestAnimationFrame(frame);
  });

  // Stop drawing once the hero is scrolled past — nothing is visible to update.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        running = entries[0].isIntersecting && !document.hidden;
        if (running && raf === null) raf = requestAnimationFrame(frame);
      },
      { threshold: 0 }
    ).observe(canvas);
  }

  // Drawing is split out so the first frame can be painted synchronously.
  // That guarantees the field is present immediately on load, and that a
  // throttled or backgrounded tab still shows a rendered scene rather than
  // an empty canvas.
  function draw(t) {
    curX += (targetX - curX) * 0.045;
    curY += (targetY - curY) * 0.045;

    var yaw = t * 0.035 + curX * 0.18;
    var pitch = 0.34 + curY * 0.07;
    var xOff = window.innerWidth < 900 ? 0 : 1.25;

    gl.uniformMatrix4fv(uMvp, false, buildMvp(w / h, yaw, pitch, xOff));
    gl.uniform1f(uTime, t);
    gl.uniform1f(uScale, dpr * (window.innerWidth < 700 ? 0.85 : 1.15));

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, N * N);
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
