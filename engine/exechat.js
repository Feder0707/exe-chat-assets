/* EXE CHAT - Cozy Cabin - engine v1.0.2 - form&soul.exe */
(function () {
  'use strict';
  const VERSION = '1.0.2';
  const W = 600, H = 900;                         // native size of the scene (scaled by the host)
  const cl = v => Math.max(0, Math.min(1, v)), eo = v => 1 - Math.pow(1 - cl(v), 3), ei = v => cl(v) * cl(v);
  const eio = v => { v = cl(v); return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const CMDS = ['pet', 'cookie', 'cocoa', 'snowball', 'dance', 'nap', 'boo', 'tail', 'hug', 'howl', 'blanket', 'wave'];
  const EVENTS = ['sub', 'follow', 'raid', 'bits', 'tip'];
  const DEFAULTS = {
    fontSize: 32,              // px at native size
    maxLines: 4,               // lines per plank before the text is cut with "\u2026"
    expire: 0,                 // seconds a message stays (0 = never)
    sleepAfter: 25,            // seconds of silence before the fox naps
    cmdCooldown: 4, globalCooldown: 0.8,
    commands: Object.fromEntries(CMDS.map(c => [c, { on: true, trigger: '!' + c }])),
    showCommands: false,       // show "!cookie" as a plank too
    cmdAnywhere: false,        // also react when the command is in the middle of a message
    events: { sub: true, follow: true, raid: true, bits: true, tip: true },
    firstTag: true, mentionWords: 'fox,zorro',
    ignore: '', light: true, sound: true, volume: 0.6, scale: 1,
  };
  const HELP = 'ExeChat.create({ root, base, config, manual }) \u2192 { message, event, command, deleteMessage, deleteUser, clear, tick, setConfig, state, destroy }';

  const CSS = (B, fs) => `
.xc{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;font-family:"XCJersey",ui-monospace,monospace}
.xc img{max-width:none}
.xc .post{position:absolute;top:70px;width:34px;height:780px;-webkit-mask-image:linear-gradient(#000 78%,transparent);mask-image:linear-gradient(#000 78%,transparent)}
.xc .beam{position:absolute;left:0;top:0;width:600px;height:132px;box-sizing:border-box;border-style:solid;border-width:0 33px 0 55px;border-image:url(${B}beam_log.webp) 0 30 0 50 fill stretch;z-index:5}
.xc .lantern{position:absolute;left:297px;top:106px;width:69px;z-index:5}
.xc .rtop{position:absolute;width:12px;height:20px;margin-left:-6px;z-index:6;background:url(${B}rope_tile.webp) center top/12px auto repeat-y;filter:drop-shadow(0 -2px 0 rgba(30,14,4,.55)) drop-shadow(1px 1px 0 rgba(30,14,4,.4));-webkit-mask-image:linear-gradient(transparent 0,#000 4px);mask-image:linear-gradient(transparent 0,#000 4px)}
.xc .rope{position:absolute;width:12px;margin-left:-6px;background:url(${B}rope_tile.webp) center top/12px auto repeat-y;z-index:2}
.xc .planks{position:absolute;inset:0;perspective:1100px;z-index:3}
.xc .pl{position:absolute;left:70px;top:0;width:460px;transform-style:preserve-3d}
.xc .face{position:relative;box-sizing:border-box;width:460px;border-style:solid;border-width:42px 27px 25px 27px;border-image:url(${B}r_old.webp) 60 38 36 38 fill stretch;padding:2px 20px 2px 22px;font:400 ${fs}px/1.12 "XCJersey",ui-monospace,monospace;letter-spacing:.4px;color:#1c0b02;overflow-wrap:anywhere;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.xc .txt{display:block;overflow:hidden}
.xc .face b{font-weight:400}
.xc .face .emote{height:1.05em;width:auto;vertical-align:-.18em;margin:0 1px}
.xc .face .badge{height:.72em;width:auto;vertical-align:-.04em;margin-right:4px;image-rendering:auto}
.xc .tagnew{display:inline-block;position:relative;width:62px;height:27px;margin-right:6px;vertical-align:-4px;background:url(${B}tag_h.webp) center/contain no-repeat;transform-origin:8% 50%}
.xc .tagnew span{position:absolute;left:25px;right:1px;top:2px;text-align:center;font:400 19px "XCJersey",monospace;color:#4a2a08}
.xc .pl.warm .face{border-image-source:url(${B}r_warm.webp)}
.xc .pl.ev .face{border-image-source:url(${B}r_gold.webp);text-align:center}
.xc .pl.ev .t{display:block;color:#8a3b00;letter-spacing:1px}
.xc .back{position:absolute;inset:0;border-style:solid;border-width:40px 26px 24px;border-image:url(${B}r_back.webp) 56 36 34 36 fill stretch;transform:rotateX(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden}
.xc .bind{position:absolute;width:40px;margin-left:-20px;filter:drop-shadow(2px 2px 0 rgba(30,14,4,.5));pointer-events:none}
.xc .face .bind{top:-32px;height:calc(100% + 63px)}.xc .back .bind{top:-30px;height:calc(100% + 60px)}
.xc .halo,.xc .floorlight{position:absolute;pointer-events:none;mix-blend-mode:screen;border-radius:50%;opacity:0}
.xc .halo{width:260px;height:260px;margin:-130px 0 0 -130px;z-index:6}
.xc .floorlight{width:230px;height:60px;margin:-30px 0 0 -115px;z-index:7}
.xc .ledge{position:absolute;left:275px;top:792px;width:320px;z-index:6}
.xc .fox{position:absolute;left:0;top:0;z-index:7;transform-origin:50% 100%}
.xc .foxsit{position:absolute;z-index:7;transform-origin:50% 100%}.xc .foxsit img{position:absolute}.xc .ftail{transform-origin:18% 88%}
.xc .fx{position:absolute;z-index:9;pointer-events:none}
.xc .say{position:absolute;z-index:10;font:400 28px "XCJersey",monospace;color:#fff4e0;white-space:nowrap;text-shadow:-2px -2px 0 #2a1406,2px -2px 0 #2a1406,-2px 2px 0 #2a1406,2px 2px 0 #2a1406;transform:translateX(-50%)}`;

  function create(opts) {
    const root = opts.root, BASE = (opts.base || '').replace(/\/?$/, '/'), A = BASE + 'assets/', S = BASE + 'sounds/';
    let cfg = merge(DEFAULTS, opts.config || {});
    const manual = !!opts.manual;

    // ---------- DOM ----------
    const style = document.createElement('style');
    style.textContent = `@font-face{font-family:XCJersey;src:url(${BASE}fonts/jersey-15-latin-400-normal.woff2) format('woff2')}` + CSS(A, cfg.fontSize);
    document.head.appendChild(style);
    const el = document.createElement('div'); el.className = 'xc';
    el.innerHTML = `<img class="post" src="${A}post.webp" alt="" style="left:22px"><img class="post" src="${A}post.webp" alt="" style="left:544px">
<div class="rope rL" style="left:94px"></div><div class="rope rR" style="left:506px"></div>
<div class="beam"></div><img class="lantern" src="${A}lantern.webp" alt=""><div class="rtop" style="left:94px;top:117px"></div><div class="rtop" style="left:506px;top:96px"></div>
<div class="planks"></div><img class="ledge" src="${A}ledge.webp" alt=""><div class="floorlight"></div><div class="halo"></div>
<div class="foxsit"><img class="ftail" src="${A}fox_tail_a.webp" alt=""><img class="fbody" src="${A}fox_body_open.webp" alt=""></div><img class="fox" src="${A}f_sleep.webp" alt="">`;
    root.appendChild(el);
    const $ = s => el.querySelector(s);
    const box = $('.planks');
    const preload = n => { const i = new Image(); i.src = A + n + '.webp'; };
    ['f_pet0', 'f_pet1', 'f_pet2', 'f_cookie0', 'f_cookie1', 'f_cookie2', 'f_wave0', 'f_wave1', 'fox_body_blink', 'r_warm', 'r_gold', 'r_back', 'coin_edge'].forEach(preload);
    let T = 0, dead = false;

    // ---------- sound ----------
    const VOICES = new Set([...CMDS, 'wake', 'mention', 'sub', 'follow', 'raid', 'bits']);
    let curSnd = null;
    function sfx(name, delay = 0, voice = false) {
      if (!cfg.sound || manual) return;
      const go = () => { const a = new Audio(S + name + '.mp3'); a.volume = cl(cfg.volume) * (name === 'flip' ? .6 : 1); a.play().catch(() => {}); if (voice) { stopVoice(); curSnd = a; } };
      delay ? setTimeout(go, delay * 1000) : go();
    }
    function stopVoice() { const a = curSnd; curSnd = null; if (!a) return; const v0 = a.volume; let k = 0; const iv = setInterval(() => { k++; a.volume = Math.max(0, v0 * (1 - k / 6)); if (k >= 6) { a.pause(); clearInterval(iv); } }, 25); }

    // ---------- planks ----------
    const TOP = 248, BOTTOM = 672, GAP = 12, BEAM_BOTTOM = 118, FLIP = 0.75;
    let P = [], gone = [], lastMsgAt = -99, seen = new Set(), mid = 0;
    const op = (e, v) => { e.querySelector('.face').style.opacity = v; e.querySelector('.back').style.opacity = v; };
    const BIND = (l, r) => `<img class="bind" src="${A}bind.webp" alt="" style="left:${l}px"><img class="bind" src="${A}bind.webp" alt="" style="left:${r}px">`;
    function addPlank(kind, html, o = {}) {
      const t = T, e = document.createElement('div');
      e.className = 'pl' + (kind !== 'msg' ? ' ev' : '');
      e.innerHTML = `<div class="face">${BIND(-3, 409)}<span class="txt">${o.first && cfg.firstTag ? '<span class="tagnew"><span>new</span></span>' : ''}${html}</span></div><div class="back">${BIND(-2, 410)}</div>`;
      box.appendChild(e);
      const txt = e.querySelector('.txt'), lh = cfg.fontSize * 1.12;            // cut very long messages so a plank never fills the board
      if (txt.scrollHeight > lh * cfg.maxLines + 2) { txt.style.maxHeight = lh * cfg.maxLines + 'px'; txt.style.webkitMaskImage = txt.style.maskImage = 'linear-gradient(#000 80%,transparent)'; }
      const h = e.querySelector('.face').offsetHeight;
      const p = { id: ++mid, el: e, kind, h, born: t, y: 0, from: 0, to: 0, t0: t, flip0: -9, warmUntil: -1, enter: t + 0.35, msgId: o.msgId, userId: o.userId };
      const prev = P[0];
      P.forEach((q, i) => { q.flip0 = t + 0.05 * i; q.warmUntil = q === prev ? q.flip0 + FLIP * 0.25 : -1; });
      P.unshift(p); layout(t, true);
      sfx(kind === 'msg' ? (o.first && cfg.firstTag ? 'first' : 'msg') : 'event', 0.35); if (P.length > 1) sfx('flip', 0.02);
      return p;
    }
    function layout(t, flipping) {
      const total = () => P.reduce((s, q) => s + q.h + GAP, 0);
      while (total() > BOTTOM - TOP && P.length > 1) { const o = P.pop(); o.exit = t; o.exitY = o.y; o.mode = 'fall'; gone.push(o); }
      let y = TOP; P.forEach(q => { if (q.born === t) { q.from = q.to = q.y = y; } else { q.from = q.y; q.to = y; q.t0 = flipping ? q.flip0 : t; } y += q.h + GAP; });
    }
    function puff(p) { const i = P.indexOf(p); if (i < 0) return; P.splice(i, 1); p.exit = T; p.exitY = p.y; p.mode = 'puff'; gone.push(p); layout(T, false);
      for (let k = 0; k < 4; k++) addFx({ noPop: 1, src: A + `sp${k}.webp`, x: 300, y: p.y + p.h / 2, w: [190, 250, 290, 210][k], t0: T + k * 0.11, dur: 0.14 + (k === 3 ? 0.25 : 0), fade: k === 3 });
      sfx('puff'); }
    function renderPlanks(t) {
      P.forEach((q, i) => {
        q.y = q.from + (q.to - q.from) * eio((t - q.t0) / FLIP);
        let rot = 0;
        if (t >= q.flip0 && t < q.flip0 + FLIP) rot = -360 * eio((t - q.flip0) / FLIP);
        if (t < q.enter + 1.6) { const a = t - q.enter; rot = a < 0 ? 90 : 90 * Math.exp(-a * 4) * Math.cos(a * 8); }
        q.el.classList.toggle('warm', q.kind === 'msg' && (i === 0 || t < q.warmUntil));
        q.el.style.transform = `translateY(${q.y}px) rotateX(${rot}deg)`; op(q.el, t < q.enter ? 0 : 1);
        const tg = q.el.querySelector('.tagnew'); if (tg) tg.style.transform = `rotate(${Math.sin((t - q.born) * 5) * 12 * Math.exp(-(t - q.born) * 0.8)}deg)`;
      });
      gone.forEach(o => { const a = t - o.exit;
        if (o.mode === 'fall') { o.el.style.transformOrigin = '50% 0%'; o.el.style.transform = `translateY(${o.exitY + 160 * ei(a / 0.7)}px) rotateX(${-50 * eo(a / 0.7)}deg)`; op(o.el, 1 - cl((a - 0.15) / 0.35)); }
        else { o.el.style.transform = `translateY(${o.exitY}px) scale(${1 - 0.5 * eo(a / 0.25)})`; op(o.el, 1 - cl(a / 0.18)); }
        if (a > 1) { o.el.remove(); o.dead = 1; } });
      gone = gone.filter(o => !o.dead);
      const low = P.reduce((m, q) => Math.max(m, t < q.enter ? 0 : q.y + q.h), BEAM_BOTTOM + 40);
      el.querySelectorAll('.rope').forEach(r => { r.style.top = '64px'; r.style.height = (low - 64 + 34) + 'px'; });
      if (cfg.expire > 0) { const old = [...P].reverse().find(q => t - q.born > cfg.expire && t >= q.enter); if (old) puff(old); }
    }

    // ---------- effects ----------
    let FX = [], FXOWNER = 0;
    function addFx(o) { const e = document.createElement(o.text ? 'div' : 'img'); e.className = o.text ? 'say' : 'fx';
      if (o.text) e.textContent = o.text; else { e.src = o.src; e.alt = ''; e.style.width = o.w + 'px'; }
      el.appendChild(e);
      if (o.text) { const room = W - 24; let tw = e.offsetWidth;                    // keep the whole line inside the scene
        if (tw > room) { e.style.fontSize = Math.floor(28 * room / tw) + 'px'; tw = e.offsetWidth; }
        o.x = Math.max(12 + tw / 2, Math.min(W - 12 - tw / 2, o.x)); } o.el = e; o.owner = FXOWNER; FX.push(o); return o; }
    function renderFx(t) {
      FX.forEach(o => { const a = t - o.t0, u = a / o.dur;
        if (o.killAt !== undefined && (a < 0 || t - o.killAt > 0.22)) { o.el.remove(); o.dead = 1; return; }
        if (a < 0) { o.el.style.opacity = 0; return; }
        if (u > 1) { o.el.remove(); o.dead = 1; return; }
        const x = o.x + (o.vx || 0) * a + (o.wob ? Math.sin(a * 6 + (o.ph || 0)) * o.wob : 0), y = o.y + (o.vy || 0) * a + 0.5 * (o.g || 0) * a * a;
        const w = o.text ? 0 : o.w * (o.grow ? 1 + o.grow * u : 1);
        o.el.style.left = (o.text ? x : x - w / 2) + 'px'; o.el.style.top = (y - (o.text ? 0 : o.el.offsetHeight / 2)) + 'px';
        if (!o.text) o.el.style.width = w + 'px';
        const pin = 0.55 + 0.45 * (1 + 2.2 * Math.pow(cl(a / 0.2) - 1, 3) + 1.2 * Math.pow(cl(a / 0.2) - 1, 2));
        o.el.style.transform = (o.text ? 'translateX(-50%) ' : '') + `rotate(${(o.spin || 0) * a}deg) scale(${o.noPop ? 1 : pin})`;
        let opc = o.fade ? 1 - ei(u) : (u > 0.8 ? (1 - u) / 0.2 : 1);
        if (o.killAt !== undefined) opc *= 1 - (t - o.killAt) / 0.22;
        o.el.style.opacity = opc;
        if (o.coin) { const edge = Math.floor(a * 10) % 2; o.el.src = A + (edge ? 'coin_edge.webp' : 'coin.webp'); o.el.style.width = (edge ? o.w * 35 / 154 : o.w) + 'px'; o.el.style.marginLeft = edge ? (o.w - o.w * 35 / 154) / 2 + 'px' : '0'; }
      });
      FX = FX.filter(o => !o.dead);
    }

    // ---------- the fox ----------
    const FOXX = 506, FOXY = 830;
    const FEET = { f_blanket: .5, f_boo: .32, f_catch: .419, f_cocoa: .316, f_cookie: .307, f_danceA: .525, f_danceB: .477, f_excited: .352, f_howl: .341, f_hug: .36, f_idle2: .382, f_lookup: .334, f_pet: .40, f_shake: .451, f_sleep: .5, f_tail: .5, f_wave: .396, f_yawn: .334 };
    const POSE = { pet: ['f_pet', .43], cookie: ['f_cookie', .43], cocoa: ['f_cocoa', .43], shake: ['f_shake', .41], danceA: ['f_danceA', .41], danceB: ['f_danceB', .41],
      boo: ['f_boo', .41], tail: ['f_tail', .43], hug: ['f_hug', .43], howl: ['f_howl', .43], blanket: ['f_blanket', .45], wave: ['f_wave', .41],
      lookup: ['f_lookup', .40], catch: ['f_catch', .40], excited: ['f_excited', .40], yawn: ['f_yawn', .41], sleep: ['f_sleep', .40], idle2: ['f_idle2', .37] };
    const SIZE = { f_blanket: [267, 302], f_boo: [296, 391], f_catch: [296, 362], f_cocoa: [248, 304], f_cookie: [253, 304], f_danceA: [279, 425], f_danceB: [281, 425], f_excited: [270, 399], f_howl: [284, 331], f_hug: [270, 304], f_idle2: [254, 388], f_lookup: [282, 353], f_pet: [304, 313], f_shake: [321, 318], f_sleep: [325, 250], f_tail: [267, 310], f_wave: [281, 425], f_yawn: [318, 320] };
    const ANIM = { pet: { base: 'f_pet', w: 328, h: 319, k: .422, feet: .502, seq: [0, 1, 2, 1], fps: 4.5 }, cookie: { base: 'f_cookie', w: 253, h: 291, k: .449, feet: .381, seq: [0, 1, 2, 1], fps: 5 }, wave: { base: 'f_wave', w: 294, h: 355, k: .49, feet: .494, seq: [0, 1], fps: 4 } };
    const hearts = (n, t0, src = 'heart') => { for (let k = 0; k < n; k++) addFx({ src: A + src + '.webp', x: FOXX - 30 + k * 28, y: FOXY - 150, w: 22, vy: -60, wob: 8, ph: k, t0: t0 + k * 0.35, dur: 1.6 }); };
    const sparks = (n, t0, cx = FOXX, cy = FOXY - 175) => { for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; addFx({ src: A + 'sparkle.webp', x: cx, y: cy, w: 18, vx: Math.cos(a) * 120, vy: Math.sin(a) * 90, t0, dur: 0.9, fade: 1 }); } };
    const say = (text, t0, dur = 2.2) => addFx({ text, x: FOXX, y: FOXY - 215, vy: -10, t0, dur });
    const R = {
      pet: { dur: 2.6, pose: () => 'pet', move: a => ({ rot: Math.sin(a * 3) * 3 }), start: t => hearts(3, t + 0.3, 'heart2') },
      cookie: { dur: 2.8, pose: () => 'cookie', move: a => ({ sy: 1 - 0.03 * Math.abs(Math.sin(a * 9)) }), start: t => { for (let k = 0; k < 4; k++) addFx({ src: A + 'crumbs.webp', x: FOXX - 6 + k * 6, y: FOXY - 70, w: 30, vy: 10, g: 300, vx: (k - 1.5) * 30, t0: t + 0.4 + k * 0.45, dur: 0.6 }); } },
      cocoa: { dur: 3.0, pose: () => 'cocoa', move: a => ({ sy: 1 + 0.015 * Math.sin(a * 3) }), start: t => { for (let k = 0; k < 3; k++) addFx({ src: A + 'steam.webp', x: FOXX - 8, y: FOXY - 105, w: 18, vy: -40, wob: 5, ph: k, grow: 0.6, t0: t + k * 0.8, dur: 1.4, fade: 1 }); } },
      snowball: { dur: 2.4, pose: a => a < 0.55 ? 'idle' : 'shake', move: a => a < 0.55 ? {} : ({ rot: Math.sin(a * 40) * 6 * cl(1 - (a - .55) / 1.6), dx: Math.sin(a * 40) * 3 }),
        start: t => { addFx({ src: A + 'snowball.webp', x: FOXX - 240, y: FOXY - 260, w: 34, vx: 420, vy: 160, g: 120, spin: 400, t0: t, dur: 0.55 });
          addFx({ noPop: 1, src: A + 'sp1.webp', x: FOXX - 6, y: FOXY - 125, w: 70, grow: 0.4, t0: t + 0.55, dur: 0.45, fade: 1 });
          for (let k = 0; k < 6; k++) addFx({ src: A + 'flake1.webp', x: FOXX - 6, y: FOXY - 125, w: 10, vx: Math.cos(k) * 140, vy: -80 + Math.sin(k) * 60, g: 400, t0: t + 0.55, dur: 0.8, fade: 1 }); } },
      dance: { dur: 4.0, pose: a => Math.floor(a / 0.32) % 2 ? 'danceB' : 'danceA', move: a => ({ dy: -Math.abs(Math.sin(a * Math.PI / 0.32)) * 8 }),
        start: t => { for (let k = 0; k < 5; k++) addFx({ src: A + (k % 2 ? 'note2' : 'note1') + '.webp', x: FOXX + (k % 2 ? 60 : -60), y: FOXY - 140, w: 24, vy: -50, wob: 10, ph: k, t0: t + k * 0.7, dur: 1.5 }); } },
      nap: { dur: 6.0, pose: a => a < 1.0 ? 'yawn' : 'sleep', move: a => a < 1 ? ({ sy: 1 + 0.04 * Math.sin(a * Math.PI) }) : ({ sy: 1 + 0.03 * Math.sin(a * 1.6) }) },
      boo: { dur: 1.6, pose: () => 'boo', move: a => ({ dy: -60 * Math.sin(cl(a / 0.6) * Math.PI), rot: Math.sin(a * 30) * 2 * cl(1 - a) }), start: t => say('!!', t, 0.9) },
      tail: { dur: 2.2, pose: () => 'tail', move: a => ({ rot: 720 * eio(a / 2.0), dy: -6 * Math.abs(Math.sin(a * 6)), oy: 0.55 }) },
      hug: { dur: 2.8, pose: () => 'hug', move: a => ({ s: 1 + 0.04 * Math.max(0, Math.sin(a * 7)) }), start: t => hearts(4, t + 0.2) },
      howl: { dur: 2.8, pose: () => 'howl', move: a => ({ rot: Math.sin(a * 22) * 1.2 }), start: t => say('awoooo~', t + 0.2, 2.4) },
      blanket: { dur: 4.5, pose: () => 'blanket', move: a => ({ sy: 1 + 0.025 * Math.sin(a * 2) }), start: t => { for (let k = 0; k < 3; k++) addFx({ src: A + 'sparkle.webp', x: FOXX - 40 + k * 40, y: FOXY - 120, w: 14, vy: -20, t0: t + k * 0.6, dur: 1.2, fade: 1 }); } },
      wave: { dur: 2.4, pose: () => 'wave', move: a => ({ rot: Math.sin(a * 10) * 3 }), start: (t, u) => say(`hi, ${u}!`, t + 0.1, 2.2) },
      wake: { dur: 0.9, pose: () => 'yawn', move: a => ({ sy: 1 + 0.04 * Math.sin(a / 0.9 * Math.PI) }) },
      mention: { dur: 1.8, pose: () => 'lookup', move: a => ({ dy: -4 * Math.sin(a * 4) }), start: t => sparks(5, t + 0.1, FOXX + 20, FOXY - 170) },
      sub: { dur: 2.8, pose: () => 'excited', move: a => ({ dy: -Math.abs(Math.sin(a * 6)) * 14 * cl(1 - a / 2.8) }), start: t => { sparks(10, t); hearts(3, t + 0.4); } },
      follow: { dur: 2.4, pose: () => 'wave', move: a => ({ rot: Math.sin(a * 10) * 3 }), start: (t, u) => say(`thanks, ${u}!`, t + 0.1, 2.2) },
      raid: { dur: 3.4, pose: a => Math.floor(a / 0.4) % 2 ? 'excited' : 'boo', move: a => ({ dy: -Math.abs(Math.sin(a * 8)) * 18 }), start: t => { sparks(12, t); sparks(12, t + 0.8); say('RAID!', t, 1.6); } },
      bits: { dur: 2.6, pose: a => a < 0.8 ? 'lookup' : 'catch', move: a => a > 0.8 ? ({ dy: -8 * Math.sin(cl((a - .8) / .4) * Math.PI) }) : {},
        start: t => { addFx({ src: A + 'coin.webp', coin: 1, x: FOXX + 150, y: FOXY - 200, w: 34, vx: -183, vy: -250, g: 758, t0: t, dur: 0.82 }); sparks(8, t + 0.82, FOXX, FOXY - 200); } },
    };
    R.tip = R.bits;
    const LIGHT = { idle: [255, 190, 120, .10, 0], idle2: [255, 190, 120, .10, 0], sleep: [120, 150, 255, .12, .25], wake: [255, 210, 150, .25, 0],
      pet: [255, 150, 200, .55, .8], cookie: [255, 180, 90, .45, 0], cocoa: [255, 140, 70, .55, .5], snowball: [170, 220, 255, .65, 0],
      dance: [0, 0, 0, .6, 2], nap: [110, 140, 255, .28, .3], boo: [235, 240, 255, .8, 0], tail: [255, 200, 120, .45, 1.5],
      hug: [255, 80, 110, .6, 1.2], howl: [180, 200, 255, .6, .4], blanket: [255, 170, 110, .5, .3], wave: [255, 220, 140, .5, 0],
      mention: [240, 245, 255, .45, 0], sub: [255, 205, 70, .9, 2.2], follow: [255, 130, 180, .7, 1], raid: [180, 120, 255, .9, 3], bits: [255, 215, 80, .85, 1.6], tip: [140, 255, 170, .85, 1.6] };
    const SQ = 0.12, PRIO = n => EVENTS.includes(n) ? 3 : CMDS.includes(n) ? 2 : 1;
    let cur = null, queue = [], lastCmd = {}, lastGlobal = -99, lastActivity = -99, rid = 0;
    const F = { disp: 'sleep', tr: null, lastMv: {}, light: [255, 190, 120, 0] };
    const asleep = () => (!cur && T - lastActivity > cfg.sleepAfter) || (cur && cur.name === 'nap' && T - cur.t0 > 1);
    function react(name, user) {
      if (name !== 'wake' && cur && cur.name !== 'wake' && PRIO(name) < PRIO(cur.name)) return false;
      const sleeping = asleep() && name !== 'nap' && name !== 'wake';
      queue = sleeping ? [{ name: 'wake' }, { name, user }] : [{ name, user }];
      if (cur && cur.name !== 'wake') interrupt();
      lastActivity = T; return true;
    }
    function interrupt() { stopVoice(); const id = cur.id; FX.forEach(o => { if (o.owner === id && o.killAt === undefined) o.killAt = T; }); cur = null; }
    function command(name, user) {
      if (!R[name] || !CMDS.includes(name) || !cfg.commands[name] || !cfg.commands[name].on) return false;
      if (T - (lastCmd[name] ?? -99) < cfg.cmdCooldown || T - lastGlobal < cfg.globalCooldown) return false;
      lastCmd[name] = lastGlobal = T; return react(name, user);
    }
    function renderFox(t) {
      if (cur && t - cur.t0 > R[cur.name].dur) { lastActivity = cur.name === 'nap' ? t - cfg.sleepAfter - 0.01 : Math.max(lastActivity, t); cur = null; }
      if (!cur && queue.length) { const q = queue.shift(); cur = { name: q.name, t0: t, user: q.user, id: ++rid }; FXOWNER = rid; R[q.name].start && R[q.name].start(t, q.user || ''); FXOWNER = 0; if (VOICES.has(q.name)) sfx(q.name === 'tip' ? 'bits' : q.name, 0, true); }
      let pose = 'idle', mv = {};
      if (cur) { const a = t - cur.t0, r = R[cur.name]; pose = r.pose(a); mv = r.move(a) || {}; }
      else if (t - lastActivity > cfg.sleepAfter) { pose = 'sleep'; mv = { sy: 1 + 0.03 * Math.sin(t * 1.6) }; }
      else if ((t - lastActivity) % 14 > 11.5) pose = 'idle2';
      if (pose === 'sleep' && t - (F.lz || 0) > 1.1) { F.lz = t; addFx({ text: 'z', x: FOXX + 40, y: FOXY - 90, vy: -35, wob: 6, t0: t, dur: 2.2 }); }
      if (cur) { const a = t - cur.t0, d = R[cur.name].dur, env = eo(a / 0.22) * eo((d - a) / 0.3);
        ['dx', 'dy', 'rot'].forEach(k => { if (mv[k]) mv[k] *= env; }); ['sx', 'sy', 's'].forEach(k => { if (mv[k]) mv[k] = 1 + (mv[k] - 1) * env; }); }
      // pose change: old pose eases to rest while squashing, swaps at full squash, new pose springs up
      const target = F.tr ? F.tr.to : F.disp;
      if (pose !== target) { if (F.tr && t - F.tr.t0 < SQ) F.tr.to = pose; else F.tr = { from: F.disp, to: pose, t0: t, mv0: F.lastMv, sq0: F.tr ? F.sqNow : 1 }; }
      let sqx = 1, sqy = 1, outMv = null;
      if (F.tr) { const u = t - F.tr.t0;
        if (u < SQ) { const k = eio(u / SQ), q = F.tr.sq0 + (0.86 - F.tr.sq0) * k; sqy = q; sqx = 1 + (1 - q) * 0.6; F.disp = F.tr.from;
          const m0 = F.tr.mv0 || {}, r0 = (((m0.rot || 0) % 360) + 540) % 360 - 180; outMv = { dx: (m0.dx || 0) * (1 - k), dy: (m0.dy || 0) * (1 - k), rot: r0 * (1 - k), oy: m0.oy, sx: 1 + ((m0.sx || 1) - 1) * (1 - k), sy: 1 + ((m0.sy || 1) - 1) * (1 - k), s: 1 + ((m0.s || 1) - 1) * (1 - k) }; }
        else { const v = u - SQ; F.disp = F.tr.to; const spr = 0.14 * Math.exp(-v * 8) * Math.cos(v * 16); sqy = 1 - spr; sqx = 1 + spr * 0.6; if (v > 0.55) F.tr = null; } }
      F.sqNow = sqy; if (outMv) mv = outMv; else F.lastMv = mv;
      // light
      { const hl = $('.halo'), fl = $('.floorlight');
        if (!cfg.light) { hl.style.opacity = fl.style.opacity = 0; }
        else { const key = cur ? cur.name : (pose === 'idle2' || pose === 'sleep' ? pose : 'idle');
          let [lr, lg, lb, li, hz] = LIGHT[key] || LIGHT.idle;
          if (key === 'dance') { const h = (t * 90) % 360, c = v => Math.round(255 * (0.75 + 0.25 * Math.cos((h / 180 - v) * Math.PI))); lr = c(0); lg = c(2 / 3); lb = c(4 / 3); }
          if (hz) li *= 0.78 + 0.22 * Math.sin(t * hz * Math.PI * 2);
          if (cur) li += 0.35 * Math.exp(-(t - cur.t0) * 5);
          if (cur && t - cur.t0 > R[cur.name].dur - 0.4) li *= cl((R[cur.name].dur - (t - cur.t0)) / 0.4) * 0.7 + 0.3;
          const L = F.light, dt = Math.min(0.1, t - (F.lt ?? t)), e = 1 - Math.exp(-dt * 6); F.lt = t;
          [lr, lg, lb, li].forEach((v, i) => L[i] += (v - L[i]) * e);
          const col = `${L[0] | 0},${L[1] | 0},${L[2] | 0}`;
          hl.style.left = FOXX + 'px'; hl.style.top = (FOXY - 75) + 'px'; hl.style.opacity = Math.min(1, L[3] * 1.35);
          hl.style.background = `radial-gradient(circle, rgba(${col},.85) 0%, rgba(${col},.4) 30%, rgba(${col},.1) 55%, rgba(${col},0) 70%)`;
          fl.style.left = FOXX + 'px'; fl.style.top = (FOXY + 6) + 'px'; fl.style.opacity = Math.min(1, L[3] * 0.55);
          fl.style.background = `radial-gradient(ellipse, rgba(${col},.7) 0%, rgba(${col},.25) 45%, rgba(${col},0) 70%)`; } }
      const shown = F.disp;
      if (shown !== F.lastShown) { F.lastShown = shown; F.st = t; }
      const s = mv.s || 1, sx = s * (mv.sx || 1) * sqx, sy = s * (mv.sy || 1) * sqy;
      const fs = $('.foxsit'), img = $('.fox');
      if (shown === 'idle') {
        img.style.opacity = 0; fs.style.opacity = 1;
        const K = 0.33, bw = 245 * K, bh = 393 * K, fb = $('.fbody'), ft = $('.ftail');
        fb.style.width = bw + 'px'; ft.style.width = 211 * K + 'px'; ft.style.left = 110 * K / 0.77 + 'px'; ft.style.top = 110 * K / 0.77 + 'px';
        const since = t - lastMsgAt; ft.style.transform = `rotate(${Math.sin(t * 3.1) * 7 + (since < 3 ? Math.sin(since * 14) * 6 * (1 - since / 3) : 0)}deg)`;
        const w = A + ((t % 3.3) > 3.15 ? 'fox_body_blink' : 'fox_body_open') + '.webp'; if (fb.getAttribute('src') !== w) fb.src = w;
        fs.style.left = (FOXX - bw * 0.506 + 6) + 'px'; fs.style.top = (FOXY - bh + (mv.dy || 0)) + 'px';
        fs.style.transform = `scale(${sx},${sy * (1 + 0.018 * Math.sin(t * 2.6))})`;
      } else {
        fs.style.opacity = 0; img.style.opacity = 1;
        let name, k, w, h, fx; const an = ANIM[shown];
        if (an) { name = an.base + an.seq[Math.floor((t - (F.st || 0)) * an.fps) % an.seq.length]; k = an.k; w = an.w * k; h = an.h * k; fx = an.feet; }
        else { const p = POSE[shown]; name = p[0]; k = p[1]; w = SIZE[name][0] * k; h = SIZE[name][1] * k; fx = FEET[name] ?? .5; }
        const src = A + name + '.webp'; if (img.getAttribute('src') !== src) img.src = src;
        img.style.width = w + 'px'; img.style.left = (FOXX - w * fx + (mv.dx || 0)) + 'px'; img.style.top = (FOXY - h + (mv.dy || 0)) + 'px';
        img.style.transformOrigin = `${fx * 100}% ${mv.oy ? mv.oy * 100 : 100}%`; img.style.transform = `rotate(${mv.rot || 0}deg) scale(${sx},${sy})`;
      }
    }

    // ---------- input ----------
    function inkFor(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#5a2a0a';
      const [r, g, b] = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, sat = 0; const l = (mx + mn) / 2;
      if (mx !== mn) { const d = mx - mn; sat = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
      const deg = Math.round(h * 360), woody = deg >= 15 && deg <= 75;
      return `hsl(${deg} ${Math.round(Math.max(sat, .55) * 100)}% ${Math.min(l, woody ? .17 : .3) * 100}%)`; }
    const ignored = n => cfg.ignore.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).includes(String(n).toLowerCase());
    const cmdOf = w => CMDS.find(c => cfg.commands[c] && cfg.commands[c].on && cfg.commands[c].trigger.toLowerCase() === w);
    // returns { c, only } — only = the message starts with the command (the usual Twitch way)
    const commandFor = text => { const ws = String(text).trim().toLowerCase().split(/\s+/), c0 = cmdOf(ws[0]);
      if (c0) return { c: c0, only: true };
      if (cfg.cmdAnywhere) for (const w of ws.slice(1)) { const c = cmdOf(w.replace(/[.,;:?!)\]]+$/, '')); if (c) return { c, only: false }; }
      return null; };
    // m = { name, color, text, parts:[{type:'text',text}|{type:'emote',url,name}], badges:[url], msgId, userId, first }
    function message(m) {
      if (typeof m === 'string') m = { name: arguments[0], color: arguments[1], text: arguments[2], first: arguments[3] };
      if (!m || !m.name || ignored(m.name)) return null;
      const c = commandFor(m.text || '');
      if (c) { command(c.c, m.name); if (c.only && !cfg.showCommands) return null; }   // a sentence that contains a command still shows as a plank
      lastMsgAt = T;
      const first = m.first === true || (m.first === undefined && false);
      const body = m.parts ? m.parts.map(p => p.type === 'emote' ? `<img class="emote" src="${esc(p.url)}" alt="${esc(p.name)}">` : esc(p.text)).join('') : esc(m.text);
      const badges = (m.badges || []).map(u => `<img class="badge" src="${esc(u)}" alt="">`).join('');
      const p = addPlank('msg', `${badges}<b style="color:${inkFor(m.color)}">${esc(m.name)}:</b> ${body}`, { first, msgId: m.msgId, userId: m.userId });
      if (asleep()) react('wake'); else lastActivity = T;
      const words = cfg.mentionWords.split(',').map(s => s.trim()).filter(Boolean);
      if (!c && words.length && new RegExp(`\\b(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i').test(m.text || '')) react('mention');
      seen.add(String(m.name).toLowerCase());
      return p;
    }
    // e = { type:'sub'|'follow'|'raid'|'bits'|'tip', name, amount, months, gifted, tier, currency }
    function event(e) {
      if (typeof e === 'string') e = { type: arguments[0], name: arguments[1], amount: arguments[2] };
      if (!EVENTS.includes(e.type) || !cfg.events[e.type]) return;
      lastMsgAt = T;
      const n = esc(e.name || '');
      const title = { sub: e.gifted ? '\u2665 GIFTED SUB \u2665' : (e.months > 1 ? `\u2605 ${e.months} MONTHS! \u2605` : '\u2605 NEW SUB! \u2605'), follow: '\u2665 NEW FOLLOWER \u2665', raid: `\u2691 RAID${e.amount ? ' \u00d7' + e.amount : ''}! \u2691`, bits: `\u25c6 ${e.amount || 0} BITS \u25c6`, tip: `\u2726 TIP ${esc(e.currency || '')}${e.amount || ''} \u2726` }[e.type];
      addPlank(e.type, `<span class="t">${title}</span>${n}`);
      react(e.type, e.name);
    }
    function deleteMessage(id) { const p = P.find(q => q.msgId === id); if (p) puff(p); }
    function deleteUser(id) { P.filter(q => q.userId === id).forEach(puff); }
    function clear() { [...P].forEach(puff); }

    // ---------- clock ----------
    function tick(t) { if (dead) return; T = t; renderPlanks(t); renderFox(t); renderFx(t); }
    if (!manual) { const t0 = performance.now(); (function loop() { if (dead) return; tick((performance.now() - t0) / 1000); requestAnimationFrame(loop); })(); }

    return {
      message, event, command: (c, u) => command(c, u || ''), deleteMessage, deleteUser, clear, tick,
      setConfig(c) { cfg = merge(cfg, c); style.textContent = style.textContent.replace(/font:400 \d+px\/1\.12/, `font:400 ${cfg.fontSize}px/1.12`); },
      state: () => ({ version: VERSION, planks: P.length, fox: cur ? cur.name : F.disp, asleep: asleep(), t: T }),
      el, destroy() { dead = true; el.remove(); style.remove(); },
    };
  }
  function merge(a, b) { const o = Array.isArray(a) ? [...a] : { ...a }; for (const k in b) o[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a && typeof a[k] === 'object' ? merge(a[k], b[k]) : b[k]; return o; }
  window.ExeChat = { create, DEFAULTS, HELP, VERSION, COMMANDS: CMDS, W, H };
})();
