/* Vaka çalışması bileşenleri (KYK Asistan ve sonrakiler).
   Veri data/<id>.json'dan gelir; görseller satır içi SVG/HTML'dir, PNG kullanılmaz.
   Renkler sitenin token'ları: veri işareti --ec-deep, iz/zemin --ec-lav2. Her değer yazıyla da yazılır;
   renk tek bilgi taşıyıcısı değildir. */
(function () {
  "use strict";
  var W = window, D = document;
  var RM = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function reduced() { return !!RM.matches; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString("tr-TR"); }
  var uid = 0;

  /* ───────── İkonlar: tek çizgi kalınlığı (1.6), yuvarlak uç, currentColor ───────── */
  var I = {
    empathy: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    define: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
    ideate: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.6.5 1 1.2 1 2V17h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0012 3z"/>',
    prototype: '<rect x="3.5" y="4" width="17" height="12" rx="2.5"/><path d="M8 20h8M12 16v4"/>',
    test: '<path d="M4.5 12.5l4.5 4.5 10.5-11"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    maze: '<path d="M4 4h16v16H4zM8 4v8h4M16 8v12M8 16h4"/>',
    nobody: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5M4 4l16 16"/>',
    question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 114.2 1.8c-.9.7-1.8 1.2-1.8 2.6M12 16.8v.2"/>',
    arrow: '<path d="M4 12h15M14 6.5l5.5 5.5-5.5 5.5"/>',
    loop: '<path d="M20 12a8 8 0 11-2.3-5.6M20 4v4.5h-4.5"/>'
  };
  function icon(name, cls) { return '<svg class="cs-ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[name] || "") + "</svg>"; }

  /* ───────── Bölüm iskeleti: tasarım sistemindeki ec-detail__sec düzeni + tam genişlik gövde ───────── */
  function section(title, lead, body, opts) {
    opts = opts || {};
    var s = D.createElement("section");
    s.className = "ec-detail__sec cs-sec" + (opts.cls ? " " + opts.cls : "");
    if (opts.id) s.id = opts.id;
    s.innerHTML = '<h3 class="ec-t-h3">' + esc(title) + "</h3>" + (lead ? '<p class="cs-lead">' + esc(lead) + "</p>" : "") + '<div class="cs-body">' + body + "</div>";
    return s;
  }

  /* ───────── StatTile: büyük sayı, görünür olunca sayarak yükselir ───────── */
  function StatTile(k) {
    var final = fmt(k.value) + (k.suffix || "");
    return '<div class="cs-stat cs-reveal">' +
      '<p class="cs-stat__num"><span class="cs-count" data-to="' + k.value + '" data-suffix="' + esc(k.suffix || "") + '" aria-hidden="true">' + final + '</span><span class="cs-sr">' + esc(final + " " + k.unit) + "</span></p>" +
      '<p class="cs-stat__unit" aria-hidden="true">' + esc(k.unit) + '</p><p class="cs-stat__note">' + esc(k.note) + "</p></div>";
  }

  /* ───────── ProcessStepper + Double Diamond + metot etiketleri ───────── */
  function ProcessStepper(p) {
    var steps = p.steps.map(function (s, i) {
      return '<li class="cs-step cs-reveal"><span class="cs-step__ic">' + icon(s.icon) + '</span><span class="cs-step__name">' + esc(s.name) + "</span>" +
        (i < p.steps.length - 1 ? '<span class="cs-step__link" aria-hidden="true">' + icon("arrow") + "</span>" : "") + "</li>";
    }).join("");
    return '<ol class="cs-steps" aria-label="Tasarım süreci: ' + esc(p.steps.map(function (s) { return s.name; }).join(", ")) + '">' + steps + "</ol>" +
      '<p class="cs-loop cs-reveal">' + icon("loop") + "Test bulguları yeniden empatiye döner: süreç iteratif.</p>";
  }
  /* Iraksama/yakınsama: iki elmas; beş aşama elmasların uç ve orta noktalarına yerleşir. */
  function DoubleDiamond(p) {
    var id = "dd" + (++uid), n = p.steps.map(function (s) { return s.name; });
    /* Aşama noktaları: [x, y, etiket x, etiket y, hizalama]; uçtaki etiketler elmasların dışında durur. */
    var pts = [[20, 110, 10, 115, "end"], [320, 110, 320, 140, "middle"], [470, 30, 470, 16, "middle"], [545, 70, 556, 62, "start"], [620, 110, 630, 115, "start"]];
    return '<figure class="cs-dd cs-reveal"><svg viewBox="-96 0 830 222" role="img" aria-labelledby="' + id + '"><title id="' + id + '">Double Diamond: ' +
      esc(n[0] + " ve " + n[1] + " ile problem alanı açılıp daraltılır; " + n[2] + ", " + n[3] + " ve " + n[4] + " ile çözüm alanı açılıp daraltılır.") + "</title>" +
      '<path class="cs-dd__shape" d="M20 110 L170 30 L320 110 L170 190 Z"/><path class="cs-dd__shape cs-dd__shape--b" d="M320 110 L470 30 L620 110 L470 190 Z"/>' +
      '<path class="cs-dd__axis" d="M20 110H620"/>' +
      pts.map(function (t, i) {
        return '<circle class="cs-dd__dot" cx="' + t[0] + '" cy="' + t[1] + '" r="6"/><text class="cs-dd__label" x="' + t[2] + '" y="' + t[3] + '" text-anchor="' + t[4] + '">' + esc(n[i]) + "</text>";
      }).join("") +
      '<text class="cs-dd__cap" x="95" y="214" text-anchor="middle">Iraksama</text><text class="cs-dd__cap" x="245" y="214" text-anchor="middle">Yakınsama</text>' +
      '<text class="cs-dd__cap" x="395" y="214" text-anchor="middle">Iraksama</text><text class="cs-dd__cap" x="545" y="214" text-anchor="middle">Yakınsama</text>' +
      '</svg><figcaption>Problem alanı (sol elmas) ve çözüm alanı (sağ elmas)</figcaption></figure>';
  }
  function Chips(list, label) {
    return '<ul class="cs-chips" aria-label="' + esc(label) + '">' + list.map(function (m) { return '<li class="cs-chip">' + esc(m) + "</li>"; }).join("") + "</ul>";
  }
  function Notes(list) {
    return '<div class="cs-notes">' + list.map(function (n) {
      return '<div class="cs-note cs-reveal' + (n.emphasis ? " cs-note--em" : "") + '"><p class="cs-note__t">' + esc(n.title) + "</p><p>" + esc(n.text) + "</p></div>";
    }).join("") + "</div>";
  }

  /* ───────── MetricCard: her ölçü kendi formunda, birimler tek grafikte birleştirilmez ───────── */
  function Donut(m) {
    var id = "dn" + (++uid), r = 44, c = 2 * Math.PI * r;
    return '<figure class="cs-m cs-m--donut"><svg viewBox="0 0 112 112" role="img" aria-labelledby="' + id + '"><title id="' + id + '">' + esc(m.display + " " + m.label) + "</title>" +
      '<circle class="cs-track" cx="56" cy="56" r="' + r + '" stroke-width="10"/>' +
      '<circle class="cs-arc cs-grow" cx="56" cy="56" r="' + r + '" stroke-width="10" stroke-dasharray="' + (c * m.value / 100).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 56 56)" style="--len:' + (c * m.value / 100).toFixed(1) + '"/>' +
      '<text x="56" y="62" text-anchor="middle" class="cs-donut__v">' + esc(m.display) + "</text></svg>" +
      '<figcaption><b>' + esc(m.display) + "</b> " + esc(m.label) + "</figcaption></figure>";
  }
  function Clicks(m) {
    var dots = "";
    for (var i = 0; i < m.value; i++) {
      dots += '<li class="cs-click' + (i === m.value - 1 ? " cs-click--end" : "") + '" style="--i:' + i + '"><span>' + (i + 1) + "</span></li>";
    }
    return '<figure class="cs-m cs-m--clicks"><ol class="cs-clicks" aria-label="' + esc(m.display + ", " + m.label) + '">' + dots + "</ol>" +
      '<figcaption><b>' + esc(m.display) + "</b> " + esc(m.label) + "</figcaption></figure>";
  }
  function Delay(m) {
    var ticks = "", max = m.scaleMax || 5;
    for (var t = 0; t <= max; t++) ticks += '<span style="left:' + (t / max * 100) + '%">' + t + "</span>";
    return '<figure class="cs-m cs-m--bar"><div class="cs-bar" role="img" aria-label="' + esc(m.display + " " + m.label) + '">' +
      '<div class="cs-bar__track"><div class="cs-bar__fill cs-grow-x" style="width:' + (m.value / max * 100) + '%"></div></div>' +
      '<div class="cs-bar__axis" aria-hidden="true">' + ticks + "</div></div>" +
      '<figcaption><b>' + esc(m.display) + "</b> " + esc(m.label) + ' <span class="cs-unit">(ölçek: dakika)</span></figcaption></figure>';
  }
  function Progress(m) {
    return '<figure class="cs-m cs-m--bar"><div class="cs-bar" role="img" aria-label="' + esc(m.display + " " + m.label) + '">' +
      '<div class="cs-bar__track"><div class="cs-bar__fill cs-grow-x" style="width:' + m.value + '%"></div></div>' +
      '<div class="cs-bar__axis" aria-hidden="true"><span style="left:0">0</span><span style="left:50%">50</span><span style="left:100%">100</span></div></div>' +
      '<figcaption><b>' + esc(m.display) + "</b> " + esc(m.label) + "</figcaption></figure>";
  }
  function Status(m) {
    return '<figure class="cs-m cs-m--status"><p class="cs-badge">' + icon("question") + "<span>" + esc(m.label) + ": <b>" + esc(m.display) + "</b></span></p>" +
      "<figcaption>Ölçülebilir bir kanal olmadığı için sayı verilmiyor.</figcaption></figure>";
  }
  var METRIC = { donut: Donut, clicks: Clicks, delay: Delay, progress: Progress, status: Status };
  function MetricCard(f) {
    return '<article class="cs-card cs-reveal"><h4 class="cs-card__t">' + esc(f.title) + '</h4><p class="cs-card__p">' + esc(f.text) + "</p>" +
      '<div class="cs-card__metrics">' + f.metrics.map(function (m) { return METRIC[m.type](m); }).join("") + "</div></article>";
  }

  /* ───────── QuoteCard ───────── */
  function QuoteCard(q) {
    return '<figure class="cs-quote cs-reveal' + (q.featured ? " cs-quote--featured" : "") + '"><blockquote>“' + esc(q.text) + '”</blockquote>' +
      "<figcaption>" + esc(q.source) + (q.context ? " · " + esc(q.context) : "") + "</figcaption></figure>";
  }

  /* ───────── EmpathyMap: 4 kadran, ortada persona rozeti ───────── */
  function EmpathyMap(e, persona) {
    return '<div class="cs-emp" role="group" aria-label="' + esc(persona.name) + ' için empati haritası">' +
      e.quadrants.map(function (q, i) {
        return '<section class="cs-emp__q cs-emp__q--' + i + ' cs-reveal"><h4>' + esc(q.title) + "</h4>" +
          (q.tags ? '<ul class="cs-chips cs-chips--tags" aria-label="Duygular">' + q.tags.map(function (t) { return '<li class="cs-chip cs-chip--tag">' + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
          q.items.map(function (it) { return '<div class="cs-emp__item"><p class="cs-emp__it">' + esc(it.title) + "</p><p>“" + esc(it.quote) + "”</p></div>"; }).join("") + "</section>";
      }).join("") +
      '<div class="cs-emp__center" aria-hidden="true"><span>' + esc(persona.initials) + "</span><small>" + esc(persona.name) + "</small></div></div>";
  }

  /* ───────── PersonaCard ───────── */
  function PersonaCard(p, persona) {
    return '<article class="cs-persona cs-reveal">' +
      '<div class="cs-persona__id"><span class="cs-avatar" aria-hidden="true">' + esc(persona.initials) + "</span>" +
        '<div><p class="cs-persona__name">' + esc(p.name) + '</p><dl class="cs-facts">' + p.facts.map(function (f) { return "<div><dt>" + esc(f.label) + "</dt><dd>" + esc(f.value) + "</dd></div>"; }).join("") + "</dl></div></div>" +
      '<p class="cs-persona__bio">' + esc(p.bio) + "</p>" +
      '<div class="cs-persona__grid">' +
        '<section><h4>Hedefler</h4><ul class="cs-goals">' + p.goals.map(function (g) { return "<li>" + icon("check") + "<span>" + esc(g) + "</span></li>"; }).join("") + "</ul></section>" +
        '<section><h4>Motivasyonlar</h4>' + p.motivations.map(function (m) {
          return '<div class="cs-mot"><p><span>' + esc(m.label) + "</span><b>%" + m.value + '</b></p><div class="cs-bar__track" role="img" aria-label="' + esc(m.label + " yüzde " + m.value) + '"><div class="cs-bar__fill cs-grow-x" style="width:' + m.value + '%"></div></div></div>';
        }).join("") + "</section>" +
        '<section><h4>Acı noktaları</h4><ul class="cs-pains">' + p.pains.map(function (x) { return "<li>" + icon(x.icon) + "<span>" + esc(x.label) + "</span></li>"; }).join("") + "</ul></section>" +
      "</div>" +
      '<blockquote class="cs-persona__q">“' + esc(p.quote) + "”</blockquote></article>";
  }

  /* ───────── SolutionMap: sorun → çözüm (sonuç verisi olmadığı için rakam yok) ───────── */
  function SolutionMap(s) {
    return '<ol class="cs-sol">' + s.items.map(function (it) {
      /* TODO: Emirhan doğrulasın — çözüm metinleri sunumdan değil, araştırma bulgularından türetildi. */
      return (it.todo ? "<!-- TODO: Emirhan doğrulasın -->" : "") +
        '<li class="cs-sol__row cs-reveal"' + (it.todo ? ' data-todo="Emirhan doğrulasın"' : "") + '><div class="cs-sol__p"><p class="cs-sol__k">Sorun</p><p class="cs-sol__t">' + esc(it.problem) + '</p><p class="cs-sol__m">' + esc(it.metric) + "</p></div>" +
        '<span class="cs-sol__arrow" aria-hidden="true">' + icon("arrow") + "</span>" +
        '<div class="cs-sol__s"><p class="cs-sol__k">Çözüm</p><p class="cs-sol__t">' + esc(it.solution) + "</p><p>" + esc(it.text) + "</p></div></li>";
    }).join("") + "</ol>";
  }

  /* ───────── UICardMarquee: kapakta sağa akan iki sıra arayüz kartı ───────── */
  function screen(s) {
    if (s.image) return '<img src="' + esc(s.image) + '" alt="' + esc(s.title) + ' ekranı" loading="lazy">';
    var body = {
      login: '<p class="u-h">Hoş geldin</p><p class="u-s">E-Devlet ile bir kez giriş yap</p><span class="u-btn">Giriş yap</span><span class="u-ghost">Misafir olarak devam et</span>',
      dining: '<p class="u-h">Yemekhane</p><p class="u-row"><b>Kahvaltı</b><i>07:00–10:00</i></p><p class="u-row"><b>Öğle</b><i>12:00–14:30</i></p><p class="u-row"><b>Akşam</b><i>17:00–20:00</i></p><span class="u-btn">Menüyü gör</span>',
      laundry: '<p class="u-h">Çamaşırhane</p><div class="u-grid"><i class="on"></i><i></i><i class="on"></i><i></i><i></i><i class="on"></i></div><p class="u-s">Boş makineler koyu</p><span class="u-btn">Sıraya gir</span>',
      permit: '<p class="u-h">İzin talebi</p><p class="u-row"><b>Gidiş</b><i>Cuma</i></p><p class="u-row"><b>Dönüş</b><i>Pazar</i></p><span class="u-btn">Talep gönder</span>',
      home: '<p class="u-h">Merhaba</p><div class="u-tiles"><i>Yemek</i><i>İzin</i><i>Arıza</i><i>Destek</i></div>',
      fault: '<p class="u-h">Arıza bildir</p><div class="u-tiles"><i>Asansör</i><i>Elektrik</i><i>Su</i><i>Isınma</i></div><span class="u-btn">Fotoğraf ekle</span>',
      roommate: '<p class="u-h">Oda arkadaşım</p><p class="u-row"><b>Oda</b><i>214</i></p><span class="u-bubble">Akşam çamaşırhane boş mu?</span><span class="u-bubble u-bubble--me">Bakıyorum</span>',
      support: '<p class="u-h">Destek</p><span class="u-bubble">Talebin alındı, durumu buradan izleyebilirsin.</span><p class="u-row"><b>Durum</b><i>İnceleniyor</i></p>',
      events: '<p class="u-h">Etkinlikler</p><p class="u-row"><b>Sinema gecesi</b><i>Cuma</i></p><p class="u-row"><b>Kitap kulübü</b><i>Salı</i></p><span class="u-btn">Katıl</span>',
      qr: '<p class="u-h">Giriş kartı</p><div class="u-qr"></div><p class="u-s">Turnikeye okut</p>'
    }[s.kind] || '<p class="u-h">' + esc(s.title) + "</p>";
    return '<div class="u-screen"><p class="u-status"><b>9:41</b><i></i></p>' + body + "</div>";
  }
  function UICardMarquee(c) {
    /* Bir set kapaktan geniş olmalı ki -50% → 0 kaymasında boşluk açılmasın: en az 12 kart. Tekrarlar gizli. */
    function set(row, hidden) {
      var reps = Math.max(1, Math.ceil(12 / row.length)), items = [];
      for (var r = 0; r < reps; r++) items = items.concat(row);
      return '<ul class="cs-mq__set"' + (hidden ? ' aria-hidden="true"' : "") + ">" + items.map(function (s, k) {
        return '<li class="cs-mq__card"' + (!hidden && k >= row.length ? ' aria-hidden="true"' : "") + ">" + screen(s) + "</li>";
      }).join("") + "</ul>";
    }
    return '<div class="cs-mq" role="region" aria-label="' + esc(c.label) + '">' + c.rows.map(function (row, i) {
      return '<div class="cs-mq__row cs-mq__row--' + i + '"><div class="cs-mq__track">' + set(row, false) + set(row, true) + "</div></div>";
    }).join("") + "</div>";
  }

  /* ───────── Hareket: görünür olunca bir kez; azaltılmış harekette hepsi son halinde ───────── */
  function animate(root) {
    var items = [].slice.call(root.querySelectorAll(".cs-reveal")), counts = [].slice.call(root.querySelectorAll(".cs-count"));
    if (reduced() || !W.IntersectionObserver) { items.forEach(function (el) { el.classList.add("is-in"); }); return; }
    items.forEach(function (el) { el.classList.add("is-armed"); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var sibs = [].slice.call(e.target.parentNode.children).filter(function (x) { return x.classList.contains("cs-reveal"); });
        e.target.style.transitionDelay = Math.max(0, sibs.indexOf(e.target)) * 70 + "ms";
        e.target.classList.add("is-in");
        [].forEach.call(e.target.querySelectorAll(".cs-count"), countUp);
      });
    }, { threshold: 0.2 });
    items.forEach(function (el) { io.observe(el); });
    counts.forEach(function (el) { if (!el.closest(".cs-reveal")) countUp(el); });
  }
  function countUp(el) {
    var to = +el.getAttribute("data-to"), suf = el.getAttribute("data-suffix") || "", t0 = performance.now(), dur = 1400;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ───────── Proje sayfasına yerleştirme ─────────
     Şablondaki Problem / Yaklaşım / Sonuç başlıkları korunur, içleri vaka verisiyle dolar; aralarına yeni
     alt başlıklar girer. Proje galerisi (varsa) Persona'dan sonra kalır. */
  function render(wrap, d) {
    var hero = wrap.querySelector(".ec-detail__hero");
    if (hero && d.cover) { hero.classList.add("cs-hero"); hero.innerHTML = UICardMarquee(d.cover); }
    var secs = [].slice.call(wrap.querySelectorAll(".ec-detail__sec"));
    var anchor = wrap.querySelector(".ec-detail__next");
    function put(el) { if (anchor) wrap.insertBefore(el, anchor); else wrap.appendChild(el); }
    var media = wrap.querySelector(".ec-detail__media");
    var gallery = media && media.classList.contains("pf-gallery") ? media : null;
    secs.forEach(function (s) { s.remove(); });
    if (media && !gallery) media.remove();

    put(section("Problem", d.problem.title, '<p class="cs-text">' + esc(d.problem.text) + '</p><div class="cs-stats">' + d.problem.kpis.map(StatTile).join("") + "</div>", { id: "cs-problem" }));
    put(section("Yaklaşım", d.process.title + ". " + d.process.lead,
      ProcessStepper(d.process) + DoubleDiamond(d.process) + '<p class="cs-sub">Kullanılan metotlar</p>' + Chips(d.process.methods, "Kullanılan metotlar") + Notes(d.process.notes), { id: "cs-process" }));
    put(section("Araştırma bulguları", d.findings.title + " " + d.findings.lead, '<div class="cs-findings">' + d.findings.items.map(MetricCard).join("") + "</div>", { id: "cs-findings" }));
    put(section("Kullanıcı sesleri", d.quotes.title, '<div class="cs-quotes">' + d.quotes.items.map(QuoteCard).join("") + "</div>", { id: "cs-quotes" }));
    put(section("Empati haritası", d.persona.name + " gözünden yurt deneyimi.", EmpathyMap(d.empathy, d.persona), { id: "cs-empathy" }));
    put(section("Persona", d.personaCard.title, PersonaCard(d.personaCard, d.persona), { id: "cs-persona" }));
    if (gallery) put(gallery);
    put(section("Sonuç", d.solutions.title + ". " + d.solutions.lead, SolutionMap(d.solutions), { id: "cs-result" }));
    animate(wrap);
  }

  var cache = {};
  function load(id) {
    if (!/^[a-z0-9-]+$/.test(id)) return Promise.reject(new Error("geçersiz vaka adı"));
    if (!cache[id]) cache[id] = fetch("data/" + id + ".json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return cache[id];
  }

  W.CaseStudy = { load: load, render: render, components: { StatTile: StatTile, MetricCard: MetricCard, QuoteCard: QuoteCard, EmpathyMap: EmpathyMap, PersonaCard: PersonaCard, ProcessStepper: ProcessStepper, SolutionMap: SolutionMap, UICardMarquee: UICardMarquee } };
})();
