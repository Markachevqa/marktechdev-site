/* МаркДев — анимированная схема «Так может работать ваш склад». Без внешних библиотек. */
(function () {
  "use strict";
  var DUR = [3800, 5400, 4600, 5200, 4800];
  var TOTAL = DUR.reduce(function (a, b) { return a + b; }, 0);
  var CARGO_OFF = 27, TRUCK = { x: 779, y: 385 };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ease(x) { x = Math.max(0, Math.min(1, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function seg(p, a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function Scene(root) {
    var q = function (s) { return root.querySelector(s); };
    this.root = root;
    this.fl = q(".sc-fl"); this.cargo = q(".sc-cargo");
    this.r1 = q(".sc-r1"); this.r1d = q(".sc-r1d"); this.r2 = q(".sc-r2"); this.r2d = q(".sc-r2d");
    this.L1 = this.r1.getTotalLength(); this.L2 = this.r2.getTotalLength();
    [[this.r1d, this.L1], [this.r2d, this.L2]].forEach(function (a) { a[0].style.strokeDasharray = a[1] + " " + a[1]; });
    this.chips = [].slice.call(root.querySelectorAll(".sc-chip"));
    this.caps = [].slice.call(root.querySelectorAll(".sc-cap"));
    this.btn = q(".sc-toggle");
    this.t = 0; this.last = 0; this.visible = false; this.hover = false; this.user = false; this.raf = 0; this.step = -1;
    var self = this;
    this.chips.forEach(function (c, i) {
      c.addEventListener("click", function () { self.jump(i); });
    });
    if (this.btn) this.btn.addEventListener("click", function () {
      if (reduce) return;
      self.user = !self.user; self.hover = false; self.syncBtn(); self.kick();
    });
    if (reduce) {
      root.classList.add("sc-static");
      this.renderStatic(4);
      return;
    }
    root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { self.hover = true; } });
    root.addEventListener("pointerleave", function () { self.hover = false; self.kick(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; self.kick(); }, { threshold: 0.15 }).observe(root);
    } else { this.visible = true; }
    document.addEventListener("visibilitychange", function () { self.kick(); });
    this.render(0, 0);
    this.kick();
  }

  Scene.prototype.syncBtn = function () {
    if (!this.btn) return;
    this.btn.setAttribute("aria-pressed", this.user ? "true" : "false");
    this.btn.querySelector("span").textContent = this.user ? "Продолжить" : "Пауза";
    this.root.classList.toggle("sc-paused", this.user);
  };
  Scene.prototype.running = function () { return this.visible && !this.hover && !this.user && !document.hidden; };
  Scene.prototype.kick = function () {
    var self = this;
    if (this.raf || !this.running()) return;
    this.last = 0;
    this.raf = requestAnimationFrame(function loop(now) {
      if (!self.running()) { self.raf = 0; return; }
      if (self.last) self.t = (self.t + Math.min(100, now - self.last)) % TOTAL;
      self.last = now;
      self.renderT(self.t);
      self.raf = requestAnimationFrame(loop);
    });
  };
  Scene.prototype.jump = function (i) {
    if (reduce) { this.renderStatic(i); return; }
    var s = 0; for (var k = 0; k < i; k++) s += DUR[k];
    this.t = s; this.hover = false; this.user = false; this.syncBtn();
    this.renderT(this.t); this.kick();
  };
  Scene.prototype.renderT = function (t) {
    var i = 0; while (i < 4 && t >= DUR[i]) { t -= DUR[i]; i++; }
    this.render(i, t / DUR[i]);
  };
  Scene.prototype.pose = function (path, L, u) {
    var l = Math.max(0, Math.min(L, u * L));
    var a = path.getPointAtLength(Math.max(0, Math.min(L - 1, l)));
    var b = path.getPointAtLength(Math.max(1, Math.min(L, l + 1)));
    var p = path.getPointAtLength(l);
    return { x: p.x, y: p.y, a: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  };
  Scene.prototype.render = function (i, p, full) {
    var r = this.root, pose, ang, carry = false, cargoOp = 0, cx, cy;
    var d1 = 0, d2 = 0, show1 = false, show2 = false;
    if (i === 0) { pose = this.pose(this.r1, this.L1, 0); }
    else if (i === 1) { show1 = true; d1 = ease(seg(p, .14, .97)); pose = this.pose(this.r1, this.L1, d1); }
    else if (i === 2) {
      show1 = true; d1 = 1; pose = this.pose(this.r1, this.L1, 1);
      ang = -90 * ease(seg(p, 0, .18)) + 90 * ease(seg(p, .84, 1));
      pose.a = ang;
      if (p > .5) { carry = true; cargoOp = ease(seg(p, .5, .62)); }
    }
    else if (i === 3) { show2 = true; carry = true; cargoOp = 1; d2 = ease(seg(p, .1, .96)); pose = this.pose(this.r2, this.L2, d2); }
    else { show2 = true; d2 = 1; pose = this.pose(this.r2, this.L2, 1); cargoOp = 1; }
    if (full) { show1 = show2 = true; d1 = d2 = 1; }
    this.fl.setAttribute("transform", "translate(" + pose.x.toFixed(1) + " " + pose.y.toFixed(1) + ") rotate(" + pose.a.toFixed(1) + ")");
    var rad = pose.a * Math.PI / 180;
    cx = pose.x + Math.cos(rad) * CARGO_OFF; cy = pose.y + Math.sin(rad) * CARGO_OFF;
    var ca = pose.a;
    if (i === 4) { var m = ease(seg(full ? 1 : p, .08, .4)); cx = lerp(cx, TRUCK.x, m); cy = lerp(cy, TRUCK.y, m); }
    if (i === 2 && !carry) cargoOp = 0;
    this.cargo.setAttribute("transform", "translate(" + cx.toFixed(1) + " " + cy.toFixed(1) + ") rotate(" + ca.toFixed(1) + ")");
    this.cargo.style.opacity = cargoOp;
    this.r1.style.opacity = this.r1d.style.opacity = show1 ? "" : 0;
    this.r2.style.opacity = this.r2d.style.opacity = show2 ? "" : 0;
    this.r1d.style.strokeDashoffset = this.L1 * (1 - d1);
    this.r2d.style.strokeDashoffset = this.L2 * (1 - d2);
    var sub = "";
    if (i === 2) sub = p < .2 ? "turn" : p < .52 ? "scan" : "ok";
    if (i === 4) sub = p < .42 ? "load" : "sync";
    if (full) sub = i === 4 ? "sync" : (i === 2 ? "ok" : "");
    if (r.getAttribute("data-sub") !== sub) r.setAttribute("data-sub", sub);
    if (i !== this.step) {
      this.step = i;
      r.setAttribute("data-step", String(i + 1));
      this.chips.forEach(function (c, k) { c.classList.toggle("is-active", k === i); c.classList.toggle("is-done", k < i); c.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      this.caps.forEach(function (c, k) { c.hidden = k !== i; });
      var bar = this.chips[i].parentNode, ch = this.chips[i];
      if (bar.scrollWidth > bar.clientWidth + 2) {
        var left = ch.offsetLeft - bar.offsetLeft - (bar.clientWidth - ch.offsetWidth) / 2;
        try { bar.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" }); } catch (e) { bar.scrollLeft = left; }
      }
    }
    this.chips[i].style.setProperty("--p", full ? 1 : p.toFixed(3));
  };
  Scene.prototype.renderStatic = function (i) {
    var P = [0, 1, .7, 1, 1];
    this.render(i, P[i], true);
    this.chips.forEach(function (c) { c.style.setProperty("--p", 1); });
  };

  function init() {
    [].forEach.call(document.querySelectorAll("[data-sklad-scene]"), function (el) {
      try { el.__scene = new Scene(el); } catch (e) { /* схема остаётся статичной */ }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
