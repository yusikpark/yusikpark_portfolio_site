/* 共通パーツ（左テキスト＋右上メニュー）の描画と、言語・ライト/ダーク切替 */
(() => {
  const root = document.documentElement;
  const mount = document.getElementById("site-chrome");
  const page = document.body.dataset.page || "top";
  const { I18N, SITE } = window;

  const LANGS = [["en", "ENG"], ["ja", "JPN"], ["ko", "KOR"]];
  const THEMES = [["light", "LIGHT"], ["dark", "DARK"]];
    const NAV = [
    ["top", "TOP", "/"],
    ["works", "WORKS", "/works"],
    ["experiment", "EXPERIMENT", "/experiment"],
    ["contact", "CONTACT", "/contact"]
  ];

  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // 初回はブラウザの言語に合わせる（日本語→JPN、韓国語→KOR、それ以外→ENG）
  function initialLang() {
    const saved = store.get("lang");
    if (saved && I18N[saved]) return saved;
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("ja")) return "ja";
    if (nav.startsWith("ko")) return "ko";
    return "en";
  }

  let lang = initialLang();
  let theme = root.dataset.theme || "light";
  let infoOpen = false;   // スマホ：左テキスト（INFO）を開いているか

  const toggleGroup = (items, current, attr, label) =>
    `<div class="toggle" role="group" aria-label="${label}">` +
    items.map(([v, text]) =>
      `<button type="button" data-${attr}="${v}" aria-pressed="${v === current}">${text}</button>`
    ).join('<span aria-hidden="true"> / </span>') +
    `</div>`;

  // TOPの大きな名前：言語に合わせて書き換え、1文字ずつ <span> に分割
  // 日本語・韓国語は、英語「yusikpark」と同じ横幅になるよう横に伸ばす（平体）
  function renderHero() {
    const el = document.querySelector(".hero-name");
    if (!el) return;
    const text = I18N[lang].hero || SITE.name;
    el.setAttribute("aria-label", text);
    el.innerHTML =
      `<span class="hero-inner">` +
      [...text].map((c) => `<span class="char" aria-hidden="true">${c}</span>`).join("") +
      `</span>`;

    if (text === SITE.name) return;   // 英語はそのまま

    // 英語表記の横幅を測る
    const probe = document.createElement("span");
    probe.className = "hero-probe";
    probe.textContent = SITE.name;
    el.appendChild(probe);
    const target = probe.getBoundingClientRect().width;
    probe.remove();

    // 今の横幅との比率だけ横に伸ばす
    const inner = el.querySelector(".hero-inner");
    const current = inner.getBoundingClientRect().width;
    if (current > 0) inner.style.transform = `scaleX(${target / current})`;
  }

  // CONTACT：大きなメールアドレス（クリックでコピー）＋東京の現在時刻
  function renderContact() {
    const el = document.getElementById("contact");
    if (!el) return;
    const c = I18N[lang].contactPage;
    const chars = [...SITE.email]
      .map((ch) => `<span class="char" aria-hidden="true">${ch}</span>`).join("");
    el.innerHTML = `
      <div class="contact-meta">
        <p>${c.time} <span class="contact-clock"></span></p>
        <p><a href="mailto:${SITE.email}">${c.mail}</a> / <a href="https://www.instagram.com/${SITE.instagram}/" target="_blank" rel="noopener">Instagram</a></p>
      </div>
      <button type="button" class="contact-email" aria-label="${c.hint}: ${SITE.email}">${chars}</button>
      <p class="contact-hint" aria-live="polite">${c.hint}</p>`;
    tickClock();
  }

  // 東京の時刻を1秒ごとに更新
  function tickClock() {
    const clock = document.querySelector(".contact-clock");
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(new Date()) + " JST";
  }
  setInterval(tickClock, 1000);

  // メールアドレスをクリック → コピーして「コピーしました」を2秒表示
  document.addEventListener("click", async (e) => {
    if (!e.target.closest(".contact-email")) return;
    const hint = document.querySelector(".contact-hint");
    const c = I18N[lang].contactPage;
    try {
      await navigator.clipboard.writeText(SITE.email);
      hint.textContent = c.copied;
      setTimeout(() => { hint.textContent = c.hint; }, 2000);
    } catch (err) {
      location.href = `mailto:${SITE.email}`;   // コピーできない環境ではメールアプリを開く
    }
  });

  // 作品：詳細ページ左下の固定キャプションと、WORKS一覧のキャプション（3言語）
  function renderWorks() {
    const W = window.WORKS || {};
    const L = I18N[lang].workLabels;

    const info = document.getElementById("work-info");
    const id = document.body.dataset.work;
    if (info && W[id]) {
      const w = W[id];
      const d = w[lang];
      info.innerHTML = `
        <p class="block">${d.title}</p>
        <p class="block">${L.client}: ${d.client}<br>${L.role}: ${d.role}<br>${L.year}: ${w.year}</p>
        <p class="block">${d.text}</p>`;
    }

    document.querySelectorAll(".work-caption[data-work]").forEach((el) => {
      const w = W[el.dataset.work];
      if (!w) return;
      el.innerHTML = `<span>${w[lang].title}</span><span>${w[lang].category}</span>`;
    });
  }

  function render() {
    const t = I18N[lang];
    root.lang = lang;
    // 著作権表示の年（翌年以降は自動で「2026–2027」のようになる）
    const year = new Date().getFullYear();
    const years = year > 2026 ? `2026–${year}` : "2026";

    mount.innerHTML = `
      <header class="site-header">
        <nav class="site-nav" aria-label="Main">
          ${NAV.map(([id, label, href]) =>
            `<a href="${href}"${id === page ? ' aria-current="page"' : ""}>${label}</a>`
          ).join("")}
        </nav>
        <div class="toggles">
          ${toggleGroup(LANGS, lang, "lang", "Language")}
          <button type="button" class="info-toggle" aria-expanded="${infoOpen}" aria-controls="site-info">${infoOpen ? "CLOSE" : "INFO"}</button>
          ${toggleGroup(THEMES, theme, "theme", "Color mode")}
        </div>
      </header>

      <aside class="site-info" id="site-info">
        <p class="block"><a href="/">${SITE.name}</a></p>
        ${t.statement.map((p) => `<p class="block statement">${p}</p>`).join("")}
        ${t.info.map(([dt, dd]) => `<dl class="block"><dt>${dt}</dt><dd>${dd}</dd></dl>`).join("")}
        <dl class="block">
          <dt>${t.contact}</dt>
          <dd>${t.email}: <a href="mailto:${SITE.email}">${SITE.email}</a></dd>
          <dd>${t.instagram}: <a href="https://www.instagram.com/${SITE.instagram}/" target="_blank" rel="noopener">${SITE.instagram}</a></dd>
        </dl>
        <p class="block">© ${years} ${SITE.name}<br>All rights reserved</p>
      </aside>`;
    renderHero();
    renderContact();
    renderWorks();
  }

  // メニュー周りのボタン（INFO・言語・ライト/ダーク）
  mount.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    // スマホ：INFOボタンで左テキストを開閉
    if (btn.classList.contains("info-toggle")) {
      setInfo(!infoOpen);
      mount.querySelector(".info-toggle")?.focus();
      return;
    }
    if (btn.dataset.lang) {
      lang = btn.dataset.lang;
      store.set("lang", lang);
    } else if (btn.dataset.theme) {
      theme = btn.dataset.theme;
      root.dataset.theme = theme;
      store.set("theme", theme);
    }
    render();
    // 押したボタンにフォーカスを戻す（キーボード操作用）
    const sel = btn.dataset.lang ? `[data-lang="${lang}"]` : `[data-theme="${theme}"]`;
    mount.querySelector(sel)?.focus();
  });

  // INFOの開閉（Escキーでも閉じる）
  function setInfo(open) {
    infoOpen = open;
    root.classList.toggle("info-open", open);
    render();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && infoOpen) setInfo(false);
  });

  render();
  // フォントの読み込みが終わったら測り直す
  document.fonts?.ready.then(renderHero);

  // 十字線
  //  PC（マウス）：カーソルに追従
  //  スマホ（タッチ）：触れた位置に出て指に追従し、離すと0.6秒後に消える
  const lineX = document.createElement("div");
  const lineY = document.createElement("div");
  lineX.className = "cursor-line cursor-x";
  lineY.className = "cursor-line cursor-y";
  document.body.append(lineX, lineY);

  const moveLines = (x, y) => {
    lineX.style.transform = `translateY(${y}px)`;
    lineY.style.transform = `translateX(${x}px)`;
  };

  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      moveLines(e.clientX, e.clientY);
      root.classList.add("has-cursor");
    }, { passive: true });
    root.addEventListener("pointerleave", () => root.classList.remove("has-cursor"));
  } else {
    let hideTimer;
    const onTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      clearTimeout(hideTimer);
      moveLines(t.clientX, t.clientY);
      root.classList.add("has-cursor");
    };
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => root.classList.remove("has-cursor"), 600);   // ← 消えるまでの時間（ミリ秒）
    }, { passive: true });
  }

    // ライト/ダークの反映（スマホで背景が描き直されない現象の対策込み）
  function applyTheme(t) {
    root.dataset.theme = t;
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    root.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = bg;   // アドレスバー周りの色も合わせる

    // iPhoneのSafari対策：ページの高さを一瞬だけ変えて、画面全体を描き直させる
    root.style.minHeight = "calc(100% + 1px)";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.style.minHeight = "";
    }));
  }
})();