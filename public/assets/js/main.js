(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Contact form — real transmission handling & query param pre-selection
  var form = document.getElementById("contact-form");
  if (form) {
    if (window.location.search) {
      try {
        var params = new URLSearchParams(window.location.search);

        var necesidadParam = params.get("necesidad");
        var necesidadSelect = document.getElementById("necesidad");
        if (necesidadParam && necesidadSelect) {
          for (var i = 0; i < necesidadSelect.options.length; i++) {
            if (necesidadSelect.options[i].value === necesidadParam) {
              necesidadSelect.selectedIndex = i;
              break;
            }
          }
        }

        var paqueteParam = params.get("paquete");
        var presupuestoSelect = document.getElementById("presupuesto");
        var descripcionTextarea = document.getElementById("descripcion");

        if (paqueteParam && presupuestoSelect) {
          var normalizedPaquete = paqueteParam.toLowerCase();

          var tierMap = {
            "castle iron": "iron",
            "castle bronze": "bronze",
            "castle silver": "silver",
            "castle gold": "gold",
            "castle platinum": "platinum",
            "castle diamond": "diamond"
          };

          var mappedValue = tierMap[normalizedPaquete];

          if (mappedValue) {
            for (var k = 0; k < presupuestoSelect.options.length; k++) {
              if (presupuestoSelect.options[k].value === mappedValue) {
                presupuestoSelect.selectedIndex = k;
                break;
              }
            }
          }

          if (necesidadSelect && !necesidadParam && !necesidadSelect.value) {
            necesidadSelect.value = "crear";
          }

          if (descripcionTextarea && !descripcionTextarea.value) {
            descripcionTextarea.value = "Interesado en cotizar: " + paqueteParam + ".";
          }
        }
      } catch (err) {}
    }
  }

  // Active nav link by pathname
  var here = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === here) {
      a.setAttribute("aria-current", "page");
    }
  });
})();
