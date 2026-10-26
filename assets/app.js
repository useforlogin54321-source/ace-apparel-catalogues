(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Cover images: try the local page-2 image, then Drive's first page, then show the seal card. */
  function coverFail(img) {
    var cover = img.parentNode;
    if (img.dataset.fb) { var s = img.dataset.fb; img.dataset.fb = ""; img.src = s; }
    else cover.classList.add("nocover");
  }
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && t.parentNode && t.parentNode.classList.contains("cover")) coverFail(t);
  }, true);
  Array.prototype.forEach.call(document.querySelectorAll(".cover img"), function (img) {
    if (img.complete && !img.naturalWidth) coverFail(img); /* failed before this script ran */
  });

  /* Category bar: highlight the section in view and keep that chip visible. */
  var chipsEl = document.getElementById("chips");
  var chips = Array.prototype.slice.call(chipsEl.querySelectorAll(".chip"));
  var current = null;
  function setActive(key) {
    if (key === current) return;
    current = key;
    var active = null;
    chips.forEach(function (c) {
      var on = c.dataset.k === key;
      if (on) { c.setAttribute("aria-current", "true"); active = c; } else c.removeAttribute("aria-current");
    });
    if (active) chipsEl.scrollTo({ left: active.offsetLeft - (chipsEl.clientWidth - active.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll(".group"));
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    var draw = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); draw.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    sections.forEach(function (s) { spy.observe(s); draw.observe(s); });

    /* Brand seal slides into the bar once the header has scrolled away. */
    var bar = document.getElementById("bar");
    new IntersectionObserver(function (es) { bar.classList.toggle("on", !es[0].isIntersecting); })
      .observe(document.querySelector(".hero-end"));
  } else {
    sections.forEach(function (s) { s.classList.add("in"); });
  }

  document.getElementById("toTop").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
  document.getElementById("yr").textContent = new Date().getFullYear();
})();
