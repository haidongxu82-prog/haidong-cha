const root = document.documentElement;
const body = document.body;
const modelList = document.querySelector("#modelList");
const modeTabs = document.querySelector("#modeTabs");
const conversation = document.querySelector("#conversation");
const composer = document.querySelector("#composer");
const userInput = document.querySelector("#userInput");
const sendButton = document.querySelector("#sendButton");
const historyButton = document.querySelector(".rail-btn.history");
const drawerClose = document.querySelector(".drawer-close");
const historyList = document.querySelector("#historyList");

let modelData = window.__MODEL_DATA__ || null;
let currentGroup = "chat";
let currentModel = "";
let messages = [];
let conversationId = createId();
let streaming = false;
let abortController = null;

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(value) {
  let text = String(value ?? "");
  const imageMatch = text.match(/!\[[^\]]*\]\((data:image\/[^)]+)\)/);
  let image = "";

  if (imageMatch) {
    image = `<img src="${imageMatch[1]}" alt="生成图片">`;
    text = text.replace(/!\[[^\]]*\]\(data:image\/[^)]+\)/, "");
  }

  return image + escapeHtml(text)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("haidong_ai_theme", theme);
}

function setupTheme() {
  setTheme(localStorage.getItem("haidong_ai_theme") || "light");
  document.querySelector(".theme").addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });
}

function setupDrawer() {
  historyButton.addEventListener("click", () => {
    const open = body.classList.toggle("history-open");
    historyButton.setAttribute("aria-expanded", String(open));
    if (open) loadHistory();
  });

  drawerClose.addEventListener("click", closeDrawer);
}

function closeDrawer() {
  body.classList.remove("history-open");
  historyButton.setAttribute("aria-expanded", "false");
}

async function ensureAuth() {
  try {
    const check = await fetch("/api/auth/check").then((res) => res.json());
    if (check.authed) return true;
  } catch {
    return true;
  }

  const password = window.prompt("请输入访问密码");
  if (!password) return false;

  const result = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  }).then((res) => res.json()).catch(() => ({ error: "登录失败" }));

  if (result.ok) return true;
  window.alert(result.error || "密码错误");
  return false;
}

async function loadModels() {
  if (!modelData) {
    try {
      modelData = await fetch("/api/models").then((res) => res.json());
    } catch {
      modelData = readFallbackModels();
    }
  }

  if (!modelData?.chat?.length) modelData = readFallbackModels();
  currentModel = modelData[currentGroup]?.[0]?.id || modelData.chat?.[0]?.id || "GPT-4o";
  renderModels();
}

function readFallbackModels() {
  const chat = [...document.querySelectorAll('.model[data-group="chat"]')].map((item) => ({
    id: item.dataset.model || item.textContent.trim().replace(/^.\s*/, ""),
    name: item.textContent.trim(),
  }));

  return { chat, image: [] };
}

function renderModels() {
  const models = modelData[currentGroup] || [];
  modelList.innerHTML = models.map((model) => (
    `<button class="model ${model.id === currentModel ? "active" : ""}" data-model="${escapeHtml(model.id)}" type="button">${escapeHtml(model.name)}</button>`
  )).join("");

  modelList.querySelectorAll(".model").forEach((button) => {
    button.addEventListener("click", () => selectModel(button.dataset.model));
  });

  modeTabs.querySelectorAll(".mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.group === currentGroup);
  });
}

function selectModel(modelId) {
  currentModel = modelId;
  modelList.querySelectorAll(".model").forEach((item) => {
    item.classList.toggle("active", item.dataset.model === modelId);
  });
}

function setupModes() {
  modeTabs.querySelectorAll(".mode").forEach((button) => {
    button.addEventListener("click", () => {
      currentGroup = button.dataset.group;
      currentModel = modelData[currentGroup]?.[0]?.id || currentModel;
      renderModels();
    });
  });
}

function appendMessage(role, content, modelTag = "") {
  const message = document.createElement("article");
  message.className = `message ${role}`;
  message.innerHTML = `${modelTag ? `<div class="model-tag">${escapeHtml(modelTag)}</div>` : ""}<div class="content">${renderMarkdown(content)}</div>`;
  conversation.appendChild(message);
  conversation.scrollTop = conversation.scrollHeight;
  return message;
}

async function ensureConversation() {
  const firstUserMessage = messages.find((item) => item.role === "user")?.content || "新对话";
  await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: conversationId,
      title: firstUserMessage.slice(0, 60),
      model: currentModel,
    }),
  }).catch(() => {});
}

async function saveMessage(role, content) {
  await ensureConversation();
  await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, content }),
  }).catch(() => {});
}

async function sendMessage(event) {
  event?.preventDefault();
  if (streaming) return;

  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  resizeInput();
  appendMessage("user", text);
  messages.push({ role: "user", content: text });
  saveMessage("user", text);

  const aiMessage = appendMessage("ai", "", currentModel);
  const content = aiMessage.querySelector(".content");
  let answer = "";

  streaming = true;
  sendButton.disabled = true;
  abortController = new AbortController();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: currentModel, messages }),
      signal: abortController.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      const result = await response.json().catch(() => ({ error: "请求失败" }));
      throw new Error(result.error || "请求失败");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop();

      for (const chunk of chunks) {
        const line = chunk.split("\n").find((item) => item.startsWith("data: "));
        if (!line) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;
        const data = JSON.parse(payload);
        if (data.error) throw new Error(data.error);
        const delta = data.choices?.[0]?.delta?.content || "";
        if (delta) {
          answer += delta;
          content.innerHTML = renderMarkdown(answer) + '<span class="typing"></span>';
          conversation.scrollTop = conversation.scrollHeight;
        }
      }
    }

    content.innerHTML = renderMarkdown(answer || "完成");
    messages.push({ role: "assistant", content: answer || "完成" });
    saveMessage("assistant", answer || "完成");
    loadHistory();
  } catch (error) {
    if (error.name !== "AbortError") {
      content.innerHTML = `<span class="error-text">${escapeHtml(error.message || "请求失败")}</span>`;
    }
  } finally {
    streaming = false;
    sendButton.disabled = false;
    abortController = null;
  }
}

async function loadHistory() {
  historyList.innerHTML = '<div class="panel-empty">读取中...</div>';

  try {
    const list = await fetch("/api/conversations").then((res) => res.json());
    if (!Array.isArray(list) || !list.length) {
      historyList.innerHTML = '<div class="panel-empty">暂无历史对话</div>';
      return;
    }

    historyList.innerHTML = list.map((item) => (
      `<button class="history-item" type="button" data-id="${escapeHtml(item.id)}">
        <span>${escapeHtml(item.title || "新对话")}</span>
        <small>${escapeHtml((item.updated_at || item.created_at || "").slice(0, 10))}</small>
      </button>`
    )).join("");

    historyList.querySelectorAll(".history-item").forEach((item) => {
      item.addEventListener("click", () => loadConversation(item.dataset.id));
    });
  } catch {
    historyList.innerHTML = '<div class="panel-empty">无法读取历史</div>';
  }
}

async function loadConversation(id) {
  const list = await fetch(`/api/conversations/${id}/messages`).then((res) => res.json()).catch(() => []);
  if (!Array.isArray(list)) return;

  conversationId = id;
  messages = [];
  conversation.innerHTML = "";

  list.forEach((message) => {
    messages.push({ role: message.role, content: message.content });
    appendMessage(message.role, message.content, message.role === "assistant" ? currentModel : "");
  });

  closeDrawer();
}

function newConversation() {
  conversationId = createId();
  messages = [];
  conversation.innerHTML = "";
  userInput.value = "";
  resizeInput();
  userInput.focus();
  closeDrawer();
}

function resizeInput() {
  userInput.style.height = "auto";
  userInput.style.height = `${Math.min(userInput.scrollHeight, 160)}px`;
}

function setupInput() {
  composer.addEventListener("submit", sendMessage);
  userInput.addEventListener("input", resizeInput);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event);
    }
  });
  document.querySelector(".new-chat").addEventListener("click", newConversation);
}

async function boot() {
  setupTheme();
  setupDrawer();
  setupModes();
  setupInput();
  await loadModels();
  await ensureAuth();
  loadHistory();
}

boot();
