/**
 * A dark studio environment, built from core three and baked with PMREM.
 *
 * Transmission renders as flat grey without an environment map. RoomEnvironment
 * is unusable here on two counts: it imports the bare specifier 'three', which
 * would force an import map the rest of this setup does not need, and it is a
 * bright white studio, which lights glass silver-grey against a near-black page.
 *
 * A plain gradient would avoid both problems but gives no specular highlights,
 * and faceted glass without highlights reads as frosted plastic. So this builds
 * a dark box with a few emissive panels: crisp highlights that sweep across the
 * facets as the object turns, no HDR file, nothing from examples/jsm.
 */
import { THREE, token } from "./boot.js";

const cache = new WeakMap();

export function studioEnv(renderer) {
  if (cache.has(renderer)) return cache.get(renderer);

  const scene = new THREE.Scene();
  const disposables = [];

  function panel(w, h, colour, intensity, place) {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colour).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    place(mesh);
    scene.add(mesh);
    disposables.push(geo, mat);
    return mesh;
  }

  // Dark shell so reflections fall off to near-black, matching the page.
  const shellGeo = new THREE.BoxGeometry(12, 12, 12);
  const shellMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(token("--ink-000") || "#04060b"),
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(shellGeo, shellMat));
  disposables.push(shellGeo, shellMat);

  const brand = token("--brand") || "#4560e8";
  const signal = token("--signal") || "#57e2e9";

  // Key: a broad warm-white bar above and left.
  panel(7, 2.4, "#ffffff", 3.2, (m) => {
    m.position.set(-2.6, 4.4, 1.2);
    m.rotation.set(Math.PI / 2.3, 0, 0.25);
  });
  // Brand fill from the right.
  panel(5, 5, brand, 2.1, (m) => {
    m.position.set(5.2, 0.4, -1.4);
    m.rotation.set(0, -Math.PI / 2.4, 0);
  });
  // Cyan kicker from below-left, for the edge sparkle.
  panel(4.2, 3.2, signal, 1.7, (m) => {
    m.position.set(-4.6, -2.4, 1.8);
    m.rotation.set(0, Math.PI / 2.6, 0);
  });
  // A thin bright streak that reads as a specular line on the facets.
  panel(0.5, 8, "#ffffff", 4.0, (m) => {
    m.position.set(1.6, 0.5, -4.6);
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.03);
  pmrem.dispose();

  // The source scene was one-shot input; free it immediately.
  disposables.forEach((d) => d.dispose());
  scene.clear();

  const entry = {
    texture: target.texture,
    dispose: function () {
      // Disposing the render target disposes its texture; the generator's own
      // dispose() above does not cover this.
      target.dispose();
      cache.delete(renderer);
    },
  };
  cache.set(renderer, entry);
  return entry;
}
