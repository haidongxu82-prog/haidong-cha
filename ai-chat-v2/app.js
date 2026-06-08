/* ===== Auth Gate ===== */
const authForm = document.querySelector(".auth-form");
const accessPassword = document.querySelector("#accessPassword");
const authSubmit = document.querySelector("#authSubmit");
const authError = document.querySelector("#authError");

function setAuthed(authed) {
  document.body.classList.toggle("authed", !!authed);
  if (authed) document.body.classList.remove("auth-open");
}

function openAuthGate(message) {
  if (authError) authError.textContent = message || "";
  document.body.classList.add("auth-open");
  setTimeout(function() { accessPassword && accessPassword.focus(); }, 80);
}

async function requireAuth(message) {
  if (document.body.classList.contains("authed")) return true;
  try {
    const response = await fetch("/api/auth/check");
    const data = await response.json();
    if (data.authed) { setAuthed(true); return true; }
  } catch (e) {}
  openAuthGate(message || "请先验证身份后使用");
  return false;
}

async function checkAuth() {
  try {
    const response = await fetch("/api/auth/check");
    const data = await response.json();
    setAuthed(!!data.authed);
    if (!data.authed) openAuthGate();
  } catch (e) {
    setAuthed(false);
  }
}

async function submitAuth(event) {
  event.preventDefault();
  var password = accessPassword.value.trim();
  if (!password) { authError.textContent = "请输入访问密码"; return; }
  authSubmit.disabled = true;
  authSubmit.textContent = "验证中";
  authError.textContent = "";
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    accessPassword.value = "";
    setAuthed(true);
  } catch (error) {
    authError.textContent = error.message || "验证失败";
    setAuthed(false);
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = "进入海东 AI";
  }
}

if (authForm) authForm.addEventListener("submit", submitAuth);

checkAuth();
/* ===== End Auth Gate ===== */

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

const root = document.documentElement;
const historyButton = document.querySelector(".rail-btn.history");
const themeButton = document.querySelector(".rail-btn.theme");
const drawerClose = document.querySelector(".drawer-close");
const historyDrawer = document.querySelector(".history-drawer");
const historyList = document.querySelector(".history-drawer");
const newChatButton = document.querySelector(".new-chat");
const conversation = document.querySelector(".conversation");
const composer = document.querySelector(".composer");
const composerTextarea = document.querySelector(".composer textarea");
const sendButton = document.querySelector(".composer button");
const modelsWrap = document.querySelector(".models");

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
  if (!await requireAuth()) return;
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
  abortController = new AbortController();
  setBusy(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: currentModel, messages }),
      signal: abortController.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      throw new Error("接口没有返回可显示内容");
    }

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
        const delta = parsed.choices?.[0]?.delta?.content || "";
        if (!delta) continue;
        reply += delta;
        bubble.innerHTML = renderText(reply);
        aiMessage.scrollIntoView({ block: "end", behavior: "smooth" });
      }
    }

    messages.push({ role: "assistant", content: reply });
    await saveMessage("assistant", reply);
  } catch (error) {
    if (error.name !== "AbortError") {
      bubble.innerHTML = `<span class="error-text">${escapeHtml(error.message || "发送失败")}</span>`;
    }
  } finally {
    abortController = null;
    setBusy(false);
  }
}

function resetChat() {
  messages = [];
  conversationId = makeId();
  conversation.innerHTML = "";
  conversation.classList.remove("has-messages");
  composerTextarea.value = "";
  composerTextarea.focus();
  closeHistory();
}

function openHistory() {
  document.body.classList.add("history-open");
  historyButton.setAttribute("aria-expanded", "true");
  loadHistory();
}

function closeHistory() {
  document.body.classList.remove("history-open");
  historyButton.setAttribute("aria-expanded", "false");
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

drawerClose.addEventListener("click", closeHistory);

document.addEventListener("pointerdown", (event) => {
  if (!document.body.classList.contains("history-open")) return;
  if (historyDrawer.contains(event.target) || historyButton.contains(event.target)) return;
  closeHistory();
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
