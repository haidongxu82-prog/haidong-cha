const STORAGE_KEY = "haidong.kids-english-ai-coach.v1";

const phases = [
  {
    id: "warmup",
    title: "Warm-up",
    label: "热身问候",
    goal: "用简单英语表达今天的状态。",
    openingPrompt: "Hi! I am Coco. How are you today? You can answer: I am happy.",
    expectedPattern: "I am happy / I am good / I am tired."
  },
  {
    id: "vocabulary",
    title: "Words",
    label: "核心词汇",
    goal: "练习 apple, banana, orange 三个水果词。",
    openingPrompt: "Let's learn fruit words: apple, banana, orange. Which fruit do you like?",
    expectedPattern: "I like apples / bananas / oranges."
  },
  {
    id: "sentence",
    title: "Sentence",
    label: "句型练习",
    goal: "使用 I like... because... 说出一个完整句子。",
    openingPrompt: "Now make a longer sentence: I like apples because they are sweet. Your turn!",
    expectedPattern: "I like ... because ..."
  },
  {
    id: "dialogue",
    title: "Role-play",
    label: "情景对话",
    goal: "在水果店情景里表达想要的东西。",
    openingPrompt: "Role-play time. I am a shopkeeper. What fruit do you want?",
    expectedPattern: "I want apples / I want one banana, please."
  },
  {
    id: "wrapup",
    title: "Review",
    label: "复盘总结",
    goal: "复述本节课最重要的一句话。",
    openingPrompt: "Last step! Please tell me one English sentence you practiced today.",
    expectedPattern: "Any complete sentence from today's lesson."
  }
];

const viewEl = document.querySelector("#view");
const titleEl = document.querySelector("#pageTitle");
const toastEl = document.querySelector("#toast");
const newLessonBtn = document.querySelector("#newLessonBtn");
const viewButtons = [...document.querySelectorAll("[data-view-button]")];

let state = loadState();
let activeView = "learn";
let selectedSessionId = state.sessions[0]?.id || "";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (Array.isArray(saved.sessions)) return saved;
  } catch {}
  return { sessions: [] };
}

function saveState() {
  state.sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 2800);
}

function setView(nextView) {
  activeView = nextView;
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewButton === activeView);
  });
  render();
}

function currentSession() {
  return state.sessions.find((item) => item.id === selectedSessionId) || state.sessions[0] || null;
}

function createLessonSession() {
  const now = nowIso();
  const firstPhase = phases[0];
  const session = {
    id: uid(),
    status: "active",
    startedAt: now,
    updatedAt: now,
    currentPhaseIndex: 0,
    phaseResults: [],
    messages: [
      {
        id: uid(),
        role: "ai",
        phaseId: firstPhase.id,
        content: firstPhase.openingPrompt,
        createdAt: now
      }
    ]
  };
  state.sessions.unshift(session);
  selectedSessionId = session.id;
  saveState();
  showToast("新课程已开始");
  setView("learn");
}

function fallbackAssessment(phase, childAnswer) {
  const answer = childAnswer.trim();
  const lowerAnswer = answer.toLowerCase();

  if (!answer) {
    return {
      correction: `Take your time. You can try: ${phase.expectedPattern}`,
      encouragement: "You are still learning, and trying is important."
    };
  }

  if (phase.id === "warmup") {
    const hasFeeling = /\bi am\b/.test(lowerAnswer) || /\bi'm\b/.test(lowerAnswer);
    return {
      correction: hasFeeling
        ? "Nice sentence. You can also say: I am happy today."
        : "Good try. A full answer is: I am happy.",
      encouragement: "Great start. Your English voice is warming up."
    };
  }

  if (phase.id === "vocabulary") {
    return {
      correction: /\bi like\b/.test(lowerAnswer)
        ? "Good. Remember: I like apples uses a full sentence."
        : "Try using the sentence: I like apples.",
      encouragement: "Nice fruit words. Let's make the sentence stronger."
    };
  }

  if (phase.id === "sentence") {
    return {
      correction:
        /\bbecause\b/.test(lowerAnswer) && /\bi like\b/.test(lowerAnswer)
          ? "Good complete sentence with because."
          : "Try a longer sentence: I like apples because they are sweet.",
      encouragement: "That was a brave longer answer."
    };
  }

  if (phase.id === "dialogue") {
    return {
      correction: /\bi want\b/.test(lowerAnswer)
        ? "Good shopping sentence. You can add please at the end."
        : "In a shop, say: I want apples, please.",
      encouragement: "Nice role-play. You are using English for a real situation."
    };
  }

  return {
    correction: "Good review sentence. Keep speaking in complete sentences.",
    encouragement: "Excellent work. You finished the whole lesson."
  };
}

function buildParentReport(session) {
  const corrections = session.phaseResults
    .map((result) => result.correction)
    .filter(Boolean)
    .slice(0, 5);

  return {
    generatedAt: nowIso(),
    summary: `孩子完成了 ${session.phaseResults.length}/${phases.length} 个固定学习阶段，练习了问候、水果词汇、完整句型、购物情景对话和课堂复盘。`,
    strengths: [
      "能够跟随固定流程完成多轮英语输入。",
      "愿意用简单句回答问题，具备继续开口练习的基础。",
      "已经接触 I am, I like, I want 等高频表达。"
    ],
    corrections:
      corrections.length > 0
        ? corrections
        : ["继续鼓励孩子用完整句回答，例如 I like apples."],
    nextPractice: [
      "每天复述 3 次：I like apples because they are sweet.",
      "用 I want ..., please. 做 2 分钟购物角色扮演。",
      "下次练习加入颜色或数量，例如 I want two red apples."
    ],
    completedPhases: session.phaseResults.length,
    totalPhases: phases.length
  };
}

function sendAnswer(answer) {
  const session = currentSession();
  if (!session || session.status === "completed") return;

  const trimmed = answer.trim();
  if (!trimmed) {
    showToast("请输入孩子的英文回答");
    return;
  }

  const now = nowIso();
  const phase = phases[Math.min(session.currentPhaseIndex, phases.length - 1)];
  const assessment = fallbackAssessment(phase, trimmed);

  session.messages.push({
    id: uid(),
    role: "child",
    phaseId: phase.id,
    content: trimmed,
    createdAt: now
  });
  session.phaseResults.push({
    phaseId: phase.id,
    childAnswer: trimmed,
    correction: assessment.correction,
    encouragement: assessment.encouragement,
    completedAt: now
  });

  const isLastPhase = session.currentPhaseIndex >= phases.length - 1;
  let aiPhaseId = phase.id;
  let aiContent = `${assessment.correction}\n\n${assessment.encouragement}`;

  if (isLastPhase) {
    session.status = "completed";
    session.completedAt = now;
    aiContent = `${aiContent}\n\nGreat work. Lesson finished! I will write a short report for your parent.`;
  } else {
    session.currentPhaseIndex += 1;
    const nextPhase = phases[session.currentPhaseIndex];
    aiPhaseId = nextPhase.id;
    aiContent = `${aiContent}\n\n${nextPhase.openingPrompt}`;
  }

  session.messages.push({
    id: uid(),
    role: "ai",
    phaseId: aiPhaseId,
    content: aiContent,
    createdAt: nowIso()
  });

  if (isLastPhase) {
    session.report = buildParentReport(session);
    showToast("课程完成，家长报告已生成");
  }

  session.updatedAt = nowIso();
  saveState();
  render();
}

function phaseListHtml(session) {
  return phases
    .map((phase, index) => {
      const done = session.status === "completed" || index < session.currentPhaseIndex;
      const current = session.status !== "completed" && index === session.currentPhaseIndex;
      return `
        <div class="phase-item ${done ? "done" : ""} ${current ? "current" : ""}">
          <strong>${escapeHtml(phase.label)}</strong>
          <span>${escapeHtml(phase.goal)}</span>
        </div>
      `;
    })
    .join("");
}

function renderLearn() {
  titleEl.textContent = "Fruit Shop English";

  let session = currentSession();
  if (!session) {
    createLessonSession();
    session = currentSession();
  }

  const currentPhase = phases[Math.min(session.currentPhaseIndex, phases.length - 1)];
  const completedCount = session.status === "completed" ? phases.length : session.currentPhaseIndex;

  viewEl.innerHTML = `
    <div class="lesson-layout">
      <aside class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">CURRENT</p>
            <h2>${escapeHtml(currentPhase.label)}</h2>
          </div>
          <span class="status-pill">${Math.min(completedCount + 1, phases.length)}/${phases.length}</span>
        </div>
        <div class="panel-body phase-list">
          ${phaseListHtml(session)}
        </div>
      </aside>

      <section class="panel chat-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">COCO</p>
            <h2>AI 对话</h2>
          </div>
          ${session.status === "completed" ? '<button class="btn" type="button" data-open-report>查看报告</button>' : ""}
        </div>
        <div class="messages" id="messages">
          ${session.messages
            .map((message) => `
              <div class="message ${message.role === "child" ? "child" : "ai"}">
                <div class="bubble">
                  <span class="bubble-label">${message.role === "child" ? "孩子" : "AI Coco"}</span>
                  <p>${escapeHtml(message.content)}</p>
                </div>
              </div>
            `)
            .join("")}
        </div>
        <form class="answer-bar" data-answer-form>
          <input
            class="field"
            name="answer"
            autocomplete="off"
            placeholder="${session.status === "completed" ? "本次学习已完成" : "输入孩子的英文回答"}"
            ${session.status === "completed" ? "disabled" : ""}
          />
          <button class="btn" type="submit" ${session.status === "completed" ? "disabled" : ""}>发送</button>
        </form>
      </section>
    </div>
  `;

  const messagesEl = document.querySelector("#messages");
  messagesEl.scrollTop = messagesEl.scrollHeight;

  document.querySelector("[data-answer-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.answer;
    sendAnswer(input.value);
  });

  document.querySelector("[data-open-report]")?.addEventListener("click", () => setView("parent"));
}

function reportListHtml(items) {
  return items
    .map((item) => `
      <button class="history-item ${item.id === selectedSessionId ? "active" : ""}" type="button" data-session-id="${item.id}">
        <strong>${formatTime(item.startedAt)}</strong>
        <span class="muted">${item.status === "completed" ? "已完成" : `进行到 ${phases[item.currentPhaseIndex]?.label || "学习中"}`}</span>
      </button>
    `)
    .join("");
}

function renderParent() {
  titleEl.textContent = "家长学习报告";

  if (state.sessions.length === 0) {
    viewEl.innerHTML = `
      <div class="empty-state">
        <div>
          <h2>还没有学习记录</h2>
          <p class="muted">完成一次学习后，这里会显示总结和对话记录。</p>
          <button class="btn" type="button" data-start-first>开始学习</button>
        </div>
      </div>
    `;
    document.querySelector("[data-start-first]").addEventListener("click", createLessonSession);
    return;
  }

  const session = currentSession();
  const report = session.report;

  viewEl.innerHTML = `
    <div class="report-layout">
      <aside class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">HISTORY</p>
            <h2>学习记录</h2>
          </div>
        </div>
        <div class="panel-body history-list">
          ${reportListHtml(state.sessions.slice(0, 12))}
        </div>
      </aside>

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${formatTime(session.startedAt)}</p>
            <h2>学习总结</h2>
          </div>
          <span class="status-pill">${session.status === "completed" ? "已完成" : "进行中"}</span>
        </div>
        <div class="panel-body">
          ${
            report
              ? `
                <p class="summary-box">${escapeHtml(report.summary)}</p>
                <div class="report-grid">
                  ${reportCard("表现亮点", report.strengths)}
                  ${reportCard("纠错记录", report.corrections)}
                  ${reportCard("下次练习", report.nextPractice)}
                </div>
              `
              : '<p class="summary-box">这节课尚未完成。孩子完成 5 个阶段后会自动生成报告。</p>'
          }
        </div>
      </section>

      <section class="panel transcript-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">TRANSCRIPT</p>
            <h2>对话记录</h2>
          </div>
        </div>
        <div class="panel-body transcript">
          ${session.messages
            .map((message) => `
              <div class="transcript-item ${message.role === "child" ? "child" : ""}">
                <strong>${message.role === "child" ? "孩子" : "AI Coco"}</strong>
                <span class="report-meta">${phases.find((phase) => phase.id === message.phaseId)?.label || ""}</span>
                <p>${escapeHtml(message.content)}</p>
              </div>
            `)
            .join("")}
        </div>
      </section>
    </div>
  `;

  document.querySelectorAll("[data-session-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSessionId = button.dataset.sessionId;
      renderParent();
    });
  });
}

function reportCard(title, rows) {
  return `
    <div class="report-card">
      <strong>${escapeHtml(title)}</strong>
      <ul>
        ${rows.map((row) => `<li>${escapeHtml(row)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function render() {
  if (activeView === "parent") {
    renderParent();
  } else {
    renderLearn();
  }
}

viewButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.viewButton));
});

newLessonBtn.addEventListener("click", createLessonSession);

render();
