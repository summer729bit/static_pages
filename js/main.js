/* MAN LUO, FGA — interactions */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var header = doc.getElementById("site-header");
  var menu = doc.getElementById("menu");
  var menuBtn = doc.getElementById("menu-btn");
  var menuLabel = doc.getElementById("menu-btn-label");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------------- */
  var lastFocused = null;
  var focusTimer = 0;

  function menuIsOpen() {
    return body.classList.contains("menu-open");
  }

  function setMenu(open) {
    if (!menu || !menuBtn) return;

    /* Any pending focus move belongs to the state we are leaving. */
    if (focusTimer) {
      window.clearTimeout(focusTimer);
      focusTimer = 0;
    }

    body.classList.toggle("menu-open", open);
    body.classList.toggle("is-locked", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (menuLabel) menuLabel.textContent = open ? "Close" : "Menu";

    if (open) {
      lastFocused = doc.activeElement;
      if ("inert" in menu) menu.inert = false;
      var first = menu.querySelector("a, button");
      if (first) {
        focusTimer = window.setTimeout(function () {
          focusTimer = 0;
          if (menuIsOpen() && first) first.focus({ preventScroll: true });
        }, 120);
      }
    } else {
      /* Keep the panel out of the tab order while it animates closed. */
      if ("inert" in menu) menu.inert = true;
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
      lastFocused = null;
    }
  }

  /* The panel starts closed, so it starts out of the tab order. */
  if (menu && "inert" in menu) menu.inert = true;

  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(!menuIsOpen());
    });
  }

  if (menu) {
    menu.addEventListener("click", function (event) {
      var node = event.target;
      if (!node || node.nodeType !== 1) return;
      var link = node.closest("a");
      if (link) setMenu(false);
    });
  }

  doc.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuIsOpen()) {
      setMenu(false);
      return;
    }

    if (event.key === "Tab" && menuIsOpen() && menu && menuBtn) {
      /* The close control lives in the header, so it belongs to the ring. */
      var focusable = [menuBtn].concat(
        Array.prototype.slice.call(menu.querySelectorAll("a[href], button:not([disabled])"))
      );
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------------------------------------------------------------------
     Skip link: move the caret into the content, not just the scroll position
     --------------------------------------------------------------------- */
  var skipLink = doc.querySelector(".skip-link");
  var mainEl = doc.getElementById("main");
  if (skipLink && mainEl) {
    skipLink.addEventListener("click", function () {
      /* Let the browser perform the jump, then place focus where it landed. */
      window.setTimeout(function () { mainEl.focus({ preventScroll: true }); }, 0);
    });
  }

  /* ---------------------------------------------------------------------
     Header: solid on scroll, light type over dark chapters
     --------------------------------------------------------------------- */
  var darkSections = [
    doc.getElementById("gemstones"),
    doc.getElementById("design")
  ].filter(Boolean);

  var headerZone = 0;
  var ticking = false;

  function updateHeader() {
    var y = window.scrollY || window.pageYOffset;
    headerZone = header ? header.offsetHeight : 64;

    if (header) {
      header.classList.toggle("is-solid", y > 24);
    }

    var probe = y + headerZone * 0.55;
    var overDark = darkSections.some(function (section) {
      var top = section.getBoundingClientRect().top + y;
      var bottom = top + section.offsetHeight;
      return probe >= top && probe <= bottom;
    });

    if (header) {
      header.classList.toggle("is-on-dark", overDark && !menuIsOpen());
    }

    ticking = false;
  }

  function requestHeaderUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateHeader);
  }

  window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
  window.addEventListener("resize", requestHeaderUpdate);
  updateHeader();

  /* ---------------------------------------------------------------------
     Scroll reveals
     --------------------------------------------------------------------- */
  var revealItems = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal]"));

  if (!("IntersectionObserver" in window) || reduceMotion.matches) {
    revealItems.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Subtle parallax on chapter imagery (desktop / fine pointers only)
     --------------------------------------------------------------------- */
  var parallaxItems = Array.prototype.slice.call(doc.querySelectorAll(".chapter__bg img"));
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var wideViewport = window.matchMedia("(min-width: 901px)");
  var parallaxQueued = false;

  function parallaxEnabled() {
    return !reduceMotion.matches && finePointer.matches && wideViewport.matches;
  }

  function runParallax() {
    parallaxQueued = false;
    if (!parallaxEnabled()) {
      parallaxItems.forEach(function (img) {
        img.style.removeProperty("--shift");
      });
      return;
    }

    var vh = window.innerHeight;
    parallaxItems.forEach(function (img) {
      var section = img.closest(".chapter");
      if (!section) return;
      var rect = section.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > vh + 80) return;

      // -1 (below viewport) → 0 (centered) → 1 (above viewport)
      var progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      var clamped = Math.max(-1, Math.min(1, progress));
      img.style.setProperty("--shift", (clamped * 3.2).toFixed(2) + "%");
    });
  }

  function requestParallax() {
    if (parallaxQueued) return;
    parallaxQueued = true;
    window.requestAnimationFrame(runParallax);
  }

  if (parallaxItems.length) {
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax);
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", requestParallax);
      finePointer.addEventListener("change", requestParallax);
      wideViewport.addEventListener("change", requestParallax);
    }
    runParallax();
  }

  /* ---------------------------------------------------------------------
     Nav highlight for the section in view
     --------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll(".nav a"));
  var tracked = navLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      var el = id && id.charAt(0) === "#" ? doc.querySelector(id) : null;
      return el ? { link: link, section: el } : null;
    })
    .filter(Boolean);

  if (tracked.length && "IntersectionObserver" in window) {
    var clearCurrent = function () {
      tracked.forEach(function (item) {
        item.link.removeAttribute("aria-current");
      });
    };

    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          /* Only ever one section can own the band; mark it and clear the rest. */
          tracked.forEach(function (item) {
            var active = item.section === entry.target;
            if (active) item.link.setAttribute("aria-current", "true");
            else item.link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    tracked.forEach(function (item) { navObserver.observe(item.section); });

    /* The hero sits above the first tracked section, so nothing intersects
       the detection band there. Watch it and drop the highlight on return. */
    var hero = doc.getElementById("top");
    if (hero) {
      var heroObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) clearCurrent();
          });
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      heroObserver.observe(hero);
    }
  }

  /* ---------------------------------------------------------------------
     Close the menu when the layout swaps the hamburger for the desktop nav.
     The stylesheet shows the nav from 1025px up, so that is the boundary the
     menu has to match — a wider value here would leave the overlay open with
     its only close control hidden.
     --------------------------------------------------------------------- */
  var desktopQuery = window.matchMedia("(min-width: 1025px)");
  var onDesktop = function (event) {
    if (event.matches && menuIsOpen()) setMenu(false);
  };
  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", onDesktop);
  } else if (typeof desktopQuery.addListener === "function") {
    desktopQuery.addListener(onDesktop);
  }

  /* Belt and braces: if the close control ever stops being rendered while
     the panel is open, the page would be trapped behind it. Close instead. */
  var guardQueued = false;
  function guardMenu() {
    if (guardQueued) return;
    guardQueued = true;
    window.requestAnimationFrame(function () {
      guardQueued = false;
      if (!menuIsOpen() || !menuBtn) return;
      if (window.getComputedStyle(menuBtn).display === "none") setMenu(false);
    });
  }
  window.addEventListener("resize", guardMenu, { passive: true });
})();
