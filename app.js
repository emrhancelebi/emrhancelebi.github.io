/* Emirhan Çelebi · Portfolyo — ana ekran orkestrası.
   Kapalı bilgisayar → (hover) büyür → (tık) döner ve açılır → kamera ekranın içine girer →
   portfolyo tüm sayfayı kaplar: iş grubu sekmeleri + sonsuz proje akışı → (kart) proje detayı. */
(function () {
  "use strict";
  var E = window.EC, D = document, W = window;
  var reduced = E.motion.reduced, EASE = E.motion.easing;
  D.documentElement.classList.add("js");

  /* Küçük cubic-bezier çözücü (JS tarafında kaydırma eğrisi için). */
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    return function (t) {
      var u = t;
      for (var i = 0; i < 8; i++) { var d = (3 * ax * u + 2 * bx) * u + cx, e = ((ax * u + bx) * u + cx) * u - t; if (Math.abs(e) < 1e-5 || !d) break; u -= e / d; }
      u = Math.min(1, Math.max(0, u));
      return ((ay * u + by) * u + cy) * u;
    };
  }

  /* ───────── Projeler: data/projects.json'dan okunur (Çalışma Alanı yazar).
     Dosya okunamazsa (ör. sayfa doğrudan dosyadan açıldıysa) yer tutucu gruplar kullanılır. ───────── */
  function stub(prefix, cat, n) { return { id: prefix + "-" + n, title: "Proje " + n, category: cat, year: "2026", intro: "Bu projenin açıklaması yakında eklenecek." }; }
  var FALLBACK = { groups: [
    { id: "ux", label: "UX Design", device: "phone", projects: [1, 2, 3].map(function (n) { return stub("ux", "UX DESIGN", n); }) },
    { id: "kimlik", label: "Kurumsal Kimlik Tasarımı", projects: [1, 2, 3, 4].map(function (n) { return stub("kimlik", "KURUMSAL KİMLİK", n); }) }
  ] };
  var GROUPS = [];
  /* Kart 4:5 dikey, detay 2:1 yatay kapak ister; her grup iki kopya tutar. */
  function setData(d) {
    GROUPS = (d && d.groups || []).filter(function (g) { return g && g.projects && g.projects.length; }).map(function (g, gi) {
      var items = g.projects.map(function (p, i) {
        return { title: p.title || "Adsız proje", num: i + 1, category: p.category || "", year: p.year || "", role: p.role || "", tools: p.tools || "",
          intro: p.intro || "", problem: p.problem || "", approach: p.approach || "", result: p.result || "",
          gallery: (p.gallery || []).filter(Boolean), cardImage: p.cardImage || "", coverImage: p.coverImage || "",
          phoneScreens: (p.phoneScreens || []).filter(Boolean), caseStudy: p.caseStudy || "" };
      });
      var key = String(g.id || "g" + gi).toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "g" + gi;
      return { key: key, label: g.label || "Grup", items: items, phone: g.device === "phone",
        cards: items.map(function (p) { return Object.assign({}, p); }), detail: items.map(function (p) { return Object.assign({}, p); }) };
    });
    if (!GROUPS.length && d !== FALLBACK) setData(FALLBACK);
  }
  setData(FALLBACK);
  var dataReady = fetch("data/projects.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(setData).catch(function () {});

  var ui = { phase: "closed" }; // closed · opening · portfolio · project · closing
  var groupIdx = 0;
  var hero = D.getElementById("hero"), left = D.getElementById("left"), right = D.getElementById("right");
  var slot = D.getElementById("slot");

  /* ───────── Kapak görselleri: kodla çizilir ───────── */
  var TONES = ["#f1e6f8", "#e6d7f1", "#fdf9fe"];
  function canvas(w, h) { var c = D.createElement("canvas"); c.width = w; c.height = h; return c; }
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  /* Yer tutucu: tasarım sistemindeki kart kapağı gibi lavanta tonu ve Fraunces numara. */
  function coverNum(n, tone, w, h, size) {
    var c = canvas(w, h), g = c.getContext("2d");
    g.fillStyle = tone; g.fillRect(0, 0, w, h);
    if (tone === TONES[2]) { g.strokeStyle = "rgba(37,73,134,.16)"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); }
    g.globalAlpha = 0.9; g.fillStyle = "#103273"; g.font = '300 ' + size + 'px Fraunces, Georgia, serif';
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(pad2(n), w / 2, h / 2); g.globalAlpha = 1;
    return c;
  }
  /* Telefonlu kartın kapağı bir sahne: numara sol üstte küçülür, ortada telefonun basacağı yumuşak temas gölgesi. */
  function coverStage(n, tone, w, h) {
    var c = canvas(w, h), g = c.getContext("2d");
    g.fillStyle = tone; g.fillRect(0, 0, w, h);
    if (tone === TONES[2]) { g.strokeStyle = "rgba(37,73,134,.16)"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); }
    g.fillStyle = "rgba(16,50,115,.12)"; g.beginPath(); g.ellipse(w / 2, h * 0.935, w * 0.2, h * 0.018, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.9; g.fillStyle = "#103273"; g.font = "300 " + Math.round(w * 0.16) + "px Fraunces, Georgia, serif";
    g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText(pad2(n), w * 0.07, w * 0.2); g.globalAlpha = 1;
    return c;
  }
  /* Laptop ekranı dokusu için: kapak + düz telefon çizimi. */
  function withFlatPhone(src) {
    if (!W.PhoneCovers) return src;
    var c = canvas(800, 1000), g = c.getContext("2d");
    g.drawImage(src, 0, 0, 800, 1000); W.PhoneCovers.drawFlatPhone(g, 800, 1000);
    return c;
  }
  var screenCovers = {};
  /* Görseli olan projede kendi görseli, olmayanda tasarım sistemindeki gibi numaralı lavanta kapak. */
  function buildCovers() {
    GROUPS.forEach(function (gr) {
      var list = screenCovers[gr.key] = [];
      gr.items.forEach(function (p, i) {
        var tone = TONES[i % 3], tall = gr.phone ? coverStage(p.num, tone, 800, 1000) : coverNum(p.num, tone, 800, 1000, 300);
        list.push(gr.phone ? withFlatPhone(tall) : tall);
        if (p.cardImage) {
          gr.cards[i].cover = p.cardImage;
          var img = new Image();
          img.onload = function () { list[i] = gr.phone ? withFlatPhone(img) : img; if (scene) scene.redraw(); };
          img.src = p.cardImage;
        } else gr.cards[i].cover = tall.toDataURL("image/jpeg", 0.9);
        gr.detail[i].cover = p.coverImage || p.cardImage || coverNum(p.num, tone, 1600, 800, 360).toDataURL("image/jpeg", 0.9);
      });
    });
    if (scene) scene.redraw();
  }

  /* ───────── Ekran dokusu (3D modelin ekranına çizilir) ─────────
     Tam ekran portfolyonun 1440 × 900'deki düzeni ölçeklenerek çizilir; kamera ekrana girerken
     doku ile DOM sayfası üst üste oturur. */
  var LAY = { navY: 42, padX: 32, h2Y: 135, tabsY: 92, tabsH: 54, cardY: 245, cardW: 340, cardH: 425, gap: 32, titleY: 43, metaY: 72, captionY: 867 };
  function mixHex(a, b, t) {
    var A = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), B = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return "rgb(" + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(",") + ")";
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function drawCover(g, img, x, y, w, h) {
    var ia = img.width / img.height, da = w / h, sw = img.width, sh = img.height, sx = 0, sy = 0;
    if (da < ia) { sw = sh * da; sx = (img.width - sw) / 2; } else { sh = sw / da; sy = (img.height - sh) / 2; }
    g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  function drawScreen(g, sw, sh, S) {
    var L = S.light;
    g.globalAlpha = 1; g.fillStyle = mixHex("#0b1430", "#f9f2fc", L); g.fillRect(0, 0, sw, sh);
    if (L < 0.02) return;
    var A = S.bar * L, W0 = 1440, gr = GROUPS[groupIdx];
    g.save(); g.scale(sw / W0, sh / 900);
    g.textBaseline = "alphabetic"; g.textAlign = "left"; g.globalAlpha = A;
    g.fillStyle = "#103273"; g.font = '400 20px Fraunces, Georgia, serif'; g.fillText("Emirhan Çelebi", LAY.padX, LAY.navY + 7);
    g.fillStyle = "#fdf9fe"; rr(g, W0 - 32 - 110, LAY.navY - 22, 110, 44, 22); g.fill();
    g.strokeStyle = "rgba(37,73,134,.16)"; g.lineWidth = 1; g.stroke();
    g.fillStyle = "#254986"; g.font = '500 12px "Geist Mono", ui-monospace, monospace'; g.fillText("KAPAT", W0 - 32 - 66, LAY.navY + 5);
    g.font = '400 48px Fraunces, Georgia, serif'; g.fillText("Portfolyo", LAY.padX, LAY.h2Y);
    /* sekmeler */
    g.font = '500 15px Geist, system-ui, sans-serif';
    var widths = GROUPS.map(function (x) { return g.measureText(x.label).width + 40; });
    var tw = widths.reduce(function (a, b) { return a + b; }, 0) + 4 * (GROUPS.length - 1) + 10, tx = W0 - 32 - tw;
    g.fillStyle = "#fdf9fe"; rr(g, tx, LAY.tabsY, tw, LAY.tabsH, LAY.tabsH / 2); g.fill(); g.stroke();
    var cx = tx + 5;
    GROUPS.forEach(function (x, k) {
      if (k === groupIdx) { g.fillStyle = "#103273"; rr(g, cx, LAY.tabsY + 5, widths[k], LAY.tabsH - 10, (LAY.tabsH - 10) / 2); g.fill(); }
      g.fillStyle = k === groupIdx ? "#f9f2fc" : "#254986"; g.fillText(x.label, cx + 20, LAY.tabsY + LAY.tabsH / 2 + 5);
      cx += widths[k] + 4;
    });
    /* kartlar: ProjectCard (full) akışının ilk karesi */
    var covers = screenCovers[gr.key] || [], n = gr.cards.length;
    for (var i = 0; i * (LAY.cardW + LAY.gap) < W0; i++) {
      var p = gr.cards[i % n], a = clamp01(S.cards[i % S.cards.length]) * L; if (a <= 0) continue;
      var x = LAY.padX + i * (LAY.cardW + LAY.gap), y = LAY.cardY + (1 - a) * 18;
      g.globalAlpha = a;
      g.save(); rr(g, x, y, LAY.cardW, LAY.cardH, 24); g.clip();
      if (covers[i % n]) drawCover(g, covers[i % n], x, y, LAY.cardW, LAY.cardH); else { g.fillStyle = TONES[(i % n) % 3]; g.fillRect(x, y, LAY.cardW, LAY.cardH); }
      g.restore();
      g.fillStyle = "#254986"; g.font = '420 28px Fraunces, Georgia, serif'; g.textAlign = "left"; g.fillText(p.title, x + 4, y + LAY.cardH + LAY.titleY);
      g.fillStyle = "#516899"; g.font = '500 12px "Geist Mono", ui-monospace, monospace';
      g.fillText(p.category, x + 4, y + LAY.cardH + LAY.metaY); g.textAlign = "right"; g.fillText(p.year, x + LAY.cardW - 4, y + LAY.cardH + LAY.metaY); g.textAlign = "left";
    }
    g.globalAlpha = A; g.fillStyle = "#516899"; g.font = '400 14px Geist, system-ui, sans-serif';
    g.fillText("Sürükle, kaydır ya da sadece izle.", LAY.padX, LAY.captionY);
    g.restore(); g.globalAlpha = 1;
  }

  /* ───────── Sahne ───────── */
  var scene = null, cssMode = false;
  function mountScene() {
    scene = E.LaptopScene.mount(slot, { stage: hero, projects: GROUPS[0].cards, drawScreen: drawScreen, onFallback: function (impl) { cssMode = true; bindRoot(impl.el); } });
    cssMode = !scene.el.classList.contains("ec-scene--gl");
    bindRoot(scene.el);
  }
  function lapEl() { return scene.el; }
  function bindRoot(el) {
    el.setAttribute("data-cursor-label", "AÇ");
    el.setAttribute("role", "button"); el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", "Bilgisayarı aç ve seçili işleri gör");
    el.style.cursor = "pointer";
    el.addEventListener("click", function () { if (ui.phase === "closed") openLaptop(); });
    el.addEventListener("keydown", function (ev) { if ((ev.key === "Enter" || ev.key === " ") && ui.phase === "closed") { ev.preventDefault(); openLaptop(); } });
    el.addEventListener("pointerenter", function (ev) { if (ev.pointerType !== "touch" && ui.phase === "closed") setLap("hover"); });
    el.addEventListener("pointerleave", function () { if (ui.phase === "closed") setLap("rest"); });
    el.addEventListener("focus", function () { if (ui.phase === "closed" && el.matches(":focus-visible")) setLap("hover"); });
    el.addEventListener("blur", function () { if (ui.phase === "closed") setLap("rest"); });
  }

  /* Bilgisayarın yuvadaki konumu: dinlenme, hover büyümesi, açılırken sahnenin ortasına yolculuk. */
  function openTransform() {
    var hb = hero.getBoundingClientRect(), sb = slot.getBoundingClientRect();
    var lw = sb.width || 400, narrow = hb.width < 860;
    var s = narrow ? (hb.width * 0.92) / lw : Math.min((hb.width * 0.64) / lw, (hb.height * 0.76) / (lw * 0.86));
    s = Math.max(1, s);
    var tx = hb.left + hb.width / 2 - (sb.left + sb.width / 2);
    var ty = hb.top + hb.height * (narrow ? 0.56 : 0.57) - (sb.top + sb.height * 0.56);
    return "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
  }
  function setLap(mode) {
    var el = lapEl();
    el.classList.toggle("is-travel", mode === "open");
    el.classList.toggle("is-return", mode === "return");
    el.style.transform = mode === "hover" ? "scale(1.1)" : mode === "open" ? openTransform() : "none";
  }

  var skills = D.getElementById("skills"), label = null;
  function fadeOutSide() {
    closeSkill();
    if (reduced()) { [right, skills, label].forEach(function (el) { el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "both" }); }); return; }
    label.animate([{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 -10px" }], { duration: 260, easing: EASE.standard, fill: "both" });
    right.animate([{ opacity: 1, transform: "none", filter: "blur(0px)" }, { opacity: 0, transform: "translateX(40px)", filter: "blur(4px)" }],
      { duration: 420, easing: EASE.standard, fill: "both" });
    skills.animate([{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 24px" }], { duration: 420, easing: EASE.standard, fill: "both" });
  }
  function fadeInSide() {
    right.animate([{ opacity: 0, transform: reduced() ? "none" : "translateX(40px)", filter: reduced() ? "none" : "blur(4px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }],
      { duration: reduced() ? 220 : 640, easing: EASE.emphasized, delay: reduced() ? 0 : 900, fill: "both" });
    skills.animate([{ opacity: 0, translate: reduced() ? "0 0" : "0 24px" }, { opacity: 1, translate: "0 0" }],
      { duration: reduced() ? 220 : 640, easing: EASE.emphasized, delay: reduced() ? 0 : 1020, fill: "both" });
    label.animate([{ opacity: 0, translate: reduced() ? "0 0" : "0 -10px" }, { opacity: 1, translate: "0 0" }],
      { duration: reduced() ? 220 : 420, easing: EASE.spring, delay: reduced() ? 0 : 1300, fill: "both" });
  }

  /* Bilgisayarın üstündeki "Portfolyo" etiketi (tasarım sisteminin PortfolioLabel'ı):
     bilgisayarın ne olduğunu söyler, aynı imza sahneyi başlatır. */
  function mountLabel() {
    label = E.PortfolioLabel.create({ text: "PORTFOLYO", cursorLabel: "AÇ", onClick: function () { if (ui.phase === "closed") openLaptop(); } });
    label.setAttribute("aria-label", "Portfolyoyu aç");
    label.classList.add("lap-label");
    left.insertBefore(label, slot);
    label.addEventListener("pointerenter", function (ev) { if (ev.pointerType !== "touch" && ui.phase === "closed") setLap("hover"); });
    label.addEventListener("pointerleave", function () { if (ui.phase === "closed") setLap("rest"); });
  }

  /* ───────── Beceriler: tık → daire basılır, yay ile büyür, halka dalgalanır, açıklama yükselir ───────── */
  var skillBtns = [].slice.call(D.querySelectorAll(".skill")), note = D.getElementById("skillNote");
  var noteName = note.querySelector(".skills__note-name"), noteText = note.querySelector(".skills__note-text");
  function closeSkill() {
    skillBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    note.classList.remove("is-on");
  }
  skillBtns.forEach(function (b) {
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var on = b.getAttribute("aria-pressed") === "true";
      closeSkill();
      if (on) return;
      b.setAttribute("aria-pressed", "true");
      b.classList.remove("is-pulse"); void b.offsetWidth; b.classList.add("is-pulse");
      var swap = note.classList.contains("is-on");
      noteName.textContent = b.querySelector(".skill__name").textContent;
      noteText.textContent = b.getAttribute("data-text");
      note.classList.add("is-on");
      if (swap && !reduced()) note.animate([{ opacity: 0.4, translate: "0 6px" }, { opacity: 1, translate: "0 0" }], { duration: 320, easing: EASE.emphasized });
    });
  });
  D.addEventListener("click", function (ev) { if (!skills.contains(ev.target)) closeSkill(); });

  /* ───────── Butonlar: manyetik çekim ───────── */
  [].forEach.call(D.querySelectorAll(".btn"), function (b) { E.magnetic(b, { strength: 0.18, radius: 40 }); });

  /* ───────── İletişime yumuşak kaydırma ───────── */
  var SCROLL_EASE = bezier(0.65, 0, 0.35, 1);
  function scrollToY(y) {
    var y0 = W.scrollY, dy = y - y0;
    if (reduced() || Math.abs(dy) < 2) { W.scrollTo(0, y); return; }
    var t0 = performance.now(), dur = Math.min(1400, 700 + Math.abs(dy) * 0.45);
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      W.scrollTo(0, y0 + dy * SCROLL_EASE(p));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var contact = D.getElementById("iletisim");
  D.getElementById("toContact").addEventListener("click", function (ev) {
    ev.preventDefault();
    if (ui.phase !== "closed") return;
    closeSkill(); /* açıklama kapanınca düzen kısalır; hedef ondan sonra ölçülür */
    scrollToY(contact.getBoundingClientRect().top + W.scrollY);
    history.replaceState(null, "", "#iletisim");
  });
  D.getElementById("toTop").addEventListener("click", function (ev) {
    ev.preventDefault();
    scrollToY(0);
    history.replaceState(null, "", location.pathname);
    lapEl().focus({ preventScroll: true });
  });
  /* ───────── İletişim bölümü: ana sayfada ve her proje detayının sonunda aynı.
     Form doğrular, sonra e-posta uygulamasında hazır bir mesaj açar. ───────── */
  var TO = "emirhncelebi03@gmail.com", cloneN = 0;
  function bindContact(section) {
    [].forEach.call(section.querySelectorAll(".rise"), function (el, k) { el.style.setProperty("--k", k); });
    var form = section.querySelector(".contact__form"), status = section.querySelector(".form__status");
    function fieldError(input, msg) {
      var f = input.closest(".field"), err = f.querySelector(".field__err");
      f.classList.toggle("is-invalid", !!msg); err.textContent = msg || "";
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }
    function checkEmail() {
      var v = form.email.value.trim();
      return fieldError(form.email, !v ? "E-posta adresini yaz, sana buradan dönüş yapacağım." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Bu adres eksik görünüyor; ornek@mail.com biçiminde yaz." : "");
    }
    function checkMsg() {
      var v = form.message.value.trim();
      return fieldError(form.message, v.length < 10 ? "Mesajın en az 10 karakter olsun ki ne üzerinde konuşacağımızı anlayayım." : "");
    }
    form.email.addEventListener("blur", function () { if (form.email.value) checkEmail(); });
    form.email.addEventListener("input", function () { if (form.email.getAttribute("aria-invalid") === "true") checkEmail(); });
    form.message.addEventListener("input", function () { if (form.message.getAttribute("aria-invalid") === "true") checkMsg(); });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var okE = checkEmail(), okM = checkMsg();
      if (!okE || !okM) { status.textContent = ""; (okE ? form.message : form.email).focus(); return; }
      var from = form.email.value.trim(), body = form.message.value.trim() + "\n\n— " + from;
      W.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent("Portfolyo üzerinden mesaj") + "&body=" + encodeURIComponent(body);
      status.textContent = "E-posta uygulaman açıldı; mesajı oradan gönderebilirsin.";
    });
    if (W.IntersectionObserver) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) section.classList.add("is-in"); }); }, { threshold: 0.25 }).observe(section);
    } else section.classList.add("is-in");
  }
  bindContact(contact);

  /* Proje detayının sonuna konacak kopya: kimlikler eşsizleşir, form boş başlar, "Başa dön" detayı kaydırır. */
  function contactClone(scrollEl) {
    var node = contact.cloneNode(true), suf = "-d" + (++cloneN);
    node.classList.remove("is-in"); node.id += suf;
    [].forEach.call(node.querySelectorAll("[id]"), function (el) { el.id += suf; });
    [].forEach.call(node.querySelectorAll("[for], [aria-describedby], [aria-labelledby]"), function (el) {
      ["for", "aria-describedby", "aria-labelledby"].forEach(function (a) {
        var v = el.getAttribute(a); if (v) el.setAttribute(a, v.split(" ").map(function (x) { return x + suf; }).join(" "));
      });
    });
    [].forEach.call(node.querySelectorAll(".field"), function (f) { f.classList.remove("is-invalid"); });
    [].forEach.call(node.querySelectorAll(".field__err, .form__status"), function (el) { el.textContent = ""; });
    [].forEach.call(node.querySelectorAll("input, textarea"), function (el) { el.value = ""; el.removeAttribute("aria-invalid"); });
    node.querySelector(".contact__top").addEventListener("click", function (ev) {
      ev.preventDefault(); scrollEl.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    });
    bindContact(node);
    return node;
  }

  /* ───────── Portfolyo: Navigation → başlık + iş grubu sekmeleri → ProjectLoop ───────── */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var portal = null, pf = null, loop = null, detail = null;
  function buildPortfolio() {
    portal = D.createElement("div"); portal.className = "ec-portal pf-portal";
    portal.setAttribute("role", "dialog"); portal.setAttribute("aria-label", "Portfolyo");
    var inner = D.createElement("div"); inner.className = "ec-portal__inner pf";
    inner.appendChild(E.Navigation.create({ mid: "", onAction: closeLaptop }));
    var head = D.createElement("div"); head.className = "pf__head";
    head.innerHTML = '<h2 class="ec-t-h2">Portfolyo</h2>' +
      '<div class="pf-tabs" role="tablist" aria-label="İş grupları"><span class="pf-tabs__ind" aria-hidden="true"></span>' +
      GROUPS.map(function (gr, k) {
        return '<button type="button" class="pf-tab" role="tab" id="pf-tab-' + gr.key + '" aria-controls="pfPanel" aria-selected="' + (k === groupIdx) + '" tabindex="' + (k === groupIdx ? 0 : -1) + '">' + esc(gr.label) + "</button>";
      }).join("") + "</div>";
    var panel = D.createElement("div"); panel.className = "ec-portal__loop"; panel.id = "pfPanel"; panel.setAttribute("role", "tabpanel");
    var foot = D.createElement("p"); foot.className = "ec-t-caption pf__foot"; foot.textContent = "Sürükle, kaydır ya da sadece izle. Liste hiç bitmez.";
    inner.appendChild(head); inner.appendChild(panel); inner.appendChild(foot);
    portal.appendChild(inner); hero.appendChild(portal);

    var tabs = [].slice.call(head.querySelectorAll(".pf-tab"));
    pf = { inner: inner, head: head, panel: panel, foot: foot, tabs: tabs, ind: head.querySelector(".pf-tabs__ind"), switching: false };
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { setGroup(k); });
      t.addEventListener("keydown", function (ev) {
        var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0; if (!d) return;
        ev.preventDefault(); var n = (k + d + tabs.length) % tabs.length; tabs[n].focus(); setGroup(n);
      });
    });
    mountLoop();
    moveIndicator(false);
    /* Giriş: kamera ekrana girerken başlık satırı, kartlar ve alt yazı 80ms arayla yükselir. */
    if (!reduced()) {
      [head].concat(visibleCards(), [foot]).forEach(function (el, k) {
        el.animate([{ opacity: 0, translate: "0 24px" }, { opacity: 1, translate: "0 0" }],
          { duration: 640, easing: EASE.emphasized, delay: 460 + k * 80, fill: "backwards" });
      });
    }
    return inner;
  }
  /* Telefon sahnesi (phones.js): bir kez kurulur, telefonlu grup açıldıkça akışa bağlanır. */
  var phoneStage;
  function getPhoneStage() {
    if (phoneStage === undefined) phoneStage = W.PhoneCovers && W.PhoneCovers.supported() && !cssMode ? new W.PhoneCovers.Stage({ url: "assets/models/telefon.glb" }) : null;
    return phoneStage;
  }
  function mountLoop() {
    var gr = GROUPS[groupIdx];
    loop = E.ProjectLoop.mount(pf.panel, { projects: gr.cards, onOpen: openDetail });
    loop.el.setAttribute("aria-label", gr.label + " projeleri");
    pf.panel.setAttribute("aria-labelledby", "pf-tab-" + gr.key);
    var st = gr.phone ? getPhoneStage() : phoneStage;
    if (st && gr.phone) {
      var n = gr.items.length;
      st.attach(loop.el, [].map.call(loop.el.querySelectorAll(".ec-card"), function (card, k) {
        return { card: card, cover: card.querySelector(".ec-card__cover"), project: gr.items[k % n], key: gr.key + "-" + (k % n), variant: k % n };
      }));
    } else if (st) st.detach();
  }
  function visibleCards() {
    var w = hero.clientWidth;
    return [].filter.call(pf.panel.querySelectorAll(".ec-card"), function (c) { var r = c.getBoundingClientRect(); return r.right > 0 && r.left < w; });
  }
  function moveIndicator(animate) {
    var t = pf.tabs[groupIdx], ind = pf.ind;
    if (!animate || reduced()) ind.style.transition = "none";
    ind.style.setProperty("--x", t.offsetLeft + "px"); ind.style.setProperty("--w", t.offsetWidth + "px");
    if (!animate || reduced()) { void ind.offsetWidth; ind.style.transition = ""; }
  }
  /* Grup değişimi: eski akış sola kayarak söner, yeni akışın kartları 70ms arayla aşağıdan yükselir. */
  function setGroup(k) {
    if (k === groupIdx || ui.phase !== "portfolio" || pf.switching) return;
    pf.switching = true; groupIdx = k;
    pf.tabs.forEach(function (t, i) { t.setAttribute("aria-selected", String(i === k)); t.tabIndex = i === k ? 0 : -1; });
    moveIndicator(true); scene.redraw();
    var old = loop;
    var out = reduced() ? null : old.el.animate([{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "-32px 0" }], { duration: 280, easing: EASE.standard, fill: "forwards" });
    Promise.resolve(out && out.finished).then(function () {
      if (phoneStage) phoneStage.detach();
      old.destroy(); mountLoop();
      if (!reduced()) visibleCards().forEach(function (c, i) {
        c.animate([{ opacity: 0, translate: "0 32px" }, { opacity: 1, translate: "0 0" }], { duration: 640, easing: EASE.emphasized, delay: i * 70, fill: "backwards" });
      });
      pf.switching = false;
    });
  }

  /* Proje detayı. Telefonlu grupta: telefon ortaya gelip ekranı kaplayana kadar büyür, proje sayfası
     aşağıdan kayarak gelir (içine girme). Diğer gruplarda tasarım sistemindeki gibi kart kapağı detayın kapağına uçar. */
  function openDetail(p, i, coverEl) {
    if (detail || ui.phase !== "portfolio") return;
    ui.phase = "project"; loop.pause();
    var gr = GROUPS[groupIdx], card = coverEl && coverEl.closest(".ec-card");
    if (gr.phone && phoneStage && phoneStage.phones.length && !reduced()) {
      var dive = phoneStage.diveInto(card, portal);
      pf.fade = pf.inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, easing: EASE.standard, fill: "forwards", composite: "replace" });
      var started = false;
      function slideIn() {
        if (started) return; started = true;
        var host = mountDetail(i, null);
        host.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 900, easing: EASE.emphasized, fill: "backwards" })
          .finished.then(function () { phoneStage.surface(); });
      }
      setTimeout(slideIn, 1050);
      dive.then(function (ok) { if (!ok) slideIn(); });
      return;
    }
    var h = mountDetail(i, coverEl);
    if (!reduced()) h.animate([{ opacity: 0 }, { opacity: 1 }], { duration: E.motion.duration.m, easing: EASE.standard });
  }
  function mountDetail(i, fromEl) {
    var host = D.createElement("div"); host.className = "ec-portal";
    host.style.cssText = "z-index:80;overflow:auto;display:block";
    portal.appendChild(host);
    detail = { host: host, view: E.ProjectDetail.mount(host, { projects: GROUPS[groupIdx].detail, index: i, fromEl: fromEl || undefined, onBack: closeDetail }) };
    /* Sistemin yer tutucu footer'ı yerine ana sayfadaki iletişim bölümü; "Sonraki proje" sayfayı yeniden çizdiğinde de. */
    /* Şablondaki yer tutucu bölümleri projenin kendi metin ve galerisiyle doldurur. Projeye ait hiç içerik
       yoksa şablon olduğu gibi kalır; içerik varsa boş bölümler gizlenir. */
    function hydrate() {
      var wrap = host.querySelector(".ec-detail__wrap"); if (!wrap || wrap.hasAttribute("data-h")) return;
      wrap.setAttribute("data-h", "");
      var pr = GROUPS[groupIdx].detail[detail ? detail.view.index : i]; if (!pr) return;
      var real = !!(pr.problem || pr.approach || pr.result || pr.gallery.length);
      var secs = [].slice.call(wrap.querySelectorAll(".ec-detail__sec")); // Problem, Yaklaşım, Sonuç
      [pr.problem, pr.approach, pr.result].forEach(function (t, k) {
        if (!secs[k]) return;
        if (t) secs[k].querySelector("p").textContent = t; else if (real) secs[k].remove();
      });
      var media = wrap.querySelector(".ec-detail__media");
      if (media && pr.gallery.length) {
        media.classList.add("pf-gallery");
        media.innerHTML = pr.gallery.map(function (g) { return '<img src="' + esc(g) + '" alt="' + esc(pr.title) + ' görseli" loading="lazy">'; }).join("");
      } else if (media && real) media.remove();
      /* Vaka çalışması verisi olan projede (projects.json → caseStudy) bölümler casestudy.js ile kurulur. */
      if (pr.caseStudy && W.CaseStudy) {
        W.CaseStudy.load(pr.caseStudy).then(function (d) { if (wrap.isConnected) W.CaseStudy.render(wrap, d); })
          .catch(function (e) { if (W.console) console.warn("Vaka çalışması yüklenemedi", e); });
      }
    }
    function refresh() {
      var f = host.querySelector(".ec-footer"); if (f) f.replaceWith(contactClone(host));
      hydrate();
    }
    refresh();
    detail.mo = new MutationObserver(refresh); detail.mo.observe(host, { childList: true, subtree: true });
    setTimeout(function () { var b = host.querySelector(".ec-navbtn"); b && b.focus({ preventScroll: true }); }, 760);
    return host;
  }
  function closeDetail() {
    if (!detail) return;
    var d = detail; detail = null; d.mo.disconnect();
    if (phoneStage) phoneStage.surface();
    if (pf.fade) { pf.fade.cancel(); pf.fade = null; }
    var a = d.host.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: reduced() ? "none" : "translateY(24px)" }],
      { duration: reduced() ? 200 : E.motion.duration.m, easing: EASE.standard, fill: "both" });
    a.finished.then(function () {
      d.host.remove(); loop.resume(); ui.phase = "portfolio";
      var c = visibleCards()[0]; (c || pf.tabs[groupIdx]).focus({ preventScroll: true });
    });
  }

  /* ───────── Akış ───────── */
  function openLaptop() {
    if (ui.phase !== "closed") return;
    ui.phase = "opening";
    if (W.scrollY > 0) W.scrollTo(0, 0);
    D.documentElement.classList.add("is-locked");
    var el = lapEl(); el.removeAttribute("data-cursor-label"); el.setAttribute("aria-expanded", "true"); el.style.cursor = "";
    setLap("open"); fadeOutSide();
    Promise.resolve(scene.open()).then(function () {
      var inner = buildPortfolio();
      if (cssMode) { inner.style.opacity = 1; return portal.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, fill: "both" }).finished; }
      return scene.enter(portal, hero, inner);
    }).then(function () {
      ui.phase = "portfolio";
      pf.tabs[groupIdx].focus({ preventScroll: true });
    });
  }
  function closeLaptop() {
    if (ui.phase !== "portfolio") return;
    ui.phase = "closing";
    loop.pause(); scene.redraw();
    var el = lapEl(), inner = pf.inner;
    var out = cssMode ? portal.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: "both" }).finished : scene.exit(portal, hero, inner);
    out.then(function () {
      if (phoneStage) phoneStage.detach();
      loop.destroy(); loop = null; portal.remove(); portal = null; pf = null;
      setLap("return"); fadeInSide();
      el.setAttribute("aria-expanded", "false");
      return scene.close();
    }).then(function () {
      ui.phase = "closed"; groupIdx = 0; scene.redraw();
      D.documentElement.classList.remove("is-locked");
      el.setAttribute("data-cursor-label", "AÇ"); el.style.cursor = "pointer";
      el.focus({ preventScroll: true });
    });
  }

  D.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    if (ui.phase === "project") closeDetail(); else if (ui.phase === "portfolio") closeLaptop();
  });

  /* İmleçle derinlik: iki katman zıt yönlerde kayar. */
  var layers = [left, right];
  hero.addEventListener("pointermove", function (ev) {
    if (reduced() || ev.pointerType === "touch" || ui.phase !== "closed") return;
    var b = hero.getBoundingClientRect(), nx = (ev.clientX - b.left) / b.width * 2 - 1, ny = (ev.clientY - b.top) / b.height * 2 - 1;
    layers.forEach(function (l) { var d = +l.getAttribute("data-depth"); l.style.setProperty("--plx", (nx * d).toFixed(1) + "px"); l.style.setProperty("--ply", (ny * d * 0.6).toFixed(1) + "px"); });
  });

  /* ───────── Başlat ───────── */
  mountScene();
  mountLabel();
  E.Cursor.mount(hero);
  W.addEventListener("resize", function () { if (ui.phase !== "closed") setLap("open"); });
  var fontsReady = D.fonts && D.fonts.load ? Promise.all(['300 100px Fraunces', '400 40px Fraunces', '400 20px Geist', '500 20px "Geist Mono"'].map(function (f) { return D.fonts.load(f).catch(function () {}); })) : Promise.resolve();
  Promise.all([fontsReady, dataReady]).then(buildCovers);
})();
