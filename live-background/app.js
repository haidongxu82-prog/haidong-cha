const sampleData = {
  industry: "中老年民族服饰直播",
  goal: "conversion",
  live_data: {
    impressions: 86000,
    click_rate: 0.021,
    avg_watch_time: 34,
    conversion_rate: 0.012,
    drop_off_time: 8,
  },
  background_images: [
    "https://example.com/live-bg-product-price-cta-warm.jpg",
    "https://example.com/live-bg-busy-text-red-sale.jpg",
    "https://example.com/live-bg-clean-host-product-soft.jpg"
  ],
};

const dataInput = document.querySelector("#dataInput");
const sampleButton = document.querySelector(".sample-button");
const analyzeButton = document.querySelector("#analyzeButton");
const clearButton = document.querySelector("#clearButton");
const copyJson = document.querySelector("#copyJson");
const goalLabel = document.querySelector("#goalLabel");
const riskLabel = document.querySelector("#riskLabel");
const imageCount = document.querySelector("#imageCount");
const summaryText = document.querySelector("#summaryText");
const imageCards = document.querySelector("#imageCards");
const ctrProblems = document.querySelector("#ctrProblems");
const retentionProblems = document.querySelector("#retentionProblems");
const conversionProblems = document.querySelector("#conversionProblems");
const recommendRows = document.querySelector("#recommendRows");
const jsonOutput = document.querySelector("#jsonOutput");

function parseInput() {
  const raw = dataInput.value.trim();
  if (!raw) throw new Error("请先输入分析 JSON。");
  const parsed = JSON.parse(raw);
  if (!parsed.live_data || !Array.isArray(parsed.background_images)) {
    throw new Error("输入必须包含 live_data 和 background_images。");
  }
  return parsed;
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function analyzeImage(url, index) {
  const lower = String(url).toLowerCase();
  const hasProduct = includesAny(lower, ["product", "goods", "item", "dress", "coat", "服", "外套"]);
  const hasHost = includesAny(lower, ["host", "model", "person", "try", "主播", "模特"]);
  const hasPrice = includesAny(lower, ["price", "sale", "discount", "coupon", "福利", "价格"]);
  const hasCta = includesAny(lower, ["cta", "buy", "shop", "click", "order", "购买", "下单"]);
  const busy = includesAny(lower, ["busy", "text", "red", "sale", "banner", "dense"]);
  const clean = includesAny(lower, ["clean", "soft", "minimal", "simple"]);
  const warm = includesAny(lower, ["warm", "gold", "orange", "red"]);

  return {
    image: url,
    main_elements: [
      hasHost ? "人物/主播" : null,
      hasProduct ? "产品" : null,
      hasPrice ? "价格/利益点" : null,
      !hasHost && !hasProduct ? "场景背景" : null,
    ].filter(Boolean),
    color_style: warm ? "暖色/促销感" : clean ? "低饱和/清爽" : "中性科技感",
    information_density: busy ? "高" : hasPrice && hasCta ? "中" : "低",
    focus_clear: hasProduct || hasHost ? "yes" : "no",
    distraction: busy ? "yes" : "no",
    strong_cta: hasCta || hasPrice ? "yes" : "no",
    click_potential: hasProduct && !busy ? "medium-high" : busy ? "low" : "medium",
    note: `图 ${index + 1}：${busy ? "信息噪音偏高" : "画面负担可控"}，${hasCta ? "有明确行动引导" : "CTA 不够明确"}。`,
  };
}

function compareImages(visualAnalysis) {
  const densities = new Set(visualAnalysis.map((item) => item.information_density));
  const styles = new Set(visualAnalysis.map((item) => item.color_style));
  return {
    style_consistent: styles.size <= 2 ? "yes" : "no",
    quality_gap: densities.has("高") && densities.has("低") ? "yes" : "no",
    high_noise_images: visualAnalysis.filter((item) => item.information_density === "高").map((item) => item.image),
    low_click_potential_images: visualAnalysis.filter((item) => item.click_potential === "low").map((item) => item.image),
  };
}

function mapData(liveData, visualAnalysis) {
  const clickLow = Number(liveData.click_rate || 0) < 0.025;
  const retentionLow = Number(liveData.avg_watch_time || 0) < 45 || Number(liveData.drop_off_time || 0) < 10;
  const conversionLow = Number(liveData.conversion_rate || 0) < 0.018;
  const noisyCount = visualAnalysis.filter((item) => item.distraction === "yes").length;
  const ctaCount = visualAnalysis.filter((item) => item.strong_cta === "yes").length;

  return {
    high_ctr_visual_features: clickLow
      ? "当前 CTR 偏低，应测试清晰主体 + 低噪音 + 单一利益点背景。"
      : "当前 CTR 可接受，可保留主体明确的背景方案。",
    high_retention_visual_features: retentionLow
      ? "停留偏弱，背景应降低文字密度，突出主播和产品层级。"
      : "停留表现稳定，可继续使用低饱和、层级清晰背景。",
    high_conversion_visual_features: conversionLow
      ? "转化偏低，背景需要更明确 CTA、价格权益和信任元素。"
      : "转化正常，避免过度促销破坏品牌一致性。",
    drop_off_visual_issue:
      Number(liveData.drop_off_time || 0) < 10
        ? "用户早期流失，首屏背景可能缺少明确主体或利益点。"
        : "流失节点不集中在开场，需结合讲解节奏继续排查。",
    visual_noise_count: noisyCount,
    cta_image_count: ctaCount,
  };
}

function diagnose(liveData, visualAnalysis) {
  const hasNoisy = visualAnalysis.some((item) => item.distraction === "yes");
  const hasUnclearFocus = visualAnalysis.some((item) => item.focus_clear === "no");
  const ctaWeak = visualAnalysis.filter((item) => item.strong_cta === "yes").length === 0;
  const ctr = [];
  const retention = [];
  const conversion = [];

  if (Number(liveData.click_rate || 0) < 0.025) ctr.push("CTR 偏低，背景吸引力或主体识别不足。");
  if (hasUnclearFocus) ctr.push("部分背景缺少明确人物或产品主体。");
  if (hasNoisy) ctr.push("存在信息过载背景，可能降低点击判断效率。");

  if (Number(liveData.avg_watch_time || 0) < 45) retention.push("平均停留偏短，需要降低视觉疲劳。");
  if (Number(liveData.drop_off_time || 0) < 10) retention.push("早期流失明显，首屏层级需要更清晰。");
  if (hasNoisy) retention.push("高密度文字会干扰主播讲解节奏。");

  if (Number(liveData.conversion_rate || 0) < 0.018) conversion.push("转化率偏低，背景里的价格/权益/信任信息不够强。");
  if (ctaWeak) conversion.push("缺少明确 CTA，用户不知道下一步动作。");
  if (!visualAnalysis.some((item) => item.main_elements.includes("产品"))) {
    conversion.push("产品存在感不足，不利于成交判断。");
  }

  return { ctr, retention, conversion };
}

function buildRecommendations(input, visualAnalysis) {
  return {
    visual: [
      "保留一个主视觉主体：主播或产品二选一，不要同时堆太多装饰元素。",
      "背景文字控制在 1 个核心利益点 + 1 个行动引导，避免满屏促销语。",
      "用低饱和背景承托产品，CTA 区域使用更高对比色。",
    ],
    business: [
      "将价格/福利放在画面右下或主播手势附近，形成自然视线路径。",
      "增加信任元素：销量、面料细节、真实上身或售后承诺，但不要过度承诺效果。",
      `围绕 ${input.goal} 目标，首屏只强化一个指标动作：点击、停留或下单。`,
    ],
    ab_test: [
      {
        name: "A版：清爽产品主体",
        design: "低饱和背景 + 单产品大图 + 一句利益点",
        expected_metric: "提升 CTR 和首屏识别效率",
      },
      {
        name: "B版：主播信任场景",
        design: "主播半身 + 产品细节 + 尺码/面料信任信息",
        expected_metric: "提升停留和转化",
      },
      {
        name: "C版：强 CTA 促单",
        design: "产品主体 + 价格权益 + 明确下单引导",
        expected_metric: "提升转化率，但需监控品牌一致性",
      },
    ],
  };
}

function assessRisk(visualAnalysis, recommendations) {
  const noisy = visualAnalysis.filter((item) => item.distraction === "yes").length;
  const cta = visualAnalysis.filter((item) => item.strong_cta === "yes").length;
  const issues = [];
  if (noisy > 0) issues.push("存在高信息密度背景，可能降低点击和停留。");
  if (cta === 0) issues.push("缺少 CTA，可能降低转化。");
  if (recommendations.business.some((item) => item.includes("承诺"))) {
    issues.push("涉及权益或效果表达时，需避免过度承诺和违规营销。");
  }
  return {
    level: issues.length >= 3 ? "high" : issues.length >= 1 ? "medium" : "low",
    issues,
  };
}

function runAnalysis(input) {
  const visualAnalysis = input.background_images.map(analyzeImage);
  const comparison = compareImages(visualAnalysis);
  const dataMapping = mapData(input.live_data, visualAnalysis);
  const problems = diagnose(input.live_data, visualAnalysis);
  const recommendations = buildRecommendations(input, visualAnalysis);
  const risk = assessRisk(visualAnalysis, recommendations);

  return {
    summary: `共分析 ${visualAnalysis.length} 张背景图。当前重点问题是 ${
      problems.conversion.length ? "转化链路不够明确" : "视觉层级需要继续优化"
    }；建议优先测试“清爽主体 + 明确 CTA”的背景方案。`,
    visual_analysis: visualAnalysis,
    multi_image_comparison: comparison,
    data_mapping: dataMapping,
    problems,
    recommendations,
    risk,
  };
}

function render(result, input) {
  goalLabel.textContent = input.goal || "-";
  riskLabel.textContent = result.risk.level;
  imageCount.textContent = String(result.visual_analysis.length);
  summaryText.textContent = result.summary;
  imageCards.innerHTML = result.visual_analysis
    .map(
      (item, index) => `
        <article class="image-card">
          <span>IMAGE ${index + 1}</span>
          <strong>${escapeHtml(item.image)}</strong>
          <p>主视觉：${escapeHtml(item.main_elements.join(" / "))}</p>
          <p>色彩：${escapeHtml(item.color_style)} · 密度：${escapeHtml(item.information_density)}</p>
          <p>焦点：${item.focus_clear} · 干扰：${item.distraction} · CTA：${item.strong_cta}</p>
        </article>
      `,
    )
    .join("");
  renderList(ctrProblems, result.problems.ctr);
  renderList(retentionProblems, result.problems.retention);
  renderList(conversionProblems, result.problems.conversion);
  recommendRows.innerHTML = [
    ...result.recommendations.visual.map((item) => ["视觉优化", item]),
    ...result.recommendations.business.map((item) => ["商业转化", item]),
    ...result.recommendations.ab_test.map((item) => ["A/B测试", `${item.name}：${item.design}；预期 ${item.expected_metric}`]),
  ]
    .map(
      ([title, text]) => `
        <article>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(text)}</span>
        </article>
      `,
    )
    .join("");
  jsonOutput.textContent = JSON.stringify(result, null, 2);
}

function renderList(el, items) {
  el.innerHTML = (items.length ? items : ["暂无明显问题。"])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function analyze() {
  try {
    const input = parseInput();
    render(runAnalysis(input), input);
  } catch (error) {
    summaryText.textContent = `分析失败：${error.message}`;
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
  analyze();
});

analyzeButton.addEventListener("click", analyze);

clearButton.addEventListener("click", () => {
  dataInput.value = "";
  goalLabel.textContent = "-";
  riskLabel.textContent = "-";
  imageCount.textContent = "0";
  summaryText.textContent = "等待分析。";
  imageCards.innerHTML = "";
  [ctrProblems, retentionProblems, conversionProblems].forEach((el) => {
    el.innerHTML = "";
  });
  recommendRows.innerHTML = "";
  jsonOutput.textContent = "{}";
});

copyJson.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(jsonOutput.textContent);
    copyJson.textContent = "已复制";
  } catch {
    copyJson.textContent = "复制失败";
  }
  window.setTimeout(() => {
    copyJson.textContent = "复制 JSON";
  }, 1200);
});

dataInput.value = JSON.stringify(sampleData, null, 2);
analyze();
