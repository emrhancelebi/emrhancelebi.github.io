/* Telefon kapakları: UX projelerinin kartlarında süzülen 3D telefon (assets/models/telefon.glb).
   Ekranında projenin başlangıç ekranları oynar; karta tıklanınca telefon büyüyüp ekranı kaplar.
   Tek bir WebGL bağlamı akıştaki tüm görünür kartları çizer (her kart kendi kapağına kırpılır). */
(function () {
  "use strict";
  var W = window, D = document, T = W.THREE;
  var RM = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function reduced() { return !!RM.matches; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function expoOut(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function supported() {
    if (!T || !T.GLTFLoader) return false;
    try { var c = D.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }

  /* ───────── Ekran içeriği: 360 × 780 (telefon ekranının oranı) ───────── */
  var SW = 360, SH = 780;
  var C = { deep: "#103273", ink: "#254986", muted: "#516899", bg: "#f9f2fc", raised: "#fdf9fe", lav1: "#f1e6f8", lav2: "#e6d7f1" };
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function wrapText(g, text, x, y, maxW, lh) {
    var words = String(text).split(" "), line = "";
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t;
    });
    if (line) g.fillText(line, x, y);
  }
  function statusBar(g, dark) {
    g.fillStyle = dark ? C.bg : C.deep; g.font = '600 15px Geist, system-ui, sans-serif'; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillText("9:41", 34, 36);
    for (var i = 0; i < 4; i++) rr(g, 270 + i * 6, 31 - i * 2.5, 4, 5 + i * 2.5, 1), g.fill();
    rr(g, 302, 24, 26, 13, 4); g.lineWidth = 1.4; g.strokeStyle = g.fillStyle; g.stroke();
    rr(g, 304, 26, 18, 9, 2.5); g.fill();
  }

  /* Projenin kendi ekran görüntüsü yoksa: açılış (splash) + üç adımlı karşılama (onboarding). */
  var COPY = [
    { h: "Hoş geldin", b: function (p) { return p.title + " ile ihtiyacın olan her şey tek akışta."; } },
    { h: "Keşfet", b: function () { return "Sık kullandıklarını birkaç dokunuşla bul, kaldığın yerden devam et."; } },
    { h: "Hazırsın", b: function () { return "Hesabını oluştur, hemen başlayalım."; } }
  ];
  function illustration(g, k, variant, t) {
    var f = Math.sin(t * 1.6 + k) * 6;
    g.save(); rr(g, 24, 96, 312, 330, 30); g.clip();
    g.fillStyle = [C.lav1, C.lav2, C.lav1][k]; g.fillRect(24, 96, 312, 330);
    var v = (variant + k) % 3;
    if (v === 0) {
      g.fillStyle = C.lav2; g.beginPath(); g.arc(180, 262 + f, 104, 0, Math.PI * 2); g.fill();
      g.fillStyle = C.deep; g.beginPath(); g.arc(214, 226 - f, 36, 0, Math.PI * 2); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.arc(150, 300 + f * 0.5, 54, 0, Math.PI * 2); g.stroke();
    } else if (v === 1) {
      for (var i = 0; i < 3; i++) {
        g.fillStyle = [C.raised, C.lav2, C.raised][i]; rr(g, 64 + i * 18, 150 + i * 62 + (i === 1 ? f : -f * 0.5), 232 - i * 36, 84, 20); g.fill();
        g.fillStyle = C.deep; g.beginPath(); g.arc(98 + i * 18, 192 + i * 62 + (i === 1 ? f : -f * 0.5), 14, 0, Math.PI * 2); g.fill();
        g.fillStyle = C.muted; rr(g, 126 + i * 18, 182 + i * 62 + (i === 1 ? f : -f * 0.5), 110 - i * 30, 9, 4.5); g.fill();
        rr(g, 126 + i * 18, 198 + i * 62 + (i === 1 ? f : -f * 0.5), 70 - i * 16, 9, 4.5); g.fill();
      }
    } else {
      g.fillStyle = C.raised; rr(g, 70, 150 + f, 220, 220, 110); g.fill();
      g.fillStyle = C.deep; g.beginPath(); g.arc(180, 260 + f, 70, 0, Math.PI * 2); g.fill();
      g.strokeStyle = C.bg; g.lineWidth = 9; g.lineCap = "round"; g.lineJoin = "round";
      var s = clamp01(((t * 0.6) % 1) * 2.2);
      g.beginPath(); g.moveTo(148, 262 + f); g.lineTo(148 + 22 * Math.min(1, s * 2), 262 + f + 22 * Math.min(1, s * 2));
      if (s > 0.5) g.lineTo(170 + 46 * (s - 0.5) * 2, 284 + f - 50 * (s - 0.5) * 2);
      g.stroke();
    }
    g.restore();
  }
  function onboardSlide(g, p, k, variant, t) {
    illustration(g, k, variant, t);
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillStyle = C.deep; g.font = '400 32px Fraunces, Georgia, serif'; g.fillText(COPY[k].h, 28, 492);
    g.fillStyle = C.ink; g.font = '400 16px Geist, system-ui, sans-serif'; wrapText(g, COPY[k].b(p), 28, 528, 300, 24);
  }
  function drawPlaceholder(g, p, variant, now) {
    var CYCLE = 8.4, t = (now / 1000 + variant * 1.7) % CYCLE;
    if (t < 1.8) {
      /* açılış ekranı: logo yayla büyür, ad belirir */
      var a = clamp01(t / 0.9), sp = 1 + Math.sin(a * Math.PI) * 0.08 * (1 - a);
      g.fillStyle = C.deep; g.fillRect(0, 0, SW, SH); statusBar(g, true);
      var r = 48 * easeOut(a) * sp;
      g.fillStyle = C.bg; g.beginPath(); g.arc(180, 350, r, 0, Math.PI * 2); g.fill();
      g.globalAlpha = clamp01((t - 0.35) / 0.5);
      g.fillStyle = C.deep; g.font = '300 44px Fraunces, Georgia, serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(pad2(p.num || 1), 180, 352);
      g.globalAlpha = clamp01((t - 0.6) / 0.6);
      g.fillStyle = C.bg; g.font = '400 28px Fraunces, Georgia, serif'; g.textBaseline = "alphabetic"; g.fillText(p.title, 180, 450);
      g.fillStyle = C.lav2; g.font = '400 14px Geist, system-ui, sans-serif'; g.fillText(p.category ? p.category.toLocaleLowerCase("tr") : "", 180, 476);
      g.globalAlpha = 1; g.textAlign = "left";
      if (t > 1.5) { g.globalAlpha = clamp01((t - 1.5) / 0.3); g.fillStyle = C.bg; g.fillRect(0, 0, SW, SH); g.globalAlpha = 1; }
      return;
    }
    /* karşılama: üç adım, her biri 2.2 sn, aralarında 0.5 sn yatay kayma */
    var u = (t - 1.8) / 2.2, k = Math.min(2, Math.floor(u)), frac = u - k, pos = k + (k < 2 ? easeInOut(clamp01((frac - 0.77) / 0.23)) : 0);
    g.fillStyle = C.bg; g.fillRect(0, 0, SW, SH); statusBar(g, false);
    g.fillStyle = C.muted; g.font = '500 15px Geist, system-ui, sans-serif'; g.textAlign = "right"; g.fillText("Atla", 330, 74); g.textAlign = "left";
    for (var s = 0; s < 3; s++) {
      var x = (s - pos) * SW; if (x <= -SW || x >= SW) continue;
      g.save(); g.translate(x, 0); onboardSlide(g, p, s, variant, now / 1000); g.restore();
    }
    for (var d = 0, dx = 28; d < 3; d++) {
      var on = clamp01(1 - Math.abs(pos - d)), w = 8 + 16 * on;
      g.fillStyle = on > 0.5 ? C.deep : "rgba(37,73,134,.32)"; rr(g, dx, 690, w, 8, 4); g.fill();
      dx += w + 8;
    }
    var last = clamp01(pos - 1);
    g.globalAlpha = last; g.fillStyle = C.deep; rr(g, 28, 716, 304, 52, 26); g.fill();
    g.fillStyle = C.bg; g.font = '600 16px Geist, system-ui, sans-serif'; g.textAlign = "center"; g.fillText("Başla", 180, 748);
    g.globalAlpha = 1 - last; g.fillStyle = C.deep; rr(g, 268, 716, 64, 52, 26); g.fill();
    g.strokeStyle = C.bg; g.lineWidth = 2.4; g.lineCap = "round"; g.beginPath(); g.moveTo(290, 742); g.lineTo(310, 742); g.moveTo(302, 734); g.lineTo(310, 742); g.lineTo(302, 750); g.stroke();
    g.globalAlpha = 1; g.textAlign = "left";
  }
  /* Projenin kendi ekran görüntüleri: yatay kayan karşılama gibi sırayla geçer. */
  function drawImages(g, imgs, now) {
    var ready = imgs.filter(function (im) { return im.complete && im.naturalWidth; });
    if (!ready.length) { g.fillStyle = C.bg; g.fillRect(0, 0, SW, SH); return; }
    var per = 2.6, t = now / 1000 / per, k = Math.floor(t) % ready.length, frac = t % 1, slide = easeInOut(clamp01((frac - 0.8) / 0.2));
    function cover(im, x) {
      var s = Math.max(SW / im.naturalWidth, SH / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
      g.drawImage(im, x + (SW - w) / 2, (SH - h) / 2, w, h);
    }
    cover(ready[k], -slide * SW);
    if (slide > 0 && ready.length > 1) cover(ready[(k + 1) % ready.length], (1 - slide) * SW);
  }
  function makeScreen(p, variant) {
    var c = D.createElement("canvas"); c.width = SW; c.height = SH;
    var g = c.getContext("2d"), tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding; tex.anisotropy = 4; tex.flipY = true;
    var imgs = (p.phoneScreens || []).map(function (src) { var im = new Image(); im.src = src; return im; });
    var last = -1;
    return {
      canvas: c, tex: tex,
      material: new T.MeshBasicMaterial({ map: tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      update: function (now) {
        if (now - last < 33) return; last = now;
        if (imgs.length) drawImages(g, imgs, now); else drawPlaceholder(g, p, variant, now);
        tex.needsUpdate = true;
      }
    };
  }

  /* ───────── Sahne ───────── */
  var modelP = null;
  function loadModel(url) {
    if (!modelP) modelP = new Promise(function (res, rej) { new T.GLTFLoader().load(url, function (g) { res(g.scene); }, undefined, rej); });
    return modelP;
  }
  var PHONE_H = 0.163; // modelin boyu (m)

  function Stage(opts) {
    this.url = opts.url;
    this.canvas = D.createElement("canvas"); this.canvas.className = "phone-canvas"; this.canvas.setAttribute("aria-hidden", "true");
    var r = this.renderer = new T.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(W.devicePixelRatio || 1, 2)); r.setClearColor(0x000000, 0);
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.autoClear = false;
    this.scene = new T.Scene();
    if (T.RoomEnvironment) { var pm = new T.PMREMGenerator(r); this.scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; pm.dispose(); }
    this.scene.add(new T.HemisphereLight(0xffffff, 0xe6d7f1, 0.7));
    var key = new T.DirectionalLight(0xffffff, 1.2); key.position.set(-0.4, 0.8, 1); this.scene.add(key);
    this.camera = new T.PerspectiveCamera(24, 1, 1, 20000);
    this.phones = []; this.screens = {}; this.host = null; this.size = { w: 0, h: 0 }; this.dive = null;
    this.ready = loadModel(this.url);
    var self = this;
    (function loop(now) { self.raf = requestAnimationFrame(loop); self.frame(now); })(performance.now());
  }
  Stage.prototype.resize = function (w, h) {
    if (w === this.size.w && h === this.size.h) return;
    this.size = { w: w, h: h }; this.renderer.setSize(w, h, false);
    var z = (h / 2) / Math.tan(this.camera.fov * Math.PI / 360);
    this.camera.aspect = w / h; this.camera.position.set(0, 0, z);
    /* Dar derinlik aralığı: ekran yüzeyi ön camın yalnızca 0,02 mm önünde, geniş aralıkta titrer. */
    this.camera.near = z * 0.55; this.camera.far = z * 1.45; this.camera.updateProjectionMatrix();
  };
  /* Kartları ve projelerini bağlar: cards = [{ card, cover, project, key }] */
  Stage.prototype.attach = function (root, cards) {
    var self = this;
    this.detach();
    this.host = root; root.insertBefore(this.canvas, root.querySelector(".ec-loop__edge"));
    this.canvas.classList.remove("is-dive"); this.canvas.classList.add("is-on");
    return this.ready.then(function (model) {
      if (self.host !== root) return;
      cards.forEach(function (c, i) {
        if (!self.screens[c.key]) self.screens[c.key] = makeScreen(c.project, c.variant);
        var obj = model.clone(true), pivot = new T.Group();
        obj.traverse(function (n) {
          if (!n.isMesh) return;
          if (n.name === "display") { n.material = self.screens[c.key].material; n.renderOrder = 1; }
          if (n.name === "dynamic_island" || n.name === "earpiece") n.renderOrder = 2;
        });
        pivot.add(obj); pivot.visible = false; self.scene.add(pivot);
        self.phones.push({ card: c.card, cover: c.cover, key: c.key, pivot: pivot, seed: i * 1.37, hover: 0, rx: 0, ry: 0 });
      });
    }).catch(function (e) { if (W.console) console.warn("Telefon modeli yüklenemedi", e); self.detach(); });
  };
  Stage.prototype.detach = function () {
    var self = this;
    this.phones.forEach(function (ph) { self.scene.remove(ph.pivot); });
    this.phones = []; this.dive = null;
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.host = null;
  };
  function cssAngle(el, name) { var v = parseFloat(getComputedStyle(el).getPropertyValue(name)); return isNaN(v) ? 0 : v * Math.PI / 180; }

  Stage.prototype.place = function (ph, rect, now, base) {
    /* kapak dikdörtgeninin merkezine, kapağın %78'i boyunda; yan dönük 3/4 açıyla süzülür */
    var hover = ph.hover, t = now / 1000 + ph.seed, rm = reduced();
    var s = rect.height * 0.78 / PHONE_H;
    var float = rm ? 0 : Math.sin(t * 0.98) * 5;
    ph.pivot.position.set(rect.left + rect.width / 2 - base.left - this.size.w / 2, -(rect.top + rect.height * 0.52 - base.top - this.size.h / 2) + float + hover * 6, 0);
    ph.pivot.scale.setScalar(s * (1 + hover * 0.04));
    var idleYaw = rm ? -0.32 : -0.34 + Math.sin(t * 0.55) * 0.12;
    ph.pivot.rotation.set(-0.08 + ph.rx * 1.6 + (rm ? 0 : Math.sin(t * 0.8) * 0.03), lerp(idleYaw, -0.12, hover) + ph.ry * 2.2, rm ? 0 : Math.sin(t * 0.7) * 0.02);
  };
  Stage.prototype.frame = function (now) {
    if (!this.host || !this.phones.length) return;
    var r = this.renderer, self = this;
    if (this.dive) return this.diveFrame(now);
    var base = this.host.getBoundingClientRect(), w = Math.round(base.width), h = Math.round(base.height);
    if (!w || !h) return;
    this.resize(w, h);
    r.setScissorTest(false); r.clear();
    var shown = [];
    this.phones.forEach(function (ph) {
      ph.pivot.visible = false;
      var c = ph.cover.getBoundingClientRect();
      if (c.right < base.left || c.left > base.right) return;
      var on = ph.card.matches(":hover") || ph.card.matches(":focus-visible") ? 1 : 0;
      ph.hover += (on - ph.hover) * 0.12;
      ph.rx += (cssAngle(ph.card, "--rx") - ph.rx) * 0.15; ph.ry += (cssAngle(ph.card, "--ry") - ph.ry) * 0.15;
      shown.push({ ph: ph, rect: c });
    });
    if (!shown.length) return;
    var keys = {};
    shown.forEach(function (s) { keys[s.ph.key] = 1; });
    Object.keys(keys).forEach(function (k) { self.screens[k].update(now); });
    r.setScissorTest(true);
    shown.forEach(function (s) {
      var ph = s.ph, c = s.rect;
      self.place(ph, c, now, base);
      ph.pivot.visible = true;
      var x = Math.max(0, c.left - base.left), y = Math.max(0, c.top - base.top), x2 = Math.min(w, c.right - base.left), y2 = Math.min(h, c.bottom - base.top);
      r.setScissor(x, h - y2, Math.max(0, x2 - x), Math.max(0, y2 - y));
      r.render(self.scene, self.camera);
      ph.pivot.visible = false;
    });
    r.setScissorTest(false);
  };

  /* ───────── Dalış: telefon ortaya gelir, döner, ekranı tüm görünümü kaplayana kadar büyür ───────── */
  Stage.prototype.diveInto = function (card, layer) {
    var self = this, ph = null;
    this.phones.forEach(function (x) { if (x.card === card) ph = x; });
    if (!ph || reduced()) return Promise.resolve(false);
    var base = this.host.getBoundingClientRect(), c = ph.cover.getBoundingClientRect();
    var lb = layer.getBoundingClientRect();
    /* tuvali tam ekran katmana taşı, başlangıç pozunu yeni koordinatlara çevir */
    layer.appendChild(this.canvas); this.canvas.classList.add("is-dive");
    this.resize(Math.round(lb.width), Math.round(lb.height));
    var now = performance.now();
    this.place(ph, c, now, lb);
    var from = { x: ph.pivot.position.x, y: ph.pivot.position.y, s: ph.pivot.scale.x, rx: ph.pivot.rotation.x, ry: ph.pivot.rotation.y, rz: ph.pivot.rotation.z };
    var DISPLAY_H = 0.1588, fill = Math.max(lb.height * 1.12 / DISPLAY_H, lb.width * 1.12 / 0.0732);
    this.dive = { ph: ph, from: from, t0: now, dur: 1500, mid: (lb.height * 0.82) / PHONE_H, fill: fill };
    return new Promise(function (res) { self.dive.done = res; });
  };
  Stage.prototype.diveFrame = function (now) {
    var d = this.dive, ph = d.ph, r = this.renderer, p = clamp01((now - d.t0) / d.dur);
    var a = easeInOut(clamp01(p / 0.5)), b = expoOut(clamp01((p - 0.42) / 0.58));
    ph.pivot.position.set(lerp(d.from.x, 0, a), lerp(d.from.y, 0, a), 0);
    ph.pivot.rotation.set(lerp(d.from.rx, 0, a), lerp(d.from.ry, 0, a), lerp(d.from.rz, 0, a));
    ph.pivot.scale.setScalar(b > 0 ? lerp(d.mid, d.fill, b) : lerp(d.from.s, d.mid, a));
    this.screens[ph.key].update(now);
    this.phones.forEach(function (x) { x.pivot.visible = x === ph; });
    r.setScissorTest(false); r.clear(); r.render(this.scene, this.camera);
    if (p >= 1 && d.done) { var f = d.done; d.done = null; f(true); }
  };
  /* Dalıştan sonra tuval akışa geri döner. */
  Stage.prototype.surface = function () {
    if (!this.dive) return;
    this.dive.ph.pivot.visible = false; this.dive = null;
    this.canvas.classList.remove("is-dive");
    if (this.host) this.host.insertBefore(this.canvas, this.host.querySelector(".ec-loop__edge"));
  };

  /* Laptop ekranındaki 3D dokuya: telefonun düz bir çizimi (kapak görseli üzerine). */
  function drawFlatPhone(g, w, h) {
    var ph = h * 0.74, pw = ph * 0.476, x = (w - pw) / 2, y = h * 0.14;
    g.fillStyle = "rgba(16,50,115,.18)"; g.beginPath(); g.ellipse(w / 2, y + ph + h * 0.04, pw * 0.42, h * 0.025, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#2a2a2e"; rr(g, x, y, pw, ph, pw * 0.16); g.fill();
    g.fillStyle = C.bg; rr(g, x + pw * 0.045, y + pw * 0.045, pw * 0.91, ph - pw * 0.09, pw * 0.13); g.fill();
    g.fillStyle = C.deep; g.beginPath(); g.arc(w / 2, y + ph * 0.36, pw * 0.16, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#111"; rr(g, w / 2 - pw * 0.15, y + pw * 0.08, pw * 0.3, pw * 0.08, pw * 0.04); g.fill();
  }

  W.PhoneCovers = { supported: supported, Stage: Stage, drawFlatPhone: drawFlatPhone };
})();
