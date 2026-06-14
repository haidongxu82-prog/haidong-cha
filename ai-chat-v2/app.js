const fallbackModels = {
  chat: [
    ["GPT-5.4 Pro", "🔥 GPT-5.4 Pro"],
    ["GPT-5.4", "🟢 GPT-5.4"],
    ["GPT-5.4 Mini", "🟢 GPT-5.4 Mini"],
    ["Claude Opus 4.7", "🟠 Claude Opus 4.7"],
    ["Claude Sonnet 4.6", "🟠 Claude Sonnet 4.6"],
    ["Claude Haiku 4.5", "🟡 Claude Haiku 4.5"],
    ["Gemini 3.5 Flash", "🔵 Gemini 3.5 Flash"],
    ["Gemini 3.1 Pro", "🔵 Gemini 3.1 Pro"],
    ["Gemini 2.5 Pro", "🔵 Gemini 2.5 Pro"],
    ["Gemini 2.5 Flash", "🔵 Gemini 2.5 Flash"],
    ["Grok 4", "🤖 Grok 4"],
    ["GPT-4o", "🟢 GPT-4o"],
    ["o4-mini", "🧠 o4-mini"],
    ["o3-mini", "🧠 o3-mini"],
    ["DeepSeek V3", "🌊 DeepSeek V3"],
    ["Qwen3 235B", "🟣 Qwen3 235B"],
  ],
  image: [
    ["GPT-Image-2", "🖼️ GPT-Image-2"],
    ["GPT-Image-1", "🎨 GPT-Image-1"],
    ["Gemini 3.1 Image", "📸 Gemini 3.1 Image"],
    ["Gemini 2.5 Image", "✨ Gemini 2.5 Image"],
  ],
};

const modelData = window.__MODEL_DATA__ || {
  chat: fallbackModels.chat.map(([id, name]) => ({ id, name })),
  image: fallbackModels.image.map(([id, name]) => ({ id, name })),
};

let currentGroup = "chat";
let currentModel = modelData.chat?.[0]?.id || "GPT-5.4 Pro";
let messages = [];
let conversationId = makeId();
let abortController = null;
let tokenTotals = { prompt: 0, completion: 0, total: 0, estimated: false };
const TOKEN_LOG_KEY = "haidong_ai_token_log";
const GUEST_MODE_KEY = "haidong_ai_guest_mode";
let tokenLog = readTokenLog();
let guestMode = localStorage.getItem(GUEST_MODE_KEY) === "1";

const root = document.documentElement;
const historyButton = document.querySelector(".rail-btn.history");
const tokenButton = document.querySelector(".rail-btn.token");
const guestButton = document.querySelector(".rail-btn.guest");
const themeButton = document.querySelector(".rail-btn.theme");
const drawerClose = document.querySelector(".drawer-close");
const tokenClose = document.querySelector(".token-close");
const guestClose = document.querySelector(".guest-close");
const historyDrawer = document.querySelector(".history-drawer");
const historyList = document.querySelector(".history-drawer");
const tokenDrawer = document.querySelector(".token-drawer");
const guestDrawer = document.querySelector(".guest-drawer");
const newChatButton = document.querySelector(".new-chat");
const conversation = document.querySelector(".conversation");
const composer = document.querySelector(".composer");
const composerTextarea = document.querySelector(".composer textarea");
const sendButton = document.querySelector(".composer button");
const modelsWrap = document.querySelector(".models");
const tokenMeter = document.querySelector(".token-meter");
const guestTitle = document.querySelector("[data-guest-title]");
const guestCopy = document.querySelector("[data-guest-copy]");
const guestToggle = document.querySelector(".guest-toggle");

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderText(value) {
  const text = String(value || "");
  const imageMatch = text.match(/!\[[^\]]*\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/);
  const image = imageMatch ? `<img class="generated-image" src="${imageMatch[1]}" alt="生成图片">` : "";
  const cleanText = imageMatch ? text.replace(imageMatch[0], "").trim() : text;
  return `${image}${escapeHtml(cleanText).replace(/\n/g, "<br>")}`;
}

function estimateTokens(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWords = (text.match(/[A-Za-z0-9_]+/g) || []).length;
  const otherChars = Math.max(0, [...text].length - chineseChars);
  return Math.max(1, Math.ceil(chineseChars * 0.72 + latinWords * 1.25 + otherChars * 0.22));
}

function normalizeUsage(payload) {
  const usage = payload?.usage || payload?.data?.usage || payload?.response?.usage;
  if (!usage || typeof usage !== "object") return null;
  const prompt = Number(usage.prompt_tokens ?? usage.input_tokens ?? usage.prompt ?? 0);
  const completion = Number(usage.completion_tokens ?? usage.output_tokens ?? usage.completion ?? 0);
  const total = Number(usage.total_tokens ?? usage.total ?? prompt + completion);
  if (!prompt && !completion && !total) return null;
  return {
    prompt: Math.max(0, prompt || Math.max(0, total - completion)),
    completion: Math.max(0, completion),
    total: Math.max(0, total || prompt + completion),
    estimated: false,
  };
}

function readTokenLog() {
  try {
    const value = JSON.parse(localStorage.getItem(TOKEN_LOG_KEY) || "[]");
    return Array.isArray(value) ? value.slice(0, 80) : [];
  } catch {
    return [];
  }
}

function writeTokenLog() {
  localStorage.setItem(TOKEN_LOG_KEY, JSON.stringify(tokenLog.slice(0, 80)));
}

function estimateUsage(input, output) {
  const prompt = estimateTokens(input);
  const completion = estimateTokens(output);
  return { prompt, completion, total: prompt + completion, estimated: true };
}

function formatUsage(usage) {
  const prefix = usage.estimated ? "约 " : "";
  return `${prefix}${usage.total.toLocaleString()} tokens · 输入 ${usage.prompt.toLocaleString()} / 输出 ${usage.completion.toLocaleString()}`;
}

function addUsage(usage) {
  tokenTotals.prompt += usage.prompt;
  tokenTotals.completion += usage.completion;
  tokenTotals.total += usage.total;
  tokenTotals.estimated = tokenTotals.estimated || usage.estimated;
  tokenLog.unshift({
    at: new Date().toISOString(),
    model: currentModel,
    group: currentGroup,
    prompt: usage.prompt,
    completion: usage.completion,
    total: usage.total,
    estimated: usage.estimated,
  });
  writeTokenLog();
  updateTokenMeter();
  renderTokenDrawer();
}

function updateTokenMeter() {
  if (!tokenMeter) return;
  const total = tokenMeter.querySelector("strong");
  const note = tokenMeter.querySelector("em");
  if (total) total.textContent = `${tokenTotals.total.toLocaleString()} tokens`;
  if (note) {
    if (!tokenTotals.total) {
      note.textContent = "等待对话";
      return;
    }
    const prefix = tokenTotals.estimated ? "含估算" : "真实用量";
    note.textContent = `${prefix} · 输入 ${tokenTotals.prompt.toLocaleString()} / 输出 ${tokenTotals.completion.toLocaleString()}`;
  }
}

function renderTokenDrawer() {
  const current = document.querySelector("[data-token-current]");
  const history = document.querySelector("[data-token-history]");
  const input = document.querySelector("[data-token-input]");
  const output = document.querySelector("[data-token-output]");
  const mode = document.querySelector("[data-token-mode]");
  const log = document.querySelector("[data-token-log]");
  const historyTotal = tokenLog.reduce((sum, item) => sum + Number(item.total || 0), 0);
  if (current) current.textContent = tokenTotals.total.toLocaleString();
  if (history) history.textContent = historyTotal.toLocaleString();
  if (input) input.textContent = `输入 ${tokenTotals.prompt.toLocaleString()}`;
  if (output) output.textContent = `输出 ${tokenTotals.completion.toLocaleString()}`;
  if (mode) mode.textContent = tokenTotals.estimated ? "当前含估算" : tokenTotals.total ? "当前真实用量" : "等待对话";
  if (!log) return;
  if (!tokenLog.length) {
    log.innerHTML = "<p>暂无消耗记录</p>";
    return;
  }
  log.innerHTML = tokenLog
    .slice(0, 30)
    .map((item) => {
      const time = new Date(item.at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      const flag = item.estimated ? "估算" : "真实";
      return `<div class="token-log-item"><strong>${escapeHtml(item.model || "AI")}</strong><span>${Number(item.total || 0).toLocaleString()} tokens · 输入 ${Number(item.prompt || 0).toLocaleString()} / 输出 ${Number(item.completion || 0).toLocaleString()}</span><small>${time} · ${flag}</small></div>`;
    })
    .join("");
}

function updateGuestMode() {
  document.body.classList.toggle("guest-mode", guestMode);
  guestButton?.classList.toggle("is-active", guestMode);
  guestButton?.setAttribute("aria-pressed", guestMode ? "true" : "false");
  if (guestTitle) guestTitle.textContent = guestMode ? "已开启" : "已关闭";
  if (guestCopy) {
    guestCopy.textContent = guestMode
      ? "当前会以游客身份发送请求。如果后端已开放游客权限，就可以直接使用。"
      : "开启后，前端会以游客身份发送请求；如果后端允许游客访问，就可以直接对话。";
  }
  if (guestToggle) guestToggle.textContent = guestMode ? "关闭游客模式" : "开启游客模式";
}

function attachUsage(message, usage) {
  if (!message || !usage) return;
  let meta = message.querySelector(".token-usage");
  if (!meta) {
    meta = document.createElement("div");
    meta.className = "token-usage";
    message.appendChild(meta);
  }
  meta.textContent = formatUsage(usage);
  meta.scrollIntoView({ block: "end", behavior: "smooth" });
}

function setBusy(busy) {
  sendButton.disabled = busy;
  sendButton.textContent = busy ? "■" : "➤";
}

function renderModels() {
  const list = modelData[currentGroup] || [];
  if (!list.length) return;
  if (!list.some((model) => model.id === currentModel)) currentModel = list[0].id;
  modelsWrap.innerHTML = list
    .map((model) => {
      const active = model.id === currentModel ? " active" : "";
      return `<button class="model${active}" data-model="${escapeHtml(model.id)}" data-group="${currentGroup}" type="button">${escapeHtml(model.name)}</button>`;
    })
    .join("");
}

function switchModelGroup(group) {
  currentGroup = group;
  document.querySelectorAll(".mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.group === group);
  });
  renderModels();
}

function selectModel(id) {
  currentModel = id;
  document.querySelectorAll(".model").forEach((button) => {
    button.classList.toggle("active", button.dataset.model === id);
  });
}

function appendMessage(role, content, modelName = "") {
  conversation.classList.add("has-messages");
  const message = document.createElement("article");
  message.className = `message ${role}`;
  message.innerHTML = `${modelName ? `<div class="model-tag">${escapeHtml(modelName)}</div>` : ""}<div class="bubble">${renderText(content)}</div>`;
  conversation.appendChild(message);
  message.scrollIntoView({ block: "end", behavior: "smooth" });
  return message;
}

async function saveConversation() {
  if (!messages.length) return;
  const firstUser = messages.find((item) => item.role === "user")?.content || "新对话";
  await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: conversationId,
      title: firstUser.slice(0, 60),
      model: currentModel,
      messages,
    }),
  }).catch(() => {});
}

async function saveMessage(role, content) {
  await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, content }),
  }).catch(() => {});
}

async function sendMessage() {
  if (abortController) {
    abortController.abort();
    abortController = null;
    setBusy(false);
    return;
  }

  const text = composerTextarea.value.trim();
  if (!text) return;

  composerTextarea.value = "";
  composerTextarea.style.height = "auto";
  appendMessage("user", text);
  messages.push({ role: "user", content: text });
  await saveConversation();
  await saveMessage("user", text);

  const aiMessage = appendMessage("ai", "", currentModel);
  const bubble = aiMessage.querySelector(".bubble");
  let reply = "";
  let responseUsage = null;
  abortController = new AbortController();
  setBusy(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Guest-Mode": guestMode ? "1" : "0" },
      body: JSON.stringify({ model: currentModel, messages, guest: guestMode }),
      signal: abortController.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      responseUsage = normalizeUsage(data) || responseUsage;
      reply =
        data.content ||
        data.message ||
        data.reply ||
        data.response ||
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.text ||
        "";
      if (!reply) throw new Error("接口没有返回可显示内容");
      bubble.innerHTML = renderText(reply);
      aiMessage.scrollIntoView({ block: "end", behavior: "smooth" });
    } else {
      if (!response.ok || !response.body) throw new Error(`接口返回 ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk.split("\n").find((item) => item.startsWith("data: "));
          if (!line) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error);
          responseUsage = normalizeUsage(parsed) || responseUsage;
          const delta = parsed.choices?.[0]?.delta?.content || "";
          if (!delta) continue;
          reply += delta;
          bubble.innerHTML = renderText(reply);
          aiMessage.scrollIntoView({ block: "end", behavior: "smooth" });
        }
      }
    }

    const finalUsage = responseUsage || estimateUsage(text, reply);
    addUsage(finalUsage);
    attachUsage(aiMessage, finalUsage);
    messages.push({ role: "assistant", content: reply });
    await saveMessage("assistant", reply);
  } catch (error) {
    if (error.name !== "AbortError") {
      const message = String(error.message || "发送失败");
      const authHint = /401|403|未授权|unauthorized|forbidden/i.test(message)
        ? "后端未开放当前访问权限。可以尝试开启游客模式；如果仍失败，需要服务器接口允许游客请求。"
        : message;
      bubble.innerHTML = `<span class="error-text">${escapeHtml(authHint)}</span>`;
    }
  } finally {
    abortController = null;
    setBusy(false);
  }
}

function resetChat() {
  messages = [];
  conversationId = makeId();
  tokenTotals = { prompt: 0, completion: 0, total: 0, estimated: false };
  updateTokenMeter();
  renderTokenDrawer();
  conversation.innerHTML = "";
  conversation.classList.remove("has-messages");
  composerTextarea.value = "";
  composerTextarea.focus();
  closeHistory();
}

function openHistory() {
  closeTokenDrawer();
  closeGuestDrawer();
  document.body.classList.add("history-open");
  historyButton.setAttribute("aria-expanded", "true");
  loadHistory();
}

function closeHistory() {
  document.body.classList.remove("history-open");
  historyButton.setAttribute("aria-expanded", "false");
}

function openTokenDrawer() {
  closeHistory();
  closeGuestDrawer();
  renderTokenDrawer();
  document.body.classList.add("token-open");
  tokenButton?.setAttribute("aria-expanded", "true");
}

function closeTokenDrawer() {
  document.body.classList.remove("token-open");
  tokenButton?.setAttribute("aria-expanded", "false");
}

function openGuestDrawer() {
  closeHistory();
  closeTokenDrawer();
  updateGuestMode();
  document.body.classList.add("guest-open");
}

function closeGuestDrawer() {
  document.body.classList.remove("guest-open");
}

async function loadHistory() {
  const holder = historyDrawer.querySelectorAll(".history-item, .history-empty");
  holder.forEach((item) => item.remove());

  try {
    const response = await fetch("/api/conversations");
    const list = await response.json();
    if (!Array.isArray(list) || !list.length) {
      historyDrawer.insertAdjacentHTML("beforeend", '<div class="history-empty">暂无历史对话</div>');
      return;
    }

    list.slice(0, 30).forEach((item) => {
      const button = document.createElement("button");
      button.className = "history-item";
      button.type = "button";
      button.innerHTML = `<span>${escapeHtml(item.title || "新对话")}</span><small>${escapeHtml((item.updated_at || "").slice(0, 10))}</small>`;
      button.addEventListener("click", () => loadConversation(item.id, button));
      historyDrawer.appendChild(button);
    });
  } catch {
    historyDrawer.insertAdjacentHTML("beforeend", '<div class="history-empty">历史记录暂时不可用</div>');
  }
}

async function loadConversation(id, button) {
  const response = await fetch(`/api/conversations/${id}/messages`);
  const list = await response.json();
  if (!Array.isArray(list)) return;
  conversationId = id;
  messages = list.map((item) => ({ role: item.role, content: item.content }));
  conversation.innerHTML = "";
  conversation.classList.toggle("has-messages", messages.length > 0);
  messages.forEach((item) => appendMessage(item.role === "assistant" ? "ai" : "user", item.content, item.role === "assistant" ? currentModel : ""));
  document.querySelectorAll(".history-item").forEach((entry) => entry.classList.remove("active"));
  button?.classList.add("active");
  closeHistory();
}

document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", () => switchModelGroup(button.dataset.group));
});

modelsWrap.addEventListener("click", (event) => {
  const button = event.target.closest(".model");
  if (!button) return;
  selectModel(button.dataset.model);
});

historyButton.addEventListener("click", () => {
  document.body.classList.contains("history-open") ? closeHistory() : openHistory();
});

tokenButton?.addEventListener("click", () => {
  document.body.classList.contains("token-open") ? closeTokenDrawer() : openTokenDrawer();
});

guestButton?.addEventListener("click", () => {
  document.body.classList.contains("guest-open") ? closeGuestDrawer() : openGuestDrawer();
});

drawerClose.addEventListener("click", closeHistory);
tokenClose?.addEventListener("click", closeTokenDrawer);
guestClose?.addEventListener("click", closeGuestDrawer);
guestToggle?.addEventListener("click", () => {
  guestMode = !guestMode;
  localStorage.setItem(GUEST_MODE_KEY, guestMode ? "1" : "0");
  updateGuestMode();
});

document.addEventListener("pointerdown", (event) => {
  if (document.body.classList.contains("history-open")) {
    if (!historyDrawer.contains(event.target) && !historyButton.contains(event.target)) closeHistory();
  }
  if (document.body.classList.contains("token-open")) {
    if (!tokenDrawer.contains(event.target) && !tokenButton.contains(event.target)) closeTokenDrawer();
  }
  if (document.body.classList.contains("guest-open")) {
    if (!guestDrawer.contains(event.target) && !guestButton.contains(event.target)) closeGuestDrawer();
  }
});

newChatButton.addEventListener("click", resetChat);

themeButton.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
});

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

sendButton.addEventListener("click", sendMessage);

composerTextarea.addEventListener("input", () => {
  composerTextarea.style.height = "auto";
  composerTextarea.style.height = `${Math.min(composerTextarea.scrollHeight, 150)}px`;
});

composerTextarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

renderModels();
updateTokenMeter();
renderTokenDrawer();
updateGuestMode();
