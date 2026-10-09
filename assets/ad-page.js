// Model context and a repeat-inquiry entry point; native links work without JavaScript.
(function(){
  document.addEventListener("DOMContentLoaded", function(){
    const form = document.getElementById("lead-form");
    if (!form || form.dataset.formMode !== "ad") return;
    const model = document.getElementById("model-select"), type = document.getElementById("type-select");
    const requested = new URLSearchParams(location.search).get("model");
    if (["CF658","CF689","CF625"].includes(requested)) model.value = requested;
    document.addEventListener("click", function(e){
      const card = e.target.closest("[data-ad-model]");
      if (card && ["CF658","CF689","CF625"].includes(card.dataset.adModel)) model.value = card.dataset.adModel;
      if (e.target.closest("[data-ad-request]")) type.value = "specs";
      if (e.target.closest("[data-ad-again]")) {
        form.querySelector(".form-success").classList.remove("show");
        document.getElementById("f-name").focus();
      }
    });
  });
})();
