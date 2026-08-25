/**
 * Altie Reality — site behaviour.
 *
 * Progressive enhancement only: every page is fully readable and navigable
 * with this file blocked. Nothing here is required to render content.
 */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Header: shadow once scrolled ------------------------------------- */
  var header = document.querySelector(".site-header");
  var toTop = document.querySelector(".to-top");

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-stuck", y > 12);
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* --- Navigation -------------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  var desktop = window.matchMedia("(min-width: 1081px)");

  function closeNav() {
    if (!navToggle || !nav) return;
    navToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-locked");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.classList.toggle("nav-locked", !open);
      if (open) closeAllMenus();
    });
  }

  /* --- Mega menus (disclosure pattern) ----------------------------------- */
  var triggers = Array.prototype.slice.call(
    document.querySelectorAll("[data-menu-trigger]")
  );

  function panelFor(trigger) {
    return document.getElementById(trigger.getAttribute("aria-controls"));
  }

  function setMenu(trigger, open) {
    var panel = panelFor(trigger);
    trigger.setAttribute("aria-expanded", String(open));
    if (panel) panel.classList.toggle("is-open", open);
    if (!open) {
      delete trigger.dataset.hoverOpen;
      delete trigger.dataset.pinned;
    }
  }

  function closeAllMenus(except) {
    triggers.forEach(function (t) {
      if (t !== except) setMenu(t, false);
    });
  }

  triggers.forEach(function (trigger) {
    var panel = panelFor(trigger);
    if (!panel) return;

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      var open = trigger.getAttribute("aria-expanded") === "true";

      // On desktop the pointer may already have opened this menu on hover.
      // Clicking then should pin it open, not close it the instant the user
      // reaches for it.
      if (open && trigger.dataset.hoverOpen && !trigger.dataset.pinned) {
        delete trigger.dataset.hoverOpen;
        trigger.dataset.pinned = "1";
        return;
      }

      closeAllMenus(trigger);
      setMenu(trigger, !open);
      if (!open) trigger.dataset.pinned = "1";
    });

    // Hover is a desktop affordance layered over the click disclosure.
    var wrapper = trigger.closest(".nav__item");
    if (wrapper) {
      var timer;
      wrapper.addEventListener("mouseenter", function () {
        if (!desktop.matches) return;
        clearTimeout(timer);
        closeAllMenus(trigger);
        if (trigger.getAttribute("aria-expanded") !== "true") {
          setMenu(trigger, true);
          trigger.dataset.hoverOpen = "1";
        }
      });
      wrapper.addEventListener("mouseleave", function () {
        if (!desktop.matches) return;
        // A menu the user deliberately clicked stays put.
        if (trigger.dataset.pinned) return;
        timer = setTimeout(function () {
          setMenu(trigger, false);
        }, 140);
      });
    }
  });

  document.addEventListener("click", function (e) {
    if (!desktop.matches) return;
    if (e.target.closest(".nav__item") || e.target.closest(".nav-toggle")) return;
    closeAllMenus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeAllMenus();
    if (nav && nav.classList.contains("is-open")) {
      closeNav();
      if (navToggle) navToggle.focus();
    }
  });

  desktop.addEventListener("change", function () {
    closeAllMenus();
    closeNav();
  });

  /* --- Reveal on scroll -------------------------------------------------- */
  var revealables = document.querySelectorAll("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealables.forEach(function (el) {
      // Stagger siblings so a grid resolves as a sequence, not a flash.
      if (el.getAttribute("data-reveal") === "stagger") {
        var index = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.setProperty("--reveal-delay", Math.min(index, 6) * 70 + "ms");
      }
      io.observe(el);
    });

    // Failsafe: if the observer never fires for something in view, show it
    // anyway rather than leaving a hole in the page.
    window.setTimeout(function () {
      revealables.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight * 1.5) el.classList.add("is-visible");
      });
    }, 2500);
  }

  /* --- Forms ------------------------------------------------------------- */
  function setStatus(node, state, message) {
    if (!node) return;
    node.hidden = false;
    node.setAttribute("data-state", state);
    node.textContent = message;
  }

  function fieldError(form, name, message) {
    var input = form.querySelector('[name="' + name + '"]');
    if (!input) return;
    var slot = input.parentNode.querySelector(".field__error");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (slot) slot.textContent = message || "";
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* Contact — posts to the existing /api/contact endpoint. */
  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    var contactStatus = contactForm.querySelector(".form-status");
    var contactBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = Object.fromEntries(new FormData(contactForm).entries());
      var ok = true;

      ["name", "subject", "message"].forEach(function (key) {
        var empty = !String(data[key] || "").trim();
        fieldError(contactForm, key, empty ? "This field is required." : "");
        if (empty) ok = false;
      });

      var badEmail = !EMAIL_RE.test(String(data.email || "").trim());
      fieldError(contactForm, "email", badEmail ? "Enter a valid email address." : "");
      if (badEmail) ok = false;

      if (!ok) {
        setStatus(contactStatus, "error", "Please correct the highlighted fields.");
        var firstBad = contactForm.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      contactBtn.setAttribute("aria-busy", "true");
      setStatus(contactStatus, "pending", "Sending your message…");

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          return res.json();
        })
        .then(function () {
          contactForm.reset();
          setStatus(
            contactStatus,
            "success",
            "Thank you — your message has been sent. We usually reply within two business days."
          );
        })
        .catch(function () {
          setStatus(
            contactStatus,
            "error",
            "We could not send your message. Please email info.altiereality@gmail.com directly."
          );
        })
        .finally(function () {
          contactBtn.removeAttribute("aria-busy");
        });
    });
  }

  /* Newsletter — posts to the existing /subscribe endpoint. */
  var newsForm = document.getElementById("newsletter-form");
  if (newsForm) {
    var newsStatus = newsForm.parentNode.querySelector(".form-status");
    var newsBtn = newsForm.querySelector('button[type="submit"]');

    newsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = String(new FormData(newsForm).get("email") || "").trim();

      if (!EMAIL_RE.test(email)) {
        setStatus(newsStatus, "error", "Enter a valid email address.");
        return;
      }

      newsBtn.setAttribute("aria-busy", "true");

      fetch("/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      })
        .then(function (res) { return res.json().then(function (b) { return { ok: res.ok, body: b }; }); })
        .then(function (r) {
          if (r.ok) {
            newsForm.reset();
            setStatus(newsStatus, "success", "You're subscribed. Thank you.");
          } else {
            setStatus(newsStatus, "error", r.body.message || "Subscription failed.");
          }
        })
        .catch(function () {
          setStatus(newsStatus, "error", "Something went wrong. Please try again.");
        })
        .finally(function () { newsBtn.removeAttribute("aria-busy"); });
    });
  }

  /* --- Timeline filter --------------------------------------------------- */
  var filterInput = document.getElementById("timeline-filter");
  if (filterInput) {
    var entries = Array.prototype.slice.call(document.querySelectorAll("[data-entry]"));
    var groups = Array.prototype.slice.call(document.querySelectorAll("[data-year-group]"));
    var count = document.getElementById("timeline-count");

    filterInput.addEventListener("input", function () {
      var q = filterInput.value.trim().toLowerCase();
      var shown = 0;

      entries.forEach(function (el) {
        var match = !q || el.getAttribute("data-entry").indexOf(q) !== -1;
        el.hidden = !match;
        if (match) shown++;
      });

      // Hide a year heading when nothing under it survives the filter.
      groups.forEach(function (group) {
        var any = group.querySelector("[data-entry]:not([hidden])");
        group.hidden = !any;
      });

      if (count) {
        count.textContent = q
          ? shown + (shown === 1 ? " milestone" : " milestones") + " matching “" + filterInput.value.trim() + "”"
          : entries.length + " milestones";
      }
    });
  }
})();
