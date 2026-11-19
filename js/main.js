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

// Короткие адреса разделов: /uslugi, /kontakty и т.д.
(function () {
  var map = {"services": "uslugi", "process": "kak-rabotaem", "advantages": "preimushchestva", "stack": "tehnologii", "faq": "voprosy", "contact": "kontakty"};
  var rev = {}; Object.keys(map).forEach(function (k) { rev[map[k]] = k; });
  function slug(p) { return p.replace(/^\/|\/$/g, '').replace(/index\.html$/, ''); }
  function go(id, smooth) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin) return;
    var s = slug(url.pathname);
    var onMain = !!document.getElementById('services');
    if (!onMain) return;
    var id = rev[s] || (url.hash && url.hash.slice(1)) || (s === '' ? 'top' : null);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    go(id, true);
    history.pushState({ id: id }, '', s ? '/' + s : '/');
  });
  window.addEventListener('popstate', function () {
    var s = slug(location.pathname); go(rev[s] || 'top', true);
  });
  window.addEventListener('load', function () {
    var s = slug(location.pathname);
    var id = rev[s] || (location.hash && location.hash.slice(1));
    if (location.hash && map[location.hash.slice(1)]) {
      history.replaceState(null, '', '/' + map[location.hash.slice(1)]);
    } else if (/index\.html$/.test(location.pathname)) {
      history.replaceState(null, '', '/');
    }
    if (id) go(id, false);
  });
})();
