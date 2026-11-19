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
    var endpoint = form.getAttribute("data-endpoint") || "";
    var isPlaceholder = endpoint === "placeholder" || /YOUR_FORM_ID/i.test(form.getAttribute("action") || "");

    if (!isPlaceholder) {
      return;
    }

    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var name = (form.elements.namedItem("name") || {}).value || "";
    var contact = (form.elements.namedItem("contact") || {}).value || "";
    var message = (form.elements.namedItem("message") || {}).value || "";
    var email = "yumarkachev@yandex.ru";

    var body =
      "Имя: " + name + "\n" +
      "Контакт: " + contact + "\n\n" +
      message;

    var mailto =
      "mailto:" + email +
      "?subject=" + encodeURIComponent("Заявка с сайта Марк-Тех") +
      "&body=" + encodeURIComponent(body);

    showStatus(
      true,
      "Форма ещё не подключена к серверу (см. TODO в коде). Открываю письмо на " + email + " — отправьте его из почтовой программы. Чтобы заявки приходили автоматически, укажите endpoint Formspree или аналога."
    );

    window.location.href = mailto;
  });
})();
