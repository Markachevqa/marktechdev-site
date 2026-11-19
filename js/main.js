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
    // Отраслевые страницы: отрасль, цель и пакет — в начало текста сообщения (обработчик принимает только message)
    var niche = form.getAttribute("data-niche");
    if (niche) {
      var kind = form.getAttribute("data-kind") || "Отрасль";
      var parts = [kind + ": " + niche];
      var goalSel = form.querySelector('[data-lead="goal"]');
      var pkgSel = form.querySelector('[data-lead="package"]');
      if (goalSel && goalSel.value) parts.push("Цель: " + goalSel.value);
      if (pkgSel && pkgSel.value) parts.push("Пакет: " + pkgSel.value);
      parts.push("Страница: " + location.pathname);
      var userMsg = String(data.get("message") || "").trim();
      data.set("message", "[" + parts.join(" | ") + "]\n\n" + (userMsg || "(без комментария)"));
    }
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
    if (!document.getElementById('services')) return;
    var s = slug(location.pathname); go(rev[s] || 'top', true);
  });
  window.addEventListener('load', function () {
    var s = slug(location.pathname);
    var id = rev[s] || (location.hash && location.hash.slice(1));
    if (location.hash && map[location.hash.slice(1)] && document.getElementById('services')) {
      history.replaceState(null, '', '/' + map[location.hash.slice(1)]);
    } else if (/index\.html$/.test(location.pathname)) {
      history.replaceState(null, '', location.pathname.replace(/index\.html$/, '') + location.hash);
    }
    if (id) go(id, false);
  });
})();

// Отраслевые посадочные страницы: калькулятор, выбор пакета/цели, липкая кнопка
(function () {
  if (!document.body.classList.contains("landing")) return;
  var form = document.getElementById("lead-form");
  var goalSel = form && form.querySelector('[data-lead="goal"]');
  var pkgSel = form && form.querySelector('[data-lead="package"]');

  function setSelect(sel, value) {
    if (!sel || !value) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === value) { sel.selectedIndex = i; return; }
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-package], a[data-goal]");
    if (!a) return;
    setSelect(pkgSel, a.getAttribute("data-package"));
    setSelect(goalSel, a.getAttribute("data-goal") || (a.getAttribute("data-package") ? "Расчёт стоимости" : null));
  });

  // Калькулятор потерь (оценка): ползунки + числовые поля, анимированные итоги
  var calc = document.getElementById("calc");
  if (calc) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fmtN = function (v) { return Math.round(v).toLocaleString("ru-RU"); };
    var vals = {};
    var setFill = function (range) {
      var mn = parseFloat(range.min) || 0, mx = parseFloat(range.max) || 100;
      var pct = Math.max(0, Math.min(100, ((parseFloat(range.value) - mn) / (mx - mn)) * 100));
      range.style.setProperty("--fill", pct + "%");
    };
    calc.querySelectorAll("[data-calc]").forEach(function (range) {
      var k = range.getAttribute("data-calc");
      var num = calc.querySelector('[data-calc-num="' + k + '"]');
      vals[k] = parseFloat(range.value) || 0;
      setFill(range);
      range.addEventListener("input", function () {
        vals[k] = parseFloat(range.value) || 0;
        if (num) num.value = range.value;
        setFill(range); update();
      });
      if (num) num.addEventListener("input", function () {
        var v = parseFloat(String(num.value).replace(",", "."));
        vals[k] = isFinite(v) && v > 0 ? v : 0;
        range.value = String(Math.min(Math.max(vals[k], parseFloat(range.min)), parseFloat(range.max)));
        setFill(range); update();
      });
    });
    var animate = function (id, to) {
      var el = document.getElementById(id);
      if (!el) return;
      var from = el._v || 0;
      el._v = to;
      if (el._raf) cancelAnimationFrame(el._raf);
      if (reduce || from === to) { el.textContent = fmtN(to); return; }
      var t0 = null, dur = 550;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmtN(from + (to - from) * e);
        if (k < 1) el._raf = requestAnimationFrame(step);
      };
      el._raf = requestAnimationFrame(step);
    };
    var last = {};
    var mode = calc.getAttribute("data-mode") || "crm";
    var update = function () {
      var p = Math.min(vals.p || 0, 100) / 100, r = Math.min(vals.r || 0, 100) / 100;
      var loss, routine, total, gain;
      if (mode === "docflow") {
        var hours = (vals.staff || 0) * (vals.docs || 0) * (vals.minutes || 0) / 60;
        loss = hours * (vals.rate || 0);
        routine = hours;
        total = loss;
        gain = loss * 0.5;
        last = { loss: loss, routine: routine, total: total, gain: gain, hours: hours, staff: vals.staff || 0, docs: vals.docs || 0, minutes: vals.minutes || 0, rate: vals.rate || 0, mode: mode };
      } else if (mode === "onec") {
        var hours = (vals.staff || 0) * (vals.h || 0) * 4.33;
        loss = hours * (vals.rate || 0);
        routine = hours;
        total = loss;
        gain = loss * r;
        last = { loss: loss, routine: routine, total: total, gain: gain, hours: hours, staff: vals.staff || 0, h: vals.h || 0, rate: vals.rate || 0, r: (vals.r || 0), mode: mode };
      } else {
        loss = (vals.n || 0) * p * (vals.check || 0);
        routine = (vals.h || 0) * 4.33 * (vals.rate || 0);
        total = loss + routine;
        gain = loss * r + routine * 0.5;
        last = { loss: loss, routine: routine, total: total, gain: gain, mode: mode };
      }
      animate("calc-total", total);
      animate("calc-mini", total);
      animate("calc-mini-gain", gain);
      animate("calc-total-year", total * 12);
      animate("calc-loss", loss);
      animate("calc-routine", routine);
      var ru = document.getElementById("calc-routine-unit");
      if (ru) ru.textContent = (mode === "docflow" || mode === "onec") ? "ч" : "₽";
      animate("calc-gain", gain);
      animate("calc-gain-year", gain * 12);
      var bl = document.getElementById("calc-bar-loss"), bg = document.getElementById("calc-bar-gain");
      if (bl) bl.style.width = total > 0 ? "100%" : "0%";
      if (bg) bg.style.width = total > 0 ? Math.round((gain / total) * 100) + "%" : "0%";
    };
    update();

    var cta = document.querySelector("[data-calc-cta]");
    var msg = document.getElementById("message");
    if (cta && msg) cta.addEventListener("click", function () {
      var unit = calc.getAttribute("data-unit") || "";
      var text;
      if (last.mode === "docflow") {
        text = "Расчёт с калькулятора на сайте: " + fmtN(vals.staff || 0) + " сотрудников, " + fmtN(vals.docs || 0) +
          " документов в месяц на сотрудника, " + fmtN(vals.minutes || 0) + " мин на документ, ставка " + fmtN(vals.rate || 0) +
          " ₽/ч. Оценка потерь — ~" + fmtN(last.total) + " ₽ в месяц (~" + fmtN(last.total * 12) +
          " ₽ в год), можно вернуть ~" + fmtN(last.gain) + " ₽ в месяц. Хочу обсудить, как вернуть эти деньги.";
      } else if (last.mode === "onec") {
        text = "Расчёт с калькулятора на сайте: " + fmtN(vals.staff || 0) + " сотрудников, " + fmtN(vals.h || 0) +
          " ч/нед на ручной ввод и сверки (на одного), ставка " + fmtN(vals.rate || 0) + " ₽/ч, доля, которую реально снять, " +
          fmtN(vals.r || 0) + "%. Оценка потерь — ~" + fmtN(last.total) + " ₽ в месяц (~" + fmtN(last.total * 12) +
          " ₽ в год), можно вернуть ~" + fmtN(last.gain) + " ₽ в месяц. Хочу обсудить, как вернуть эти деньги.";
      } else {
        text = "Расчёт с калькулятора на сайте: " + fmtN(vals.n || 0) + " " + unit + " в месяц, теряется " + fmtN(vals.p || 0) +
          "%, средний чек " + fmtN(vals.check || 0) + " ₽, ручной учёт " + fmtN(vals.h || 0) + " ч/нед. Оценка потерь — ~" +
          fmtN(last.total) + " ₽ в месяц (~" + fmtN(last.total * 12) + " ₽ в год), можно вернуть ~" + fmtN(last.gain) +
          " ₽ в месяц. Хочу обсудить, как вернуть эти деньги.";
      }
      if (!msg.value.trim() || msg.value === msg._auto) { msg.value = text; msg._auto = text; }
    });
  }

  // Липкая кнопка на мобильных: прячем, когда форма заявки на экране
  var sticky = document.getElementById("sticky-cta");
  var target = document.getElementById("zayavka");
  if (sticky && target && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { sticky.classList.toggle("is-hidden", en.isIntersecting); });
    }, { threshold: 0.15 }).observe(target);
  }
})();
