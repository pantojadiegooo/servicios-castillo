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
        if (paqueteParam && presupuestoSelect) {
          var tierMap = {
            "Castle Bronze": "4.5-7.5k",
            "Castle Silver": "7.5-12.5k",
            "Castle Gold": "7.5-12.5k",
            "Castle Platinum": "12.5-24.5k",
            "Castle Diamond": "40k+"
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
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Client-side validation
      var requiredFields = form.querySelectorAll("[required]");
      var valid = true;
      var firstInvalid = null;
      requiredFields.forEach(function (field) {
        if (!field.value || !field.value.trim()) {
          valid = false;
          field.setAttribute("aria-invalid", "true");
          if (!firstInvalid) {
            firstInvalid = field;
          }
        } else {
          field.removeAttribute("aria-invalid");
        }
      });

      if (!valid) {
        status.textContent = "Faltan campos obligatorios. Por favor revisa el formulario.";
        status.className = "form-status is-error";
        status.setAttribute("role", "alert");
        if (firstInvalid && typeof firstInvalid.focus === "function") {
          firstInvalid.focus();
        }
        return;
      }

      // Check form endpoint
      var endpoint = form.getAttribute("data-endpoint") || form.getAttribute("action") || window.PUBLIC_FORM_ENDPOINT;
      if (!endpoint || endpoint.trim() === "" || endpoint === "null") {
        status.textContent = "El formulario requiere configurar la URL de recepción (PUBLIC_FORM_ENDPOINT) para transmitir la solicitud en producción.";
        status.className = "form-status is-error";
        status.setAttribute("role", "alert");
        if (typeof status.focus === "function") {
          status.focus();
        }
        return;
      }

      // UI state: enviando
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando solicitud...";
      }
      status.textContent = "Transmitiendo solicitud...";
      status.className = "form-status";
      status.setAttribute("role", "status");

      // Transmit data via fetch
      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function (value, key) {
        payload[key] = value;
      });

      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (res.ok) {
            // UI state: enviado
            status.textContent = "Gracias. Tu solicitud fue enviada correctamente. Te contactaremos en menos de 24h por correo o WhatsApp.";
            status.className = "form-status is-success";
            status.setAttribute("role", "status");
            if (typeof status.focus === "function") {
              status.focus();
            }
            form.reset();
          } else {
            return res.json().catch(function() { return {}; }).then(function(data) {
              var providerMsg = (data && data.errors && data.errors[0] && data.errors[0].message) ? data.errors[0].message : null;
              throw new Error(providerMsg || ("HTTP error " + res.status));
            });
          }
        })
        .catch(function (err) {
          // UI state: error (conserva los datos ingresados)
          var errorDetail = err && err.message ? err.message : "";
          status.textContent = "Ocurrió un error al enviar el formulario (" + errorDetail + "). Por favor reintenta o contáctanos por WhatsApp.";
          status.className = "form-status is-error";
          status.setAttribute("role", "alert");
          if (typeof status.focus === "function") {
            status.focus();
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Enviar Solicitud de Cotización";
          }
        });
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
