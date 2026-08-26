/**
 * Scene A — the instanced lattice.
 *
 * A few thousand instanced points that morph slowly between three formations:
 * an atom, a globe, and a wireframe cube — the shapes LearnXR teaches with.
 * All three target positions live in instanced attributes and the blend runs
 * in the vertex shader, so a formation change costs one uniform write per
 * frame and no CPU matrix work.
 */
import { THREE, createStage, revealStage, token } from "./boot.js";

/** Evenly distributed points on a sphere. */
function fibonacciSphere(i, count, radius) {
  const k = i + 0.5;
  const phi = Math.acos(1 - (2 * k) / count);
  const theta = Math.PI * (1 + Math.sqrt(5)) * k;
  return [
    Math.cos(theta) * Math.sin(phi) * radius,
    Math.sin(theta) * Math.sin(phi) * radius,
    Math.cos(phi) * radius,
  ];
}

/** Three elliptical orbitals plus a nucleus. */
function atomPoint(i, count, radius) {
  const nucleus = Math.floor(count * 0.12);
  if (i < nucleus) {
    const p = fibonacciSphere(i, nucleus, radius * 0.16);
    return p;
  }
  const j = i - nucleus;
  const ring = j % 3;
  const around = (j / (count - nucleus)) * Math.PI * 2 * 9;
  const rx = Math.cos(around) * radius;
  const ry = Math.sin(around) * radius * 0.34;
  const tilt = (ring * Math.PI) / 3;
  return [
    rx * Math.cos(tilt) - ry * Math.sin(tilt),
    rx * Math.sin(tilt) + ry * Math.cos(tilt),
    Math.sin(around * 1.7) * radius * 0.14,
  ];
}

/** Points scattered along the twelve edges of a cube. */
function cubeEdgePoint(i, count, radius) {
  const EDGES = [
    [0,0,0, 1,0,0],[0,0,0, 0,1,0],[0,0,0, 0,0,1],
    [1,1,1, 0,1,1],[1,1,1, 1,0,1],[1,1,1, 1,1,0],
    [1,0,0, 1,1,0],[1,0,0, 1,0,1],
    [0,1,0, 1,1,0],[0,1,0, 0,1,1],
    [0,0,1, 1,0,1],[0,0,1, 0,1,1],
  ];
  const e = EDGES[i % 12];
  const t = ((i * 7919) % 1000) / 1000;
  return [
    ((e[0] + (e[3] - e[0]) * t) - 0.5) * radius * 1.5,
    ((e[1] + (e[4] - e[1]) * t) - 0.5) * radius * 1.5,
    ((e[2] + (e[5] - e[2]) * t) - 0.5) * radius * 1.5,
  ];
}

export function mount(el) {
  const stage = createStage(el, {
    fov: 42,
    distance: 7.2,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!stage) return null;

  const COUNT = window.innerWidth < 900 ? 1400 : 3200;
  const RADIUS = 2.5;

  const atom = new Float32Array(COUNT * 3);
  const globe = new Float32Array(COUNT * 3);
  const cube = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const a = atomPoint(i, COUNT, RADIUS);
    const g = fibonacciSphere(i, COUNT, RADIUS);
    const c = cubeEdgePoint(i, COUNT, RADIUS);
    atom.set(a, i * 3);
    globe.set(g, i * 3);
    cube.set(c, i * 3);
    seed[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  // One vertex per instance — gl.POINTS, so no per-instance quad is needed.
  geometry.setAttribute("position", new THREE.BufferAttribute(atom.slice(), 3));
  geometry.setAttribute("aAtom", new THREE.BufferAttribute(atom, 3));
  geometry.setAttribute("aGlobe", new THREE.BufferAttribute(globe, 3));
  geometry.setAttribute("aCube", new THREE.BufferAttribute(cube, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

  const brand = new THREE.Color(token("--brand") || "#4560e8");
  const signal = new THREE.Color(token("--signal") || "#57e2e9");

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uWeights: { value: new THREE.Vector3(1, 0, 0) },
      uTime: { value: 0 },
      uBrand: { value: brand },
      uSignal: { value: signal },
      uScale: { value: 1 },
    },
    vertexShader: [
      "attribute vec3 aAtom;",
      "attribute vec3 aGlobe;",
      "attribute vec3 aCube;",
      "attribute float aSeed;",
      "uniform vec3 uWeights;",
      "uniform float uTime;",
      "uniform float uScale;",
      "varying float vDepth;",
      "varying float vSeed;",
      "void main() {",
      "  vec3 p = aAtom * uWeights.x + aGlobe * uWeights.y + aCube * uWeights.z;",
      // A little drift so the formations never look frozen.
      "  p += vec3(",
      "    sin(uTime * 0.6 + aSeed * 6.28),",
      "    cos(uTime * 0.5 + aSeed * 5.13),",
      "    sin(uTime * 0.4 + aSeed * 4.11)",
      "  ) * 0.045;",
      "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
      "  vDepth = -mv.z;",
      "  vSeed = aSeed;",
      "  gl_Position = projectionMatrix * mv;",
      "  gl_PointSize = uScale * (34.0 / max(-mv.z, 0.8));",
      "}",
    ].join("\n"),
    fragmentShader: [
      "precision mediump float;",
      "uniform vec3 uBrand;",
      "uniform vec3 uSignal;",
      "varying float vDepth;",
      "varying float vSeed;",
      "void main() {",
      "  vec2 d = gl_PointCoord - vec2(0.5);",
      "  float r = dot(d, d);",
      "  if (r > 0.25) discard;",
      "  float soft = smoothstep(0.25, 0.0, r);",
      "  vec3 col = mix(uBrand, uSignal, vSeed);",
      "  float fade = 1.0 - smoothstep(5.0, 11.0, vDepth);",
      "  gl_FragColor = vec4(col, soft * fade * 0.55);",
      "}",
    ].join("\n"),
  });

  const points = new THREE.Points(geometry, material);
  stage.scene.add(points);

  // atom → globe → cube → atom, holding on each.
  const HOLD = 6.5;
  const BLEND = 2.5;
  const CYCLE = (HOLD + BLEND) * 3;
  const w = new THREE.Vector3();

  function ease(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  stage.onResize = function (width) {
    material.uniforms.uScale.value = Math.max(0.6, Math.min(1.4, width / 1100));
  };
  stage.onResize(stage.width);

  stage.onFrame = function (t) {
    material.uniforms.uTime.value = Math.max(0, t);

    // The RAF timestamp can land marginally before the stage's start time, and
    // a negative phase floors to -1, which setComponent rejects.
    const tt = Math.max(0, t);
    const phase = (tt % CYCLE) / (HOLD + BLEND);
    const index = Math.floor(phase);
    const within = phase - index;
    const k = within < HOLD / (HOLD + BLEND)
      ? 0
      : ease((within - HOLD / (HOLD + BLEND)) / (BLEND / (HOLD + BLEND)));

    const from = ((index % 3) + 3) % 3;
    const to = (from + 1) % 3;
    w.set(0, 0, 0);
    w.setComponent(from, 1 - k);
    w.setComponent(to, k);
    material.uniforms.uWeights.value.copy(w);

    points.rotation.y = t * 0.12;
    points.rotation.x = Math.sin(t * 0.16) * 0.14;
  };

  revealStage(stage);
  return stage;
}
