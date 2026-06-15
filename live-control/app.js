const sampleData = {
  live_room: "中老年民族服饰直播间",
  product: "民族风刺绣外套",
  previous: {
    timestamp: "2026-06-15T20:00:00+08:00",
    online_users: 1280,
    conversion_rate: 0.036,
    cart_rate: 0.082,
    avg_stay_seconds: 68,
    interaction_rate: 0.14,
  },
  current: {
    timestamp: "2026-06-15T20:05:00+08:00",
    online_users: 980,
    conversion_rate: 0.027,
    cart_rate: 0.076,
    avg_stay_seconds: 43,
    interaction_rate: 0.09,
  },
};

const dataInput = document.querySelector("#dataInput");
const analyzeButton = document.querySelector("#analyzeButton");
const clearButton = document.querySelector("#clearButton");
const sampleButton = document.querySelector(".sample-button");
const statusCard = document.querySelector("#statusCard");
const statusLabel = document.querySelector("#statusLabel");
const actionLabel = document.querySelector("#actionLabel");
const onlineChange = document.querySelector("#onlineChange");
const conversionChange = document.querySelector("#conversionChange");
const stayChange = document.querySelector("#stayChange");
const cartChange = document.querySelector("#cartChange");
const reasonText = document.querySelector("#reasonText");
const scriptText = document.querySelector("#scriptText");
const noticeOutput = document.querySelector("#noticeOutput");
const jsonOutput = document.querySelector("#jsonOutput");
const copyNotice = document.querySelector("#copyNotice");

function number(value) {
  return Number(value || 0);
}

function safeChange(current, previous) {
  const prev = number(previous);
  if (!prev) return 0;
  return (number(current) - prev) / prev;
}

function percent(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function metricClass(value) {
  if (value > 0.02) return "up";
  if (value < -0.02) return "down";
  return "flat";
}

function normalize(input) {
  if (Array.isArray(input)) {
    if (input.length < 2) {
      throw new Error("数组模式至少需要两条数据：上一时段和当前时段。");
    }
    return {
      live_room: "直播间",
      product: "当前商品",
      previous: input[input.length - 2],
      current: input[input.length - 1],
    };
  }

  if (!input || typeof input !== "object" || !input.previous || !input.current) {
    throw new Error("输入需要包含 previous 和 current 两组指标。");
  }

  return {
    live_room: input.live_room || "直播间",
    product: input.product || "当前商品",
    previous: input.previous,
    current: input.current,
  };
}

function calculateChanges(previous, current) {
  return {
    online_users: safeChange(current.online_users, previous.online_users),
    conversion_rate: safeChange(current.conversion_rate, previous.conversion_rate),
    cart_rate: safeChange(current.cart_rate, previous.cart_rate),
    avg_stay_seconds: safeChange(current.avg_stay_seconds, previous.avg_stay_seconds),
    interaction_rate: safeChange(current.interaction_rate, previous.interaction_rate),
  };
}

function decideStatus(current, changes) {
  if (number(current.online_users) < 300 && number(current.interaction_rate) < 0.05) {
    return {
      key: "cold",
      label: "冷启动",
      action: "拉互动破冷启动",
    };
  }

  if (
    changes.online_users <= -0.15 ||
    changes.conversion_rate <= -0.2 ||
    changes.avg_stay_seconds <= -0.3
  ) {
    const action =
      changes.conversion_rate <= -0.2
        ? "立即促单 + 切换福利"
        : "调整内容节奏";
    return {
      key: "decline",
      label: "下滑期",
      action,
    };
  }

  if (changes.cart_rate > 0 && changes.conversion_rate >= 0) {
    return {
      key: "accelerate",
      label: "加速期",
      action: "加速转化",
    };
  }

  return {
    key: "stable",
    label: "稳定期",
    action: "稳定讲解",
  };
}

function buildReasons(status, changes) {
  const reasons = [];

  if (changes.online_users <= -0.15) {
    reasons.push(`在线人数下降 ${Math.abs(changes.online_users * 100).toFixed(1)}%，流量正在流失。`);
  }
  if (changes.conversion_rate <= -0.2) {
    reasons.push(`转化率下降 ${Math.abs(changes.conversion_rate * 100).toFixed(1)}%，需要调整促单节奏。`);
  }
  if (changes.avg_stay_seconds <= -0.3) {
    reasons.push(`停留时长下降 ${Math.abs(changes.avg_stay_seconds * 100).toFixed(1)}%，内容吸引力变弱。`);
  }
  if (changes.cart_rate > 0) {
    reasons.push(`加购率上升 ${Math.abs(changes.cart_rate * 100).toFixed(1)}%，说明用户已有购买兴趣。`);
  }
  if (!reasons.length) {
    reasons.push(`${status.label}指标波动不大，继续维持当前讲解节奏。`);
  }

  return reasons;
}

function buildScripts(status, room) {
  const scripts = {
    cold: [
      "刚进来的朋友先停一下，我用 20 秒讲清楚这件衣服适合谁。",
      "喜欢民族风但怕显老的，可以先看上身版型和细节。",
    ],
    stable: [
      "现在节奏刚好，我继续把面料、版型和适合场景讲清楚。",
      "想送妈妈或自己穿的，重点看肩线和腰身位置。",
    ],
    accelerate: [
      "现在加购的人明显多了，想要这个颜色的先别等。",
      "我把尺码再快速过一遍，合适的可以直接下单。",
    ],
    decline: [
      "现在最后一波福利，我把价格和赠品一次说清楚。",
      "不确定尺码的直接问，我先帮你判断再下单。",
      "这款适合日常、旅行和聚会穿，喜欢宽松感的拍大一码。",
    ],
  };

  const prefix = room ? `${room}：` : "";
  return scripts[status.key].map((line) => `${prefix}${line}`);
}

function analyze(input) {
  const normalized = normalize(input);
  const changes = calculateChanges(normalized.previous, normalized.current);
  const status = decideStatus(normalized.current, changes);
  const reasons = buildReasons(status, changes);
  const scripts = buildScripts(status, normalized.live_room);
  const notice = [
    "【直播节奏提醒】",
    "",
    `当前状态：${status.label}`,
    `建议动作：${status.action}`,
    "",
    "原因：",
    ...reasons.map((item) => `- ${item}`),
    "",
    "建议话术：",
    ...scripts.map((item) => `“${item}”`),
  ].join("\n");

  return {
    generated_at: new Date().toISOString(),
    live_room: normalized.live_room,
    product: normalized.product,
    status: {
      key: status.key,
      label: status.label,
      action: status.action,
    },
    metrics_change: {
      online_users: Number(changes.online_users.toFixed(4)),
      conversion_rate: Number(changes.conversion_rate.toFixed(4)),
      cart_rate: Number(changes.cart_rate.toFixed(4)),
      avg_stay_seconds: Number(changes.avg_stay_seconds.toFixed(4)),
      interaction_rate: Number(changes.interaction_rate.toFixed(4)),
    },
    reason: reasons,
    scripts,
    notification: notice,
  };
}

function setMetric(el, value) {
  el.textContent = percent(value);
  el.className = metricClass(value);
}

function render(result) {
  statusCard.className = `status-card ${result.status.key}`;
  statusLabel.textContent = result.status.label;
  actionLabel.textContent = result.status.action;

  setMetric(onlineChange, result.metrics_change.online_users);
  setMetric(conversionChange, result.metrics_change.conversion_rate);
  setMetric(stayChange, result.metrics_change.avg_stay_seconds);
  setMetric(cartChange, result.metrics_change.cart_rate);

  reasonText.textContent = result.reason.map((item) => `- ${item}`).join("\n");
  scriptText.textContent = result.scripts.map((item) => `- ${item}`).join("\n");
  noticeOutput.textContent = result.notification;
  jsonOutput.textContent = JSON.stringify(result, null, 2);
}

function parseInput() {
  const raw = dataInput.value.trim();
  if (!raw) throw new Error("请先输入直播数据 JSON。");
  return JSON.parse(raw);
}

function runAnalyze() {
  try {
    const result = analyze(parseInput());
    render(result);
  } catch (error) {
    noticeOutput.textContent = `解析失败：${error.message}`;
    jsonOutput.textContent = "{}";
  }
}

sampleButton.addEventListener("click", () => {
  dataInput.value = JSON.stringify(sampleData, null, 2);
  runAnalyze();
});

analyzeButton.addEventListener("click", runAnalyze);

clearButton.addEventListener("click", () => {
  dataInput.value = "";
  statusCard.className = "status-card stable";
  statusLabel.textContent = "等待分析";
  actionLabel.textContent = "输入数据后生成建议";
  [onlineChange, conversionChange, stayChange, cartChange].forEach((el) => {
    el.textContent = "0%";
    el.className = "";
  });
  reasonText.textContent = "暂无分析结果。";
  scriptText.textContent = "分析后生成 1-3 句可直接使用的话术。";
  noticeOutput.textContent = "【直播节奏提醒】等待分析。";
  jsonOutput.textContent = "{}";
});

copyNotice.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(noticeOutput.textContent);
    copyNotice.textContent = "已复制";
    window.setTimeout(() => {
      copyNotice.textContent = "复制提醒";
    }, 1200);
  } catch {
    copyNotice.textContent = "复制失败";
    window.setTimeout(() => {
      copyNotice.textContent = "复制提醒";
    }, 1200);
  }
});

dataInput.value = JSON.stringify(sampleData, null, 2);
runAnalyze();
