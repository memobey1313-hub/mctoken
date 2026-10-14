(function(){try{var U="https://oyun-rehberi.github.io/#mc";var c=document.getElementById("chanBtn");if(!c||document.getElementById("guideBtn"))return;var b=document.createElement("button");b.className="act ghost";b.id="guideBtn";b.style.marginTop="8px";b.textContent="Detaylı rehber";b.addEventListener("click",function(){var t=window.Telegram&&window.Telegram.WebApp;if(t&&t.openLink)t.openLink(U);else window.open(U,"_blank");});c.parentNode.insertBefore(b,c.nextSibling);}catch(e){}})();
/* MC Token görevler v2: oyunun ana kodundan ayrı çalışır; yüklenmezse oyun aynen devam eder. */
(function () {
  if (window.__mcTasks) return;
  if (typeof sync !== "function" || typeof apply !== "function" || typeof info !== "function" || !document.getElementById("daily")) return;
  window.__mcTasks = 1;

  var DEFS = [
    { id: "sk", title: "Saat Kasası'nı başlat", desc: "Saat Kasası oyununu bir kez aç, sonra buraya dönüp ödülü al.", open: "Oyunu aç", fail: "Saat Kasası henüz açılmamış görünüyor. Oyunu açıp geri gel, sonra tekrar dene.", url: function () { return "https://t.me/SaatKasasiBot/saat"; } },
    { id: "cv", title: "Civciv Uçuşu'nu başlat", desc: "Civciv Uçuşu oyununu bir kez aç, sonra buraya dönüp ödülü al.", open: "Oyunu aç", fail: "Civciv Uçuşu henüz açılmamış görünüyor. Oyunu açıp geri gel, sonra tekrar dene.", url: function () { return "https://t.me/CivcivUcusuBot/oyna"; } },
    { id: "chmc", title: "MC Token kanalına katıl", desc: "Duyuruların yayınlandığı MC Token kanalına katıl, sonra buraya dönüp ödülü al.", open: "Kanalı aç", fail: "Kanala katıldığın görünmüyor. Katılıp tekrar dene.", url: function (t) { return "https://t.me/" + t.ch.slice(1); } },
    { id: "chsk", title: "Saat Kasası kanalına katıl", desc: "Saat Kasası duyuru kanalına katıl, sonra buraya dönüp ödülü al.", open: "Kanalı aç", fail: "Kanala katıldığın görünmüyor. Katılıp tekrar dene.", url: function (t) { return "https://t.me/" + t.ch.slice(1); } },
    { id: "chcv", title: "Civciv Uçuşu kanalına katıl", desc: "Civciv Uçuşu duyuru kanalına katıl, sonra buraya dönüp ödülü al.", open: "Kanalı aç", fail: "Kanala katıldığın görünmüyor. Katılıp tekrar dene.", url: function (t) { return "https://t.me/" + t.ch.slice(1); } }
  ];
  var TRES = {
    done: "Bu görevi zaten tamamladın.",
    off: "Bu görev şu an açık değil.",
    tg: "Doğrulama şu an yapılamadı. Biraz sonra tekrar dene. Olmazsa MC Token botuna /start yazıp dene.",
    noplayer: "Oturum yenileniyor, biraz sonra tekrar dene.",
    server: "Bir sorun oldu, tekrar dene.",
    bad: "Bir sorun oldu, tekrar dene."
  };
  var TK = null, busy = false;

  var css = document.createElement("style");
  css.textContent =
    ".tk-head { width:100%; max-width:420px; margin:6px 0 10px; }" +
    ".tk h3 { font-size:20px; margin-bottom:4px; }" +
    ".tk-rw { color:var(--gold-hi); font:600 14px var(--sans); margin:0 0 8px; }" +
    ".tk2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }" +
    ".tk-ok { margin-top:2px; color:var(--gold-hi); font:600 14px var(--sans); }" +
    ".tk.tkdone { padding-bottom:12px; }" +
    ".tk.tkdone h3, .tk.tkdone .tk-rw { color:var(--muted); }";
  document.head.appendChild(css);

  var h2 = document.querySelector("#daily h2"); if (h2) h2.textContent = "Görevler";
  var lb = document.querySelector("#dailyBtn span"); if (lb) lb.textContent = "Görevler";
  var ver = document.getElementById("ver"); if (ver) ver.textContent = "v10.4 lüks";
  var helpCard = document.querySelector("#help .card");
  if (helpCard) {
    var hp = document.createElement("p"), hb = document.createElement("b");
    hb.textContent = "Görevler:"; hp.appendChild(hb);
    hp.appendChild(document.createTextNode(" Saat Kasası'nı ve Civciv Uçuşu'nu başlat, duyuru kanallarına katıl. Her görev yalnızca bir kez MC Token kazandırır."));
    var anchor = null;
    Array.prototype.forEach.call(helpCard.querySelectorAll("p"), function (p) { if (/Günlük bonus/.test(p.textContent)) anchor = p; });
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(hp, anchor.nextSibling); else helpCard.appendChild(hp);
  }

  var panel = document.getElementById("daily");
  var head = document.createElement("div"); head.className = "sub tk-head"; head.textContent = "Tek seferlik görevler"; head.style.display = "none";
  var box = document.createElement("div"); box.style.width = "100%"; box.style.maxWidth = "420px";
  var nt = document.createElement("div"); nt.className = "pnote";
  panel.appendChild(head); panel.appendChild(box); panel.appendChild(nt);

  function say(t) { nt.textContent = t; }
  function openLink(u) { try { if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u, "_blank"); } catch (e) { window.open(u, "_blank"); } }
  function list() {
    var out = [];
    if (!TK) return out;
    DEFS.forEach(function (d) { var t = TK[d.id]; if (!t) return; if (d.id !== "sk" && d.id !== "cv" && !t.ch) return; out.push({ d: d, t: t }); });
    return out;
  }
  function pending() { return list().some(function (x) { return !x.t.done; }); }

  function render() {
    while (box.firstChild) box.removeChild(box.firstChild);
    var l = list();
    head.style.display = l.length ? "" : "none";
    l.forEach(function (x) {
      var d = x.d, t = x.t, c = document.createElement("div");
      c.className = "card tk" + (t.done ? " tkdone" : "");
      var h = document.createElement("h3"); h.textContent = d.title; c.appendChild(h);
      var rw = document.createElement("div"); rw.className = "tk-rw"; rw.textContent = "+" + fmt(t.mc) + " MC"; c.appendChild(rw);
      if (t.done) {
        var k = document.createElement("div"); k.className = "tk-ok"; k.textContent = "Tamamlandı ✓"; c.appendChild(k);
      } else {
        var p = document.createElement("p"); p.textContent = d.desc; c.appendChild(p);
        var row = document.createElement("div"); row.className = "tk2";
        var b1 = document.createElement("button"); b1.className = "act ghost"; b1.textContent = d.open;
        b1.addEventListener("click", function () { openLink(d.url(t)); });
        var b2 = document.createElement("button"); b2.className = "act"; b2.textContent = "Ödülü al"; b2.disabled = busy || !ready;
        b2.addEventListener("click", function () { claim(d); });
        row.appendChild(b1); row.appendChild(b2); c.appendChild(row);
      }
      box.appendChild(c);
    });
  }

  function claim(d) {
    if (busy || !ready) return;
    busy = true; say("Kontrol ediliyor…"); render();
    sync({ action: "task_claim", item: d.id }, function (r) {
      busy = false;
      if (!r) say("Bağlantı sorunu, tekrar dene.");
      else if (r.tres === "ok") {
        if (TK && TK[d.id]) TK[d.id].done = true;
        say("+" + fmt(TK && TK[d.id] ? TK[d.id].mc : 0) + " MC kazandın ✓");
        try { tg.HapticFeedback.notificationOccurred("success"); } catch (e) {}
      } else if (r.tres === "done") {
        if (TK && TK[d.id]) TK[d.id].done = true;
        say(TRES.done);
      } else if (r.tres === "notyet") say(d.fail);
      else say(TRES[r.tres] || TRES.bad);
      render(); info();
    });
  }

  function load() { sync({ action: "task_info" }, function (d) { if (d) { render(); info(); } }); }

  var oldApply = apply;
  apply = function (d, batch) {
    oldApply(d, batch);
    if (d && d.tasks && typeof d.tasks === "object") { TK = d.tasks; render(); info(); }
  };
  var oldInfo = info;
  info = function () {
    oldInfo();
    try { dailyBtn.className = "tab" + ((dailyOk || pending()) && ready ? " hot" : ""); } catch (e) {}
  };

  dailyBtn.addEventListener("click", function () { say(""); render(); load(); });

  var tries = 0, iv = setInterval(function () {
    tries++;
    if (ready) { clearInterval(iv); load(); } else if (tries > 150) clearInterval(iv);
  }, 400);
  info();
})();
 
