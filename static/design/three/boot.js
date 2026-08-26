/**
 * Shared three.js stage.
 *
 * Owns everything the individual scenes should not each reinvent: renderer
 * creation, the guard chain, one RAF ticker for the whole page, resize
 * handling, viewport gating and disposal. The guards deliberately mirror
 * static/design/hero.js rather than inventing a second set of conventions.
 *
 * A scene gets its own renderer, not a shared one: the CTA band is a rounded,
 * overflow-hidden box that a single fixed full-viewport canvas could not be
 * clipped to, and the two scenes want different renderer configurations. What
 * IS shared is the ticker, the visibility listener and the resize dispatcher.
 */
import * as THREE from "../vendor/three-0.185.1/three.module.min.js";

export { THREE };

/** Reads a design token so canvas colour cannot drift from the CSS. */
export function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ---------------------------------------------------------------- ticker */
const stages = new Set();
let raf = null;
let pageHidden = document.hidden;

function tick(now) {
  raf = null;
  let anyRunning = false;

  stages.forEach((stage) => {
    if (!stage.running || pageHidden || stage.destroyed) return;
    anyRunning = true;
    const t = (now - stage.start) / 1000;
    try {
      stage.onFrame(t, stage);
      stage.renderer.render(stage.scene, stage.camera);
    } catch (err) {
      // A broken scene must not take the page's other scene down with it.
      stage.running = false;
      if (window.console) console.error("scene frame failed", err);
    }
  });

  if (anyRunning) raf = requestAnimationFrame(tick);
}

function wake() {
  if (raf === null) raf = requestAnimationFrame(tick);
}

document.addEventListener("visibilitychange", () => {
  pageHidden = document.hidden;
  if (!pageHidden) wake();
});

/* --------------------------------------------------------------- resize */
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    stages.forEach((stage) => !stage.destroyed && sizeStage(stage));
    wake();
  }, 150);
});

function sizeStage(stage) {
  const rect = stage.mount.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (w === stage.width && h === stage.height) return;
  stage.width = w;
  stage.height = h;
  stage.renderer.setSize(w, h, false);
  stage.camera.aspect = w / h;
  stage.camera.updateProjectionMatrix();
  if (stage.onResize) stage.onResize(w, h, stage);
}

/* ---------------------------------------------------------------- stage */
/**
 * Creates a renderer and canvas inside `mount`.
 * Returns null if this device should not run a scene at all.
 */
export function createStage(mount, opts) {
  opts = opts || {};

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  mount.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: opts.antialias !== false,
      powerPreference: opts.powerPreference || "default",
    });
  } catch (err) {
    canvas.remove();
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(opts.fov || 45, 1, 0.1, 100);
  camera.position.z = opts.distance || 6;

  const stage = {
    mount, canvas, renderer, camera,
    scene: new THREE.Scene(),
    width: 0, height: 0,
    running: false,
    destroyed: false,
    start: performance.now(),
    onFrame: function () {},
    onResize: null,
    onDispose: null,
  };

  sizeStage(stage);
  stages.add(stage);

  // Pause when off screen; destroy only after a sustained absence, because
  // recreating a context and recompiling shaders is a visible stall.
  let idleTimer = null;
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries[0].isIntersecting;
      stage.running = visible && !stage.destroyed;
      if (visible) {
        clearTimeout(idleTimer);
        wake();
      } else {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => disposeStage(stage), 30000);
      }
    },
    { rootMargin: "200px" }
  );
  io.observe(mount);
  stage.io = io;

  // Mobile browsers drop contexts on backgrounded tabs.
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    stage.running = false;
  });

  window.addEventListener("pagehide", () => disposeStage(stage), { once: true });

  return stage;
}

/** Marks the stage live once its first frame is ready, for the CSS fade-in. */
export function revealStage(stage) {
  stage.canvas.classList.add("is-live");
  stage.mount.classList.add("is-live");
  wake();
}

/* -------------------------------------------------------------- disposal */
function disposeMaterial(material) {
  if (!material) return;
  Object.keys(material).forEach((key) => {
    const value = material[key];
    if (value && value.isTexture) value.dispose();
  });
  material.dispose();
}

export function disposeStage(stage) {
  if (!stage || stage.destroyed) return;
  stage.destroyed = true;
  stage.running = false;
  stages.delete(stage);

  if (stage.io) stage.io.disconnect();
  if (stage.onDispose) {
    try { stage.onDispose(stage); } catch (err) { /* keep tearing down */ }
  }

  stage.scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (Array.isArray(obj.material)) obj.material.forEach(disposeMaterial);
    else disposeMaterial(obj.material);
  });

  // scene.environment is a PMREM render target's texture; the target itself
  // is disposed by the scene that created it, in its onDispose.
  stage.scene.clear();
  stage.scene.environment = null;
  stage.scene.background = null;

  stage.renderer.dispose();
  // dispose() frees three's caches but leaves the GPU context alive until GC.
  if (stage.renderer.forceContextLoss) stage.renderer.forceContextLoss();
  stage.canvas.remove();
}
