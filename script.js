/* ============================================================
   worotyns.ovh — interactions
   Track switching, theme, nav, reveal, video facade
   ============================================================ */

(function () {
  "use strict";

  var root = document.documentElement;
  var LANES = ["biz", "tech"];

  function store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /* ---------------- Track (lane) switching ---------------- */

  var laneButtons = Array.prototype.slice.call(
    document.querySelectorAll("[data-lane-set]")
  );

  function currentLane() {
    var lane = root.getAttribute("data-lane");
    return LANES.indexOf(lane) === -1 ? "tech" : lane;
  }

  function paintLane(lane) {
    root.setAttribute("data-lane", lane);

    laneButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-lane-set") === lane;
      btn.setAttribute("aria-pressed", String(active));
      // the compact switch in the header also updates the gate cards
      if (btn.classList.contains("gate")) {
        var state = btn.querySelector('[data-state-for="' + btn.getAttribute("data-lane-set") + '"]');
        if (state) state.textContent = active ? "Current" : "Select";
      }
    });

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var accent = getComputedStyle(root).getPropertyValue("--accent").trim();
      if (accent) meta.setAttribute("content", accent);
    }
  }

  function setLane(lane, options) {
    options = options || {};
    if (LANES.indexOf(lane) === -1 || lane === currentLane()) {
      if (options.scrollHome) scrollToHero();
      return;
    }

    store("lane", lane);

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (document.startViewTransition && !reduced) {
      document.startViewTransition(function () {
        paintLane(lane);
      });
    } else {
      // avoid a sea of transitions fighting each other on older browsers
      root.classList.add("no-transition");
      paintLane(lane);
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          root.classList.remove("no-transition");
        });
      });
    }

    if (options.scrollHome) scrollToHero();
  }

  function scrollToHero() {
    var hero = document.getElementById("main") || document.body;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    hero.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  laneButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isGate = btn.classList.contains("gate");
      setLane(btn.getAttribute("data-lane-set"), { scrollHome: !isGate });
    });
  });

  // keyboard shortcuts: B = business, T = technology
  document.addEventListener("keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    var tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.target && event.target.isContentEditable) return;

    var key = event.key ? event.key.toLowerCase() : "";
    if (key === "b") setLane("biz", { scrollHome: false });
    if (key === "t") setLane("tech", { scrollHome: false });
  });

  // \u2191 from a subpage or a link with ?track=
  (function applyUrlTrack() {
    var param = new URLSearchParams(window.location.search).get("track");
    if (param && LANES.indexOf(param) !== -1 && param !== currentLane()) {
      paintLane(param);
      store("lane", param);
    } else {
      paintLane(currentLane());
    }
  })();

  /* ---------------- Theme ---------------- */

  var themeToggle = document.getElementById("theme-toggle");

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    store("theme", theme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function (e) {
        if (!read("theme")) root.setAttribute("data-theme", e.matches ? "dark" : "light");
      });
  }

  /* ---------------- Mobile menu ---------------- */

  var menuToggle = document.getElementById("menu-toggle");
  var navLinks = document.getElementById("nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
        navLinks.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- Scroll reveal ---------------- */

  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------- Video facade (no YouTube JS until clicked) ---------------- */

  document.querySelectorAll(".video").forEach(function (wrap) {
    var facade = wrap.querySelector(".video-facade");
    if (!facade) return;

    facade.addEventListener("click", function () {
      var id = wrap.getAttribute("data-video-id");
      if (!id) return;

      var iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        id +
        "?autoplay=1&rel=0&modestbranding=1";
      iframe.title = wrap.getAttribute("data-video-title") || "Video";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";

      wrap.innerHTML = "";
      wrap.appendChild(iframe);
    });
  });

  /* a recording may have no thumbnail yet (fresh upload, unlisted) —
     step down maxres → hq, then fall back to a plain card instead of
     showing a broken image */
  document.querySelectorAll(".video-facade img").forEach(function (img) {
    function degrade() {
      var facade = img.parentElement;
      if (!/maxresdefault/.test(img.src)) {
        img.remove();
        if (facade) facade.classList.add("video-facade--plain");
        return;
      }
      img.src = img.src.replace("maxresdefault", "hqdefault");
    }

    img.addEventListener("error", degrade);
    if (img.complete && img.naturalWidth === 0) degrade();
  });

  /* ---------------- Footer year ---------------- */

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
