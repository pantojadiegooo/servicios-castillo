(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      nav.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menú");
      });
    });
  }



  // Active nav link by pathname (clean URLs support)
  var currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".main-nav a[href]").forEach(function (a) {
    var href = a.getAttribute("href").replace(/\/$/, "") || "/";
    if (href === currentPath || (currentPath !== "/" && href !== "/" && currentPath.startsWith(href))) {
      a.setAttribute("aria-current", "page");
    }
  });

  // Header scroll state with throttling
  var header = document.querySelector(".site-header");
  if (header) {
    var checkScroll = function () {
      if (window.scrollY > 20) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
  }

  // Scroll reveal with subtle staggered hierarchy
  if ("IntersectionObserver" in window) {
    var reveals = document.querySelectorAll(".reveal");
    if (reveals.length > 0) {
      var revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -40px 0px", threshold: 0.08 }
      );
      reveals.forEach(function (el) {
        revealObserver.observe(el);
      });
    }
  }
})();
