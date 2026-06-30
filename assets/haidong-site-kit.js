(() => {
  const config = {
    email: "hello@haidong.chat",
    traceKey: "haidong.ai.trace.v1",
    sessionKey: "haidong.ai.session.v1",
    maxTrace: 80,
  };

  const now = () => new Date().toISOString();
  const pageTitle = () => document.title || "Untitled";
  const pagePath = () => `${location.pathname}${location.search}${location.hash}`;

  const safeText = (value, max = 80) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch (error) {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  };

  const getSessionId = () => {
    let sessionId = localStorage.getItem(config.sessionKey);
    if (!sessionId) {
      sessionId = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(config.sessionKey, sessionId);
    }
    return sessionId;
  };

  const trace = (type, detail = {}) => {
    const events = readJson(config.traceKey, []);
    events.push({
      time: now(),
      type,
      page: pagePath(),
      title: pageTitle(),
      session: getSessionId(),
      detail,
    });
    writeJson(config.traceKey, events.slice(-config.maxTrace));
  };

  const getRecentTrace = () => readJson(config.traceKey, []).slice(-20);

  const injectStyle = () => {
    if (document.getElementById("haidong-site-kit-style")) return;
    const style = document.createElement("style");
    style.id = "haidong-site-kit-style";
    style.textContent = `
      .hd-ai-watermark {
        position: fixed;
        inset: -90px;
        z-index: 2147482000;
        pointer-events: none;
        opacity: 0.12;
        background-image: repeating-linear-gradient(
          -28deg,
          transparent 0 112px,
          color-mix(in srgb, currentColor 8%, transparent) 112px 113px,
          transparent 113px 224px
        );
        color: rgba(20, 24, 30, 0.34);
      }

      .hd-ai-watermark::before {
        content: "海东 AI";
        position: absolute;
        inset: 0;
        color: currentColor;
        font: 700 28px/180px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
        letter-spacing: 0.18em;
        opacity: 0.28;
        transform: rotate(-24deg);
        background-image: repeating-linear-gradient(
          90deg,
          transparent 0 70px,
          currentColor 70px 176px,
          transparent 176px 300px
        );
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .hd-ai-feedback {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483000;
        color: #151719;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      }

      .hd-ai-feedback * {
        box-sizing: border-box;
      }

      .hd-ai-feedback-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 54px;
        min-height: 38px;
        border: 1px solid rgba(20, 24, 30, 0.14);
        border-radius: 999px;
        padding: 0 14px;
        background: rgba(255, 255, 255, 0.82);
        color: #151719;
        box-shadow: 0 18px 52px rgba(0, 0, 0, 0.14);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .hd-ai-feedback-panel {
        position: absolute;
        right: 0;
        bottom: 48px;
        display: none;
        width: min(320px, calc(100vw - 28px));
        border: 1px solid rgba(20, 24, 30, 0.13);
        border-radius: 18px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .hd-ai-feedback[data-open="true"] .hd-ai-feedback-panel {
        display: grid;
        gap: 10px;
      }

      .hd-ai-feedback-title {
        margin: 0;
        color: #151719;
        font-size: 14px;
        font-weight: 800;
      }

      .hd-ai-feedback-note,
      .hd-ai-feedback-status {
        margin: 0;
        color: rgba(21, 23, 25, 0.62);
        font-size: 12px;
        line-height: 1.55;
      }

      .hd-ai-feedback input,
      .hd-ai-feedback textarea {
        width: 100%;
        border: 1px solid rgba(20, 24, 30, 0.14);
        border-radius: 12px;
        padding: 9px 10px;
        background: rgba(250, 250, 250, 0.92);
        color: #151719;
        font: inherit;
        font-size: 13px;
        outline: none;
      }

      .hd-ai-feedback textarea {
        min-height: 88px;
        resize: vertical;
      }

      .hd-ai-feedback input:focus,
      .hd-ai-feedback textarea:focus {
        border-color: rgba(30, 105, 220, 0.48);
      }

      .hd-ai-feedback-submit {
        display: inline-flex;
        justify-content: center;
        min-height: 34px;
        border: 0;
        border-radius: 999px;
        padding: 0 14px;
        background: #151719;
        color: #fff;
        font: inherit;
        font-size: 13px;
        font-weight: 760;
        cursor: pointer;
      }

      .hd-ai-feedback-submit:disabled {
        cursor: wait;
        opacity: 0.58;
      }

      @media (prefers-color-scheme: dark) {
        .hd-ai-watermark {
          color: rgba(255, 255, 255, 0.34);
        }
      }

      @media (max-width: 640px) {
        .hd-ai-feedback {
          right: 12px;
          bottom: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const addWatermark = () => {
    if (document.querySelector(".hd-ai-watermark")) return;
    const watermark = document.createElement("div");
    watermark.className = "hd-ai-watermark";
    watermark.setAttribute("aria-hidden", "true");
    document.body.appendChild(watermark);
  };

  const addFeedback = () => {
    if (document.querySelector(".hd-ai-feedback")) return;
    const widget = document.createElement("section");
    widget.className = "hd-ai-feedback";
    widget.setAttribute("aria-label", "留言反馈");
    widget.innerHTML = `
      <button class="hd-ai-feedback-toggle" type="button" aria-expanded="false">反馈</button>
      <form class="hd-ai-feedback-panel">
        <p class="hd-ai-feedback-title">留言反馈</p>
        <p class="hd-ai-feedback-note">反馈会发送到海东邮箱；当前页面和最近使用痕迹会一起附上，便于排查。</p>
        <input name="name" type="text" autocomplete="name" placeholder="称呼，可不填" />
        <textarea name="message" required placeholder="写下问题、建议或使用反馈"></textarea>
        <input name="_subject" type="hidden" value="haidong.chat 子站反馈" />
        <input name="page" type="hidden" />
        <input name="trace" type="hidden" />
        <button class="hd-ai-feedback-submit" type="submit">发送</button>
        <p class="hd-ai-feedback-status" aria-live="polite"></p>
      </form>
    `;
    document.body.appendChild(widget);

    const toggle = widget.querySelector(".hd-ai-feedback-toggle");
    const form = widget.querySelector("form");
    const status = widget.querySelector(".hd-ai-feedback-status");
    const submit = widget.querySelector(".hd-ai-feedback-submit");

    toggle.addEventListener("click", () => {
      const open = widget.dataset.open !== "true";
      widget.dataset.open = String(open);
      toggle.setAttribute("aria-expanded", String(open));
      trace(open ? "feedback_open" : "feedback_close");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const messageField = form.querySelector("[name='message']");
      const message = messageField.value.trim();
      if (!message) {
        status.textContent = "请先填写反馈内容。";
        return;
      }

      form.page.value = `${pageTitle()} | ${location.href}`;
      form.trace.value = JSON.stringify(getRecentTrace(), null, 2);
      submit.disabled = true;
      status.textContent = "正在发送...";
      trace("feedback_submit", { length: message.length });

      try {
        const response = await fetch(`https://formsubmit.co/ajax/${config.email}`, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("submit failed");
        form.reset();
        status.textContent = "已发送。";
      } catch (error) {
        status.textContent = "发送未确认成功，请稍后再试。";
      } finally {
        submit.disabled = false;
      }
    });
  };

  const setupTrace = () => {
    trace("page_view", {
      referrer: document.referrer || "",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    const seenDepths = new Set();
    const recordScroll = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const depth = Math.min(100, Math.round((window.scrollY / max) * 100));
      [25, 50, 75, 100].forEach((mark) => {
        if (depth >= mark && !seenDepths.has(mark)) {
          seenDepths.add(mark);
          trace("read_depth", { depth: mark });
        }
      });
    };

    window.addEventListener("scroll", recordScroll, { passive: true });
    recordScroll();

    document.addEventListener(
      "click",
      (event) => {
        const target = event.target.closest("a, button, input[type='file'], [role='button']");
        if (!target) return;
        trace("click", {
          tag: target.tagName.toLowerCase(),
          text: safeText(target.innerText || target.value || target.getAttribute("aria-label")),
          href: target.getAttribute("href") || "",
          id: target.id || "",
          className: safeText(target.className, 60),
        });
      },
      true,
    );

    document.addEventListener(
      "submit",
      (event) => {
        const form = event.target;
        trace("form_submit", {
          id: form.id || "",
          className: safeText(form.className, 60),
        });
      },
      true,
    );
  };

  const init = () => {
    injectStyle();
    addWatermark();
    setupTrace();
    addFeedback();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
