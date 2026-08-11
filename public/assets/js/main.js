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

  // Contact form — client-side handling & query param pre-selection
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
        var paqueteSelect = document.getElementById("paquete");
        if (paqueteParam && paqueteSelect) {
          for (var j = 0; j < paqueteSelect.options.length; j++) {
            if (paqueteSelect.options[j].value === paqueteParam || paqueteSelect.options[j].text.indexOf(paqueteParam) !== -1) {
              paqueteSelect.selectedIndex = j;
              break;
            }
          }
        }

        var presupuestoSelect = document.getElementById("presupuesto");
        if (paqueteParam && presupuestoSelect) {
          var tierMap = {
            "Castle Bronze": "5-10k",
            "Castle Silver": "5-10k",
            "Castle Gold": "10-35k",
            "Castle Platinum": "35-45k",
            "Castle Diamond": "45k+"
          };
          if (tierMap[paqueteParam]) {
            for (var k = 0; k < presupuestoSelect.options.length; k++) {
              if (presupuestoSelect.options[k].value === tierMap[paqueteParam]) {
                presupuestoSelect.selectedIndex = k;
                break;
              }
            }
          }
          if (necesidadSelect && !necesidadParam && !necesidadSelect.value) {
            necesidadSelect.value = "crear";
          }
        }
      } catch (err) {}
    }

    var status = document.getElementById("form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var requiredFields = form.querySelectorAll("[required]");
      var valid = true;
      requiredFields.forEach(function (field) {
        if (!field.value || !field.value.trim()) {
          valid = false;
          field.setAttribute("aria-invalid", "true");
        } else {
          field.removeAttribute("aria-invalid");
        }
      });

      if (!valid) {
        status.textContent = "Faltan campos obligatorios. Por favor revisa el formulario.";
        status.className = "form-status is-error";
        status.setAttribute("role", "alert");
        return;
      }

      status.textContent = "Gracias. Tu solicitud fue registrada. Te contactaremos pronto por correo o WhatsApp.";
      status.className = "form-status is-success";
      status.setAttribute("role", "status");
      form.reset();
    });
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
