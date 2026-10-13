/* Civciv Uçuşu: uygulama */
(function () {
  var API = "https://tpzvxbymndjjojluymmn.supabase.co/functions/v1/dynamic-task";
  var ZONE = String(window.CV_ZONE || "").replace(/[^0-9]/g, ""), AD_FN = "show_" + ZONE, AD3 = "rew", AD_EVERY = 2;
  var tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor("#7fd0e6"); tg.setBackgroundColor("#7fd0e6"); if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); } catch (e) {} }
  var initData = (tg && tg.initData) || "";
  var $ = function (id) { return document.getElementById(id); };
  var cv = $("cv"), ctx = cv.getContext("2d");
  var S = null, sim = null, idle = CV.make(777), run = null, taps = [], pend = false, mode = "boot", deaths = 0, adBusy = false, card = false, sheet = false, menuOpen = false;
  var fx = [], flash = 0, shake = 0, fl = 0, dead = null, scroll = 0, lastT = 0, acc = 0, pay = null, offline = false;
  var NS = "tr-TR";
  function fmt(n) { return (Number(n) || 0).toLocaleString(NS); }
  function usd(n) { return (Math.floor((Number(n) || 0) * 10000) / 10000).toFixed(4); }
  function haptic(k) { try { if (k === "light") tg.HapticFeedback.impactOccurred("light"); else tg.HapticFeedback.notificationOccurred(k); } catch (e) {} }
  function adFn() { return ZONE && typeof window[AD_FN] === "function" ? window[AD_FN] : null; }
  if (ZONE) { var sd = document.createElement("script"); sd.src = "https://libtl.com/sdk.js"; sd.setAttribute("data-zone", ZONE); sd.setAttribute("data-sdk", AD_FN); document.head.appendChild(sd); }

  function size() {
    var r = cv.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k);
  }
  window.addEventListener("resize", size); size();

  function call(body) {
    body.initData = initData;
    return fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "hata"); return d; }); });
  }
  function apply(d) { if (d && d.state) { S = d.state; $("bal").textContent = fmt(S.balance); if (!sheet) return; renderWallet(); } }

  function upd() {
    var ready = mode === "ready", wait = mode === "wait" || mode === "boot";
    $("ready").hidden = !(ready && !card);
    $("runN").hidden = !(mode === "play" || mode === "dead") || card;
    $("msg").textContent = (wait && !card && initData) ? (offline ? "Bağlantı bekleniyor…" : "Hazırlanıyor…") : "";
    var a = $("again"); a.disabled = !ready || adBusy || !!pay;
    a.textContent = adBusy ? "Bir saniye…" : (ready ? "Tekrar oyna" : "Hazırlanıyor…");
  }

  function startRun() {
    mode = "wait"; upd();
    call({ action: "run_start" }).then(function (d) {
      offline = false; apply(d);
      if (d.res === "ok" && d.run) { run = { id: d.run, seed: d.seed }; sim = CV.make(d.seed); taps = []; pend = false; scroll = 0; mode = "ready"; upd(); }
      else setTimeout(startRun, d.res === "slow" ? 900 : 3000);
    }).catch(function () { offline = true; upd(); setTimeout(startRun, 3000); });
  }

  function setMenu(on) { menuOpen = !!on; $("menu").hidden = !menuOpen; $("setBtn").setAttribute("aria-expanded", menuOpen ? "true" : "false"); }
  function tap() {
    if (menuOpen) { setMenu(false); return; }
    if (card || sheet) return;
    if (mode === "ready") { mode = "play"; lastT = 0; acc = 0; pend = true; upd(); }
    else if (mode === "play") pend = true;
  }
  $("stage").addEventListener("pointerdown", function (e) { if (e.target.closest && e.target.closest("button, input")) return; e.preventDefault(); tap(); });
  document.addEventListener("keydown", function (e) { if (e.code === "Escape") setMenu(false); else if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); if (!e.repeat) tap(); } });
  /* oyun sırasında üst çubuğa dokunmak da zıplatır, menü açılmaz */
  $("hud").addEventListener("pointerdown", function (e) { if (mode === "play") { e.preventDefault(); tap(); } });
  document.addEventListener("pointerdown", function (e) { if (menuOpen && !(e.target.closest && e.target.closest("#menu, #setBtn"))) setMenu(false); });

  function coinFx() {
    fx.push({ x: CV.BX + 14, y: sim.y - 18, a: 0 }); haptic("light");
    $("runN").textContent = sim.coins;
  }

  function die() {
    mode = "dead"; deaths++;
    dead = { y: sim.y, vy: Math.max(sim.vy, 2) }; flash = .85; shake = 10; haptic("error");
    var frames = sim.f, coins = sim.coins, mine = run, tp = taps.slice();
    setTimeout(function () {
      showOver(coins);
      var d = []; for (var i = 0; i < tp.length; i++) d.push(i ? tp[i] - tp[i - 1] : tp[i]);
      pay = { run: mine.id, frames: frames, taps: d };
      submit(0);
      if (deaths % AD_EVERY === 0) setTimeout(showAd, 900);
    }, 750);
  }

  function showOver(coins) {
    card = true; $("over").hidden = false;
    $("oCoin").textContent = coins > 0 ? "+" + fmt(coins) : "0";
    $("oSub").textContent = S ? "En iyi: " + fmt(S.best) + "  ·  Bakiye: " + fmt(S.balance) : "";
    onote("Kaydediliyor…"); $("retry").hidden = true; upd();
  }
  function onote(t, k) { var n = $("oNote"); n.textContent = t || ""; n.className = k || ""; }

  var RES = { ok: "Kaydedildi ✓", dup: "Bu oyun zaten kaydedilmişti.", fast: "Süre uyuşmadı, coin eklenmedi.", bad: "Bu oyun doğrulanamadı, coin eklenmedi." };
  function submit(n) {
    var p = pay; if (!p) return;
    onote("Kaydediliyor…"); $("retry").hidden = true;
    call({ action: "run_end", run: p.run, frames: p.frames, taps: p.taps }).then(function (r) {
      apply(r); pay = null;
      if (r.res === "ok") { $("oCoin").textContent = r.credit > 0 ? "+" + fmt(r.credit) : "0"; haptic("success"); }
      onote(RES[r.res] || RES.bad, r.res === "ok" ? "good" : "bad");
      $("oSub").textContent = S ? "En iyi: " + fmt(S.best) + "  ·  Bakiye: " + fmt(S.balance) : "";
      startRun();
    }).catch(function () {
      if (n < 2) setTimeout(function () { submit(n + 1); }, 1200 * (n + 1));
      else { onote("Bağlantı sorunu, coin kaydedilemedi.", "bad"); $("retry").hidden = false; upd(); }
    });
  }
  $("retry").addEventListener("click", function () { submit(0); });

  function showAd() {
    var f = adFn(); if (!f || adBusy) return;
    adBusy = true; upd();
    var done = function () { if (!adBusy) return; adBusy = false; upd(); };
    var tm = setTimeout(done, 30000);
    try {
      var pr = AD3 === "inapp" ? f({ type: "inApp", inAppSettings: { frequency: 1, capping: 0.05, interval: 10, timeout: 1, everyPage: false } }) : f();
      if (pr && pr.then) pr.then(function () { clearTimeout(tm); done(); }, function () { clearTimeout(tm); done(); }); else { clearTimeout(tm); done(); }
    } catch (e) { clearTimeout(tm); done(); }
  }

  $("again").addEventListener("click", function () {
    if (mode !== "ready" || adBusy || pay) return;
    card = false; $("over").hidden = true; dead = null; fx = []; $("runN").textContent = "0"; upd();
  });

  /* paneller */
  var RW = { ok: "Kaydedildi ✓", bad_wallet: "Adres geçersiz görünüyor. TON adresini (UQ… ya da EQ…) kontrol et.", noplayer: "Oturum yenileniyor, tekrar dene.", pending: "Bekleyen bir çekimin var, bitmeden değiştirilemez." };
  var RD = { ok: "Çekim isteğin alındı ✓", closed: "Çekimler şu an kapalı.", no_wallet: "Önce cüzdan adresini kaydet.", pending: "Zaten bekleyen bir çekimin var.", min: "Çekim için biraz daha coin biriktirmelisin.", noplayer: "Oturum yenileniyor, tekrar dene." };
  var SD = { pending: "Bekliyor", paid: "Ödendi", rejected: "Reddedildi" };
  function pnote(t, good) { var n = $("wNote"); n.textContent = t || ""; n.className = "pn " + (good ? "good" : "bad"); }
  function renderWallet() {
    if (!S) return;
    var rate = Number(S.cfg.wd_rate) || 1, min = Number(S.cfg.wd_min) || 0, minCoins = Math.ceil(rate * min);
    $("wBal").textContent = fmt(S.balance);
    $("wUsd").textContent = "≈ " + usd(S.balance / rate) + " USDT";
    $("wRule").textContent = fmt(rate) + " coin = 1 USDT. En az " + fmt(minCoins) + " coin (" + min + " USDT) birikince çekim isteyebilirsin.";
    if (document.activeElement !== $("wIn")) $("wIn").value = S.wallet || "";
    $("wReq").disabled = !S.cfg.wd_open || S.wd_pending || S.balance < minCoins;
    $("wSave").disabled = S.wd_pending;
    var h = ""; (S.wd || []).forEach(function (w) { var d = new Date(w.at); h += "<div><span>" + ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "  " + usd(w.amount) + " USDT</span><span>" + (SD[w.status] || w.status) + "</span></div>"; });
    $("wList").innerHTML = h;
  }
  var PANELS = ["p-wd", "p-tasks", "p-rank", "p-help"];
  function openPanel(id) { setMenu(false); sheet = true; $("sheet").hidden = false; PANELS.forEach(function (p) { $(p).hidden = p !== id; }); pnote(""); renderWallet(); }
  function closePanel() { sheet = false; $("sheet").hidden = true; }
  Array.prototype.forEach.call(document.querySelectorAll("[data-close]"), function (b) { b.addEventListener("click", closePanel); });
  $("sheet").addEventListener("click", function (e) { if (e.target === $("sheet")) closePanel(); });
  $("setBtn").addEventListener("click", function () { if (mode !== "play") setMenu(!menuOpen); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-open]"), function (b) { b.addEventListener("click", function () { var id = b.getAttribute("data-open"); if (id === "p-wd" && !S) { setMenu(false); return; } openPanel(id); }); });
  $("toWallet").addEventListener("click", function () { if (S) openPanel("p-wd"); });
  $("helpBtn").addEventListener("click", function () { if (mode !== "play") openPanel("p-help"); });
  $("wSave").addEventListener("click", function () {
    var w = $("wIn").value.trim(); $("wSave").disabled = true;
    call({ action: "wallet_set", wallet: w }).then(function (d) { apply(d); pnote(RW[d.res] || RW.noplayer, d.res === "ok"); }).catch(function () { pnote("Bağlantı sorunu, tekrar dene."); }).then(function () { if (S) renderWallet(); });
  });
  $("wReq").addEventListener("click", function () {
    $("wReq").disabled = true;
    call({ action: "wd_request" }).then(function (d) { apply(d); pnote(RD[d.res] || RD.noplayer, d.res === "ok"); }).catch(function () { pnote("Bağlantı sorunu, tekrar dene."); }).then(function () { if (S) renderWallet(); });
  });

  /* döngü */
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = lastT ? Math.min(ts - lastT, 100) : 0; lastT = ts;
    if (mode === "play") {
      acc += dt; var n = 0;
      while (acc >= 16.6667 && n < 6 && mode === "play") {
        acc -= 16.6667; n++;
        var t = pend; pend = false;
        if (t) { taps.push(sim.f); fl = 1; }
        var g = CV.step(sim, t); scroll += 2.6;
        if (g) coinFx();
        if (sim.dead) { die(); break; }
      }
    } else if (mode !== "dead") scroll += 0.5;
    var by, vy;
    if (mode === "play") { by = sim.y; vy = sim.vy; }
    else if (mode === "dead" && dead) { dead.vy += .6; dead.y = Math.min(CV.GROUND - CV.R, dead.y + dead.vy); by = dead.y; vy = dead.vy; }
    else { by = 300 + Math.sin(ts / 260) * 7; vy = 0; fl = Math.max(0, Math.sin(ts / 150)) * .6; }
    fl *= .86; flash = Math.max(0, flash - .05); shake = Math.max(0, shake - .6);
    for (var i = fx.length - 1; i >= 0; i--) { fx[i].a += .045; if (fx[i].a >= 1) fx.splice(i, 1); }
    var k = cv.width / CV.W; ctx.setTransform(k, 0, 0, k, 0, 0); var top = Math.max(0, cv.height / k - CV.H);
    CVR.draw(ctx, (mode === "play" || mode === "dead" || mode === "ready") && sim ? sim : idle, { t: ts, scroll: scroll, by: by, vy: vy, fl: fl, fx: fx, flash: flash, shake: shake, top: top });
  }
  requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", function () { lastT = 0; });

  /* açılış */
  if (!initData) { $("msg").textContent = "Bu oyun Telegram içinde açılır."; }
  else {
    upd();
    call({ action: "open" }).then(function (d) {
      apply(d); startRun();
    }).catch(function () { offline = true; upd(); setTimeout(function () { location.reload(); }, 4000); });
  }
})();
      
