(function () {
  "use strict";

  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var form = document.getElementById("lead-form");
  if (!form) return;

  var status = document.getElementById("form-status");

  function showStatus(ok, text) {
    if (!status) return;
    status.textContent = text;
    status.classList.add("is-visible");
    status.classList.toggle("is-ok", ok);
    status.classList.toggle("is-err", !ok);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; }
    showStatus(true, "Отправляем заявку…");
    var data = new FormData(form);
    data.delete("consent");
    fetch(form.action, { method: "POST", headers: { "Accept": "application/json" }, body: data })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.success, j: j }; }); })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          showStatus(true, "Спасибо! Заявка отправлена — мы ответим в течение рабочего дня.");
        } else {
          throw new Error("send failed");
        }
      })
      .catch(function () {
        showStatus(false, "Не удалось отправить заявку. Напишите нам на info@marktechdev.ru — ответим в течение рабочего дня.");
      })
      .then(function () { if (btn) { btn.disabled = false; } });
  });
})();
