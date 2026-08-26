/**
 * Scene B — the glass CTA band.
 *
 * Transmission samples the renderer's transmission pass, which re-renders the
 * scene's own opaque objects. It has no access to the DOM, so a transparent
 * canvas over a CSS gradient would refract nothing and look dead. The backdrop
 * is therefore painted into the scene, from the same design tokens the CSS
 * uses, so the two cannot drift apart.
 */
import { THREE, createStage, revealStage, token } from "./boot.js";
import { studioEnv } from "./env.js";

function backdropTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");

  ctx.fillStyle = token("--ink-100") || "#0b0f18";
  ctx.fillRect(0, 0, c.width, c.height);

  function glow(x, y, r, colour, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colour);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalAlpha = 1;
  }

  glow(c.width * 0.82, c.height * 0.1, c.width * 0.6, token("--brand") || "#4560e8", 0.5);
  glow(c.width * 0.08, c.height * 0.95, c.width * 0.5, token("--signal") || "#57e2e9", 0.22);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function mount(el) {
  // Transmission needs WebGL2 and costs a second render pass; skip it where
  // that is a poor trade.
  if (!document.createElement("canvas").getContext("webgl2")) return null;
  if (window.innerWidth < 768) return null;

  const stage = createStage(el, { fov: 38, distance: 6.4, antialias: true });
  if (!stage) return null;

  stage.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  stage.renderer.toneMappingExposure = 1.05;
  if ("transmissionResolutionScale" in stage.renderer) {
    // Halves the transmission pass resolution — the biggest perf lever here.
    stage.renderer.transmissionResolutionScale = 0.5;
  }

  const env = studioEnv(stage.renderer);
  stage.scene.environment = env.texture;

  const backTex = backdropTexture();
  backTex.wrapS = backTex.wrapT = THREE.ClampToEdgeWrapping;
  const backGeo = new THREE.PlaneGeometry(60, 30);
  const backMat = new THREE.MeshBasicMaterial({ map: backTex });
  const backdrop = new THREE.Mesh(backGeo, backMat);
  backdrop.position.z = -6;
  stage.scene.add(backdrop);

  const gemGeo = new THREE.IcosahedronGeometry(0.78, 0);
  const gemMat = new THREE.MeshPhysicalMaterial({
    transmission: 1,
    thickness: 1.2,
    ior: 1.45,
    roughness: 0.14,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    iridescence: 0.32,
    attenuationColor: new THREE.Color(token("--brand") || "#4560e8"),
    attenuationDistance: 2.6,
    envMapIntensity: 1.15,
    flatShading: true,
  });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  stage.scene.add(gem);

  // Keep it clear of the centred copy; the band is wide and the text is not.
  stage.onResize = function (width) {
    const aspect = width / Math.max(stage.height, 1);
    // Sit in the band's right margin, clear of the centred copy.
    gem.position.x = Math.max(2.2, Math.min(4.3, 1.35 * aspect));
  };
  stage.onResize(stage.width);

  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(-3, 2.5, 4);
  stage.scene.add(rim);

  stage.onFrame = function (t) {
    gem.rotation.y = t * 0.28;
    gem.rotation.x = Math.sin(t * 0.22) * 0.35;
    gem.position.y = Math.sin(t * 0.5) * 0.14;
  };

  stage.onDispose = function () {
    env.dispose();
  };

  revealStage(stage);
  return stage;
}
