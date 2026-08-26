/**
 * Entry point for the three.js scenes.
 *
 * A classic deferred script that never imports three itself. It runs the guard
 * chain and only then dynamically imports the module graph, so pages with no
 * scene — and every first paint — pay nothing but one querySelectorAll.
 */
(function () {
  "use strict";

  var mounts = document.querySelectorAll("[data-scene]");
  if (!mounts.length) return;

  // Same conventions as static/design/hero.js.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // three has been WebGL2-only since r163.
  try {
    if (!document.createElement("canvas").getContext("webgl2")) return;
  } catch (err) {
    return;
  }

  // Respect explicit user and device constraints rather than spending their
  // battery and data on decoration.
  var conn = navigator.connection;
  if (conn && conn.saveData) return;
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return;

  // The version query cannot be interpolated into a static .js file, so it is
  // chained from the script tag through the whole module graph.
  var V = "";
  if (document.currentScript && document.currentScript.dataset.v) {
    V = "?v=" + document.currentScript.dataset.v;
  }

  var SCENES = { lattice: "./lattice.js", glass: "./glass.js" };
  var started = false;

  function start() {
    if (started) return;
    started = true;

    import("/design/three/boot.js" + V)
      .then(function () {
        var jobs = [];
        Array.prototype.forEach.call(mounts, function (el) {
          var name = el.getAttribute("data-scene");
          if (!SCENES[name]) return;
          jobs.push(
            import("/design/three/" + name + ".js" + V).then(function (mod) {
              try {
                mod.mount(el);
              } catch (err) {
                if (window.console) console.error("scene " + name + " failed", err);
              }
            })
          );
        });
        return Promise.all(jobs);
      })
      .catch(function (err) {
        // A failed import must leave the CSS fallback in place, not throw.
        if (window.console) console.error("three.js scenes unavailable", err);
      });
  }

  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          io.disconnect();
          start();
          return;
        }
      }
    },
    { rootMargin: "300px" }
  );
  Array.prototype.forEach.call(mounts, function (el) { io.observe(el); });
})();
