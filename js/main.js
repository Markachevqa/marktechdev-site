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
    // Фиксируем факт и редакцию согласия, чтобы в письме-заявке было подтверждение его получения
    data.set("consent", "Согласие на обработку ПД дано (редакция от 19.11.2026, https://marktechdev.ru/soglasie.html)");
    var fallback = "Не удалось отправить заявку. Напишите нам на info@marktechdev.ru — ответим в течение рабочего дня.";
    fetch(form.action, { method: "POST", mode: "cors", credentials: "omit", headers: { "Accept": "application/json" }, body: data })
      .then(function (r) {
        return r.json()
          .catch(function () { return {}; })
          .then(function (j) { return { ok: r.ok && j.success === true, j: j }; });
      })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          showStatus(true, "Спасибо! Заявка отправлена — мы ответим в течение рабочего дня.");
        } else {
          showStatus(false, (res.j && res.j.message) ? res.j.message : fallback);
        }
      })
      .catch(function () {
        showStatus(false, fallback);
      })
      .then(function () { if (btn) { btn.disabled = false; } });
  });
})();

// Чистый адрес: якорные ссылки прокручивают страницу без #... в адресной строке
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin || url.pathname.replace(/index\.html$/, '') !== location.pathname.replace(/index\.html$/, '')) return;
    if (!url.hash) return;
    var el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', location.pathname.replace(/index\.html$/, ''));
  });
  window.addEventListener('load', function () {
    if (location.hash || /index\.html$/.test(location.pathname)) {
      var el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) el.scrollIntoView();
      history.replaceState(null, '', location.pathname.replace(/index\.html$/, ''));
    }
  });
})();
