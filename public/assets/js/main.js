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
<<<<<<< HEAD
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
=======
        var descInput = document.getElementById("descripcion");

        if (paqueteParam) {
          if (presupuestoSelect) {
            var pLower = paqueteParam.toLowerCase();
            // 1. Try matching option value
            var matched = false;
            for (var j = 0; j < presupuestoSelect.options.length; j++) {
              var optVal = presupuestoSelect.options[j].value.toLowerCase();
              if (optVal && (pLower === optVal || pLower.indexOf(optVal) !== -1 || optVal.indexOf(pLower) !== -1)) {
                presupuestoSelect.selectedIndex = j;
                matched = true;
>>>>>>> 19bbef4 (feat: implement modular assembly hologram hero in paquetes and cinematic hero in index)
                break;
              }
            }
            // 2. If not matched, try matching option text
            if (!matched) {
              for (var k = 0; k < presupuestoSelect.options.length; k++) {
                if (presupuestoSelect.options[k].text.toLowerCase().indexOf(pLower) !== -1) {
                  presupuestoSelect.selectedIndex = k;
                  matched = true;
                  break;
                }
              }
            }
          }

          // Infer default necesidad if not explicitly specified
          if (necesidadSelect && (!necesidadParam || !necesidadSelect.value)) {
            var pl = paqueteParam.toLowerCase();
            if (pl.indexOf("iron") !== -1) necesidadSelect.value = "iron";
            else if (pl.indexOf("bronze") !== -1 || pl.indexOf("silver") !== -1 || pl.indexOf("gold") !== -1 || pl.indexOf("platinum") !== -1 || pl.indexOf("diamond") !== -1) necesidadSelect.value = "crear";
            else if (pl.indexOf("checkup") !== -1) necesidadSelect.value = "checkup";
            else if (pl.indexOf("audit") !== -1) necesidadSelect.value = "auditar";
            else if (pl.indexOf("rescue") !== -1) necesidadSelect.value = "mejorar";
            else if (pl.indexOf("emergency") !== -1) necesidadSelect.value = "urgencia";
            else if (pl.indexOf("care") !== -1) necesidadSelect.value = "cuidado";
            else if (pl.indexOf("gate") !== -1) necesidadSelect.value = "gate-licencia";
          }

          if (descInput && !descInput.value) {
            descInput.value = "Interesado en cotizar: " + paqueteParam + ".";
          }
        }
      } catch (err) {}
    }
  }

  // Active nav link by pathname
  var here = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === here || (here === "" && href === "/index.html")) {
      a.setAttribute("aria-current", "page");
    }
  });
})();
