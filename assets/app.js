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
  var current = null, centerTimer = null;
  function setActive(key) {
    if (key === current) return;
    current = key;
    var active = null;
    chips.forEach(function (c) {
      var on = c.dataset.k === key;
      if (on) { c.setAttribute("aria-current", "true"); active = c; } else c.removeAttribute("aria-current");
    });
    if (active) {
      clearTimeout(centerTimer);
      centerTimer = setTimeout(function () {
        chipsEl.scrollTo({ left: active.offsetLeft - (chipsEl.clientWidth - active.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
      }, 180);
    }
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

  /* Search: match the name or category, ignoring punctuation and spaces ("t shirt", "tshirt" and "T-shirts" all work). */
  var input = document.getElementById("q"), statusEl = document.getElementById("status"), emptyEl = document.getElementById("empty");
  var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); };
  var cards = Array.prototype.map.call(document.querySelectorAll(".item"), function (card) {
    var sec = card.closest(".group"), hay = norm(card.querySelector("strong").textContent + " " + sec.querySelector("h2").firstChild.textContent + " " + (sec.dataset.alias || ""));
    return { card: card, sec: sec, hay: hay, squashed: hay.replace(/ /g, "") };
  });
  var heads = sections.map(function (s) {
    return { sec: s, small: s.querySelector("h2 small"), sr: s.querySelector("h2 .sr"), chip: chips.filter(function (c) { return c.dataset.k === s.id; })[0] };
  });
  function runSearch() {
    var q = norm(input.value), tokens = q ? q.split(" ") : [], squashedQ = q.replace(/ /g, ""), total = 0, per = {};
    cards.forEach(function (o) {
      var show = !q || tokens.every(function (t) { return t.length > 1 ? o.hay.indexOf(t) > -1 : (" " + o.hay).indexOf(" " + t) > -1; }) || o.squashed.indexOf(squashedQ) > -1;
      o.card.hidden = !show;
      if (show) { total++; per[o.sec.id] = (per[o.sec.id] || 0) + 1; }
    });
    heads.forEach(function (h) {
      var n = per[h.sec.id] || 0;
      h.sec.hidden = n === 0; if (h.chip) h.chip.hidden = n === 0;
      h.small.textContent = n; h.sr.textContent = ", " + n + (n === 1 ? " catalogue" : " catalogues");
    });
    document.getElementById("groups").classList.toggle("searching", !!q);
    emptyEl.hidden = total !== 0;
    statusEl.textContent = q ? (total === 0 ? "No catalogues found" : total + (total === 1 ? " catalogue found" : " catalogues found")) : "";
  }
  input.addEventListener("input", runSearch);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") input.blur(); }); /* closes the phone keyboard */

  /* On phones the rows swipe. Show it once: nudge the first row sideways, then let it spring back. */
  var phone = window.matchMedia && window.matchMedia("(max-width: 639px)");
  var firstRail = document.querySelector(".rail .grid");
  if (phone && firstRail && !reduce && "IntersectionObserver" in window) {
    var touched = false, stop = function () { touched = true; firstRail.classList.remove("nudging"); };
    ["touchstart", "pointerdown", "wheel"].forEach(function (ev) { firstRail.addEventListener(ev, stop, { passive: true }); });
    var hint = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      hint.disconnect();
      if (touched || !phone.matches || firstRail.scrollWidth <= firstRail.clientWidth + 8) return;
      setTimeout(function () {
        if (touched) return;
        firstRail.classList.add("nudging");
        firstRail.scrollTo({ left: 56, behavior: "smooth" });
        setTimeout(function () { if (!touched) firstRail.scrollTo({ left: 0, behavior: "smooth" }); }, 700);
        setTimeout(function () { firstRail.classList.remove("nudging"); }, 1500);
      }, 1100);
    }, { threshold: 0.7 });
    hint.observe(firstRail);
  }

  /* Enquiry list: tick catalogues, then send one WhatsApp message listing them. */
  var enq = document.getElementById("enq"), picked = [];
  function renderEnq() {
    var n = picked.length;
    enq.hidden = n === 0;
    document.body.classList.toggle("has-enq", n > 0);
    document.getElementById("enqCount").textContent = n;
    document.getElementById("enqLbl").textContent = n === 1 ? "catalogue selected" : "catalogues selected";
    var msg = "Hi, I'd like to enquire about these catalogues:\n" + picked.map(function (p) { return "- " + p; }).join("\n") + "\n(from your online catalogue)";
    Array.prototype.forEach.call(document.querySelectorAll(".ask"), function (b) {
      b.querySelector(".ask-t").textContent = b.getAttribute("aria-pressed") === "true" ? "Added" : (n ? "Add to enquiry" : "Enquiry");
    });
    document.getElementById("enqSend").href = "https://wa.me/919822325928?text=" + encodeURIComponent(msg);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".ask"), function (btn) {
    var name = btn.closest(".item").querySelector("strong").textContent;
    btn.addEventListener("click", function () {
      var i = picked.indexOf(name);
      if (i > -1) picked.splice(i, 1); else picked.push(name);
      btn.setAttribute("aria-pressed", i === -1 ? "true" : "false");
      renderEnq();
    });
  });
  document.getElementById("enqClear").addEventListener("click", function () {
    picked = [];
    Array.prototype.forEach.call(document.querySelectorAll(".ask"), function (b) { b.setAttribute("aria-pressed", "false"); });
    renderEnq();
  });

  document.getElementById("toTop").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
  document.getElementById("yr").textContent = new Date().getFullYear();
})();
