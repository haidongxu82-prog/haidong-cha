const sampleData = {
  live_id: "live_20260615_001",
  behavior: [
    { user_id: "u001", click: 12, cart: 7, buy: 4, watch_seconds: 820, comment: 3 },
    { user_id: "u002", click: 9, cart: 5, buy: 1, watch_seconds: 610, comment: 1 },
    { user_id: "u003", click: 18, cart: 3, buy: 0, watch_seconds: 420, comment: 0 },
    { user_id: "u004", click: 5, cart: 4, buy: 0, watch_seconds: 760, comment: 4 },
    { user_id: "u005", click: 3, cart: 0, buy: 0, watch_seconds: 120, comment: 0 },
    { user_id: "u006", click: 15, cart: 9, buy: 5, watch_seconds: 980, comment: 2 },
    { user_id: "u007", click: 7, cart: 3, buy: 0, watch_seconds: 540, comment: 1 },
    { user_id: "u008", click: 11, cart: 6, buy: 2, watch_seconds: 690, comment: 5 },
  ],
};

const dataInput = document.querySelector("#dataInput");
const sampleButton = document.querySelector(".sample-button");
const profileButton = document.querySelector("#profileButton");
const clearButton = document.querySelector("#clearButton");
const copyReport = document.querySelector("#copyReport");
const userCount = document.querySelector("#userCount");
const highValueCount = document.querySelector("#highValueCount");
const intentCount = document.querySelector("#intentCount");
const reportOutput = document.querySelector("#reportOutput");
const profileRows = document.querySelector("#profileRows");
const jsonOutput = document.querySelector("#jsonOutput");

function clean(rows) {
  const seen = new Set();
  return rows
    .filter((row) => {
      const key = `${row.user_id}-${row.click}-${row.cart}-${row.buy}-${row.watch_seconds}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row) => ({
      user_id: String(row.user_id || "unknown"),
      click: Number(row.click || 0),
      cart: Number(row.cart || 0),
      buy: Number(row.buy || 0),
      watch_seconds: Number(row.watch_seconds || 0),
      comment: Number(row.comment || 0),
    }));
}

function buildFeatures(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, {
        user_id: row.user_id,
        click: 0,
        cart: 0,
        buy: 0,
        watch_seconds: 0,
        comment: 0,
      });
    }
    const user = map.get(row.user_id);
    user.click += row.click;
    user.cart += row.cart;
    user.buy += row.buy;
    user.watch_seconds += row.watch_seconds;
    user.comment += row.comment;
  }

  return [...map.values()].map((user) => ({
    ...user,
    cart_rate: user.cart / (user.click + 1),
    buy_rate: user.buy / (user.click + 1),
    engagement_score: user.watch_seconds / 600 + user.comment * 0.18,
  }));
}

function segment(user) {
  if (user.buy > 3) return "高价值";
  if (user.cart_rate > 0.3) return "犹豫";
  return "普通";
}

function label(user) {
  const labels = [];
  if (user.buy > 0) labels.push("已购");
  if (user.cart_rate > 0.5) labels.push("高意向");
  if (user.engagement_score > 1.2) labels.push("深度停留");
  if (user.comment > 2) labels.push("高互动");
  return labels.length ? labels : ["待培养"];
}

function generateReport(users) {
  const total = users.length;
  const highValue = users.filter((user) => user.segment === "高价值").length;
  const hesitant = users.filter((user) => user.segment === "犹豫").length;
  const highIntent = users.filter((user) => user.labels.includes("高意向")).length;
  const buyers = users.filter((user) => user.labels.includes("已购")).length;
  const avgCartRate = users.reduce((sum, user) => sum + user.cart_rate, 0) / (total || 1);

  return [
    "【直播用户画像报告】",
    "",
    `用户规模：共识别 ${total} 个用户，其中高价值 ${highValue} 人，犹豫用户 ${hesitant} 人，高意向 ${highIntent} 人。`,
    `转化状态：已购用户 ${buyers} 人，平均加购率 ${(avgCartRate * 100).toFixed(1)}%。`,
    "",
    "用户特征：",
    "- 高价值用户已经形成购买行为，可优先推复购款、套装款或高客单组合。",
    "- 犹豫用户加购较高但购买不足，适合用尺码建议、场景展示和限时权益推动转化。",
    "- 普通用户需要先提升停留和互动，不宜过早强促单。",
    "",
    "转化问题：",
    "- 加购到购买之间仍有断点，可能卡在尺码、价格信任或上身效果。",
    "- 低互动用户需要更明确的利益点和更短路径的讲解。",
    "",
    "运营建议：",
    "1. 对高意向用户强调尺码、库存和限时权益。",
    "2. 对已购用户引导搭配款和复购福利。",
    "3. 对普通用户先用穿搭场景和真实上身效果拉停留。",
  ].join("\n");
}

function runPipeline(input) {
  const rawRows = Array.isArray(input) ? input : input.behavior;
  if (!Array.isArray(rawRows)) {
    throw new Error("输入必须是行为数组，或包含 behavior 字段。");
  }
  const cleaned = clean(rawRows);
  const users = buildFeatures(cleaned).map((user) => {
    const userSegment = segment(user);
    return {
      ...user,
      cart_rate: Number(user.cart_rate.toFixed(4)),
      buy_rate: Number(user.buy_rate.toFixed(4)),
      engagement_score: Number(user.engagement_score.toFixed(4)),
      segment: userSegment,
      labels: label(user),
    };
  });
  return {
    live_id: input.live_id || "live_demo",
    generated_at: new Date().toISOString(),
    users,
    summary: {
      user_count: users.length,
      high_value_count: users.filter((user) => user.segment === "高价值").length,
      high_intent_count: users.filter((user) => user.labels.includes("高意向")).length,
    },
    report: generateReport(users),
  };
}

function parseInput() {
  const raw = dataInput.value.trim();
  if (!raw) throw new Error("请先输入用户行为 JSON。");
  return JSON.parse(raw);
}

function percent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function render(result) {
  userCount.textContent = String(result.summary.user_count);
  highValueCount.textContent = String(result.summary.high_value_count);
  intentCount.textContent = String(result.summary.high_intent_count);
  reportOutput.textContent = result.report;
  profileRows.innerHTML = result.users
    .map(
      (user) => `
        <article class="table-row">
          <strong>${escapeHtml(user.user_id)}</strong>
          <span>${user.click}</span>
          <span>${percent(user.cart_rate)}</span>
          <span>${user.buy}</span>
          <span><span class="tag">${escapeHtml(user.segment)}</span>${user.labels
            .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
            .join("")}</span>
        </article>
      `,
    )
    .join("");
  jsonOutput.textContent = JSON.stringify(result, null, 2);
}

function generate() {
  try {
    render(runPipeline(parseInput()));
  } catch (error) {
    reportOutput.textContent = `生成失败：${error.message}`;
    profileRows.innerHTML = "";
    jsonOutput.textContent = "{}";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

sampleButton.addEventListener("click", () => {
  dataInput.value = JSON.stringify(sampleData, null, 2);
  generate();
});

profileButton.addEventListener("click", generate);

clearButton.addEventListener("click", () => {
  dataInput.value = "";
  userCount.textContent = "0";
  highValueCount.textContent = "0";
  intentCount.textContent = "0";
  reportOutput.textContent = "等待生成。";
  profileRows.innerHTML = "";
  jsonOutput.textContent = "{}";
});

copyReport.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(reportOutput.textContent);
    copyReport.textContent = "已复制";
  } catch {
    copyReport.textContent = "复制失败";
  }
  window.setTimeout(() => {
    copyReport.textContent = "复制报告";
  }, 1200);
});

dataInput.value = JSON.stringify(sampleData, null, 2);
generate();
