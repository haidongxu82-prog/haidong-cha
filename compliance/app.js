const dictionaries = {
  extreme: {
    label: "极限词",
    words: ["最", "第一", "全网最低", "100%", "绝对", "顶级", "唯一"],
  },
  elderly: {
    label: "中老年敏感表达",
    words: ["治疗", "强身", "延寿", "改善气血", "不买后悔", "孝顺必买"],
  },
  ethnic: {
    label: "民族文化风险",
    words: ["正宗血统", "唯一传承", "国家级认证", "最正统民族"],
  },
};

const semanticPatterns = [
  {
    type: "功效暗示",
    level: "mid",
    patterns: ["显年轻", "改善气质", "养生", "气血", "精神好了", "身体舒服"],
    reason: "服饰类话术不应暗示医疗、养生或身体改善效果。",
  },
  {
    type: "情绪营销诱导",
    level: "high",
    patterns: ["必须买", "不买后悔", "不给爸妈买", "才算孝顺", "孝顺绑定"],
    reason: "不应使用亲情压力或后悔恐惧推动成交。",
  },
  {
    type: "绝对化表达",
    level: "mid",
    patterns: ["最好", "永久", "永远", "百分百", "100%", "全网", "第一"],
    reason: "不应承诺绝对效果、绝对地位或无法证明的最优性。",
  },
  {
    type: "文化夸大表达",
    level: "high",
    patterns: ["唯一民族传承", "正宗血统", "官方认证民族", "国家级认证", "最正统"],
    reason: "民族文化描述不能使用唯一、正宗、官方认证等绝对化背书。",
  },
];

const sampleText =
  "这款民族风外套是全网最低价，正宗血统工艺，妈妈穿上显年轻，改善气质，不买后悔，孝顺必买。";

const textInput = document.querySelector("#scriptText");
const reviewButton = document.querySelector("#reviewButton");
const clearButton = document.querySelector("#clearButton");
const sampleButton = document.querySelector(".sample-button");
const riskCard = document.querySelector("#riskCard");
const riskLevel = document.querySelector("#riskLevel");
const decision = document.querySelector("#decision");
const hitWords = document.querySelector("#hitWords");
const reason = document.querySelector("#reason");
const rewriteSafe = document.querySelector("#rewriteSafe");
const rewriteConversion = document.querySelector("#rewriteConversion");
const rewriteStrict = document.querySelector("#rewriteStrict");
const jsonOutput = document.querySelector("#jsonOutput");

function detectRules(text) {
  const hits = [];
  for (const [category, dictionary] of Object.entries(dictionaries)) {
    for (const word of dictionary.words) {
      if (text.includes(word)) {
        hits.push({ word, category, label: dictionary.label });
      }
    }
  }
  return hits;
}

function detectSemanticRisks(text) {
  const risks = [];
  for (const item of semanticPatterns) {
    const matched = item.patterns.filter((pattern) => text.includes(pattern));
    if (matched.length) {
      risks.push({
        type: item.type,
        level: item.level,
        words: matched,
        reason: item.reason,
      });
    }
  }
  return risks;
}

function getRiskLevel(ruleHits, semanticRisks) {
  const hasHighRule = ruleHits.some((item) => item.category === "elderly" || item.category === "ethnic");
  const hasHighSemantic = semanticRisks.some((item) => item.level === "high");
  if (hasHighRule || hasHighSemantic) return "high";
  if (ruleHits.length || semanticRisks.length) return "mid";
  return "low";
}

function getDecision(level) {
  if (level === "high") return "manual_review";
  if (level === "mid") return "rewrite";
  return "pass";
}

function removeRiskyWords(text) {
  let value = text;
  const replacements = [
    ["全网最低价", "近期比较划算"],
    ["全网最低", "价格有竞争力"],
    ["第一", "比较受欢迎"],
    ["最好", "很适合"],
    ["最", "很"],
    ["绝对", "比较"],
    ["100%", "尽量"],
    ["百分百", "尽量"],
    ["唯一", "有代表性"],
    ["顶级", "高品质"],
    ["治疗", "日常穿着体验"],
    ["强身", "舒适自在"],
    ["延寿", "舒适耐穿"],
    ["改善气血", "衬托气色"],
    ["不买后悔", "喜欢可以重点看看"],
    ["孝顺必买", "适合作为心意选择"],
    ["正宗血统", "民族风格"],
    ["唯一传承", "传统元素"],
    ["国家级认证", "工艺细节"],
    ["最正统民族", "民族风设计"],
    ["显年轻", "显得精神"],
    ["养生效果", "穿着舒适"],
    ["必须买", "可以考虑"],
  ];
  for (const [from, to] of replacements) {
    value = value.split(from).join(to);
  }
  return value.replace(/\s+/g, " ").trim();
}

function buildRewrites(text, level) {
  const base = removeRiskyWords(text);
  if (level === "low") {
    return {
      safe: text,
      conversion: text,
      strict: text,
    };
  }

  return {
    safe: `${base}。整体表达建议以面料、版型、颜色、穿着场景和搭配效果为主，避免功效承诺和绝对化说法。`,
    conversion: `${base}。适合日常出门、节日聚会或送给长辈时表达心意，喜欢民族风和舒适版型的朋友可以重点看看。`,
    strict: `这款服饰采用民族风设计元素，适合日常穿搭、聚会拍照和长辈礼物场景。具体效果以个人穿着体验为准。`,
  };
}

function buildReason(ruleHits, semanticRisks, level) {
  if (level === "low") return "未发现明显违规词或高风险语义表达。";
  const reasons = [];
  if (ruleHits.length) {
    const grouped = [...new Set(ruleHits.map((item) => item.label))].join("、");
    reasons.push(`命中${grouped}。`);
  }
  for (const risk of semanticRisks) {
    reasons.push(`${risk.type}：${risk.reason}`);
  }
  return reasons.join(" ");
}

function reviewText(text) {
  const normalized = String(text || "").trim();
  const ruleHits = detectRules(normalized);
  const semanticRisks = detectSemanticRisks(normalized);
  const level = getRiskLevel(ruleHits, semanticRisks);
  const rewrites = buildRewrites(normalized, level);
  const violations = [
    ...new Set([
      ...ruleHits.map((item) => item.label),
      ...semanticRisks.map((item) => item.type),
    ]),
  ];

  return {
    risk_level: level,
    hit_words: ruleHits.map((item) => item.word),
    rule_hits: ruleHits,
    semantic_risks: semanticRisks,
    violations,
    reason: buildReason(ruleHits, semanticRisks, level),
    rewrite_safe: rewrites.safe,
    rewrite_conversion: rewrites.conversion,
    rewrite_strict: rewrites.strict,
    final_decision: getDecision(level),
  };
}

function riskLabel(level) {
  return {
    low: "低风险",
    mid: "中风险",
    high: "高风险",
  }[level] || "等待审核";
}

function decisionLabel(value) {
  return {
    pass: "直接通过",
    rewrite: "建议使用安全改写",
    manual_review: "进入人工审核",
  }[value] || "输入话术后开始检测";
}

function renderResult(result, originalText) {
  riskCard.className = `risk-card ${result.risk_level}`;
  riskLevel.textContent = riskLabel(result.risk_level);
  decision.textContent = decisionLabel(result.final_decision);

  hitWords.innerHTML = result.hit_words.length
    ? result.hit_words.map((word) => `<b>${escapeHtml(word)}</b>`).join("")
    : "<em>暂无</em>";

  reason.textContent = result.reason;
  rewriteSafe.textContent = result.rewrite_safe;
  rewriteConversion.textContent = result.rewrite_conversion;
  rewriteStrict.textContent = result.rewrite_strict;

  jsonOutput.textContent = JSON.stringify(
    {
      risk_level: result.risk_level,
      original_text: originalText,
      hit_words: result.hit_words,
      violations: result.violations,
      reason: result.reason,
      rewrite_safe: result.rewrite_safe,
      rewrite_conversion: result.rewrite_conversion,
      rewrite_strict: result.rewrite_strict,
      final_decision: result.final_decision,
    },
    null,
    2,
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

reviewButton.addEventListener("click", () => {
  const text = textInput.value.trim();
  if (!text) {
    textInput.focus();
    return;
  }
  renderResult(reviewText(text), text);
});

clearButton.addEventListener("click", () => {
  textInput.value = "";
  riskCard.className = "risk-card low";
  riskLevel.textContent = "等待审核";
  decision.textContent = "输入话术后开始检测";
  hitWords.innerHTML = "<em>暂无</em>";
  reason.textContent = "暂无审核结果。";
  rewriteSafe.textContent = "审核后生成。";
  rewriteConversion.textContent = "审核后生成。";
  rewriteStrict.textContent = "审核后生成。";
  jsonOutput.textContent = "{}";
});

sampleButton.addEventListener("click", () => {
  textInput.value = sampleText;
  renderResult(reviewText(sampleText), sampleText);
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const id = button.dataset.copy;
    const text = document.querySelector(`#${id}`)?.textContent || "";
    await navigator.clipboard.writeText(text);
    button.textContent = "已复制";
    setTimeout(() => {
      button.textContent = "复制";
    }, 1200);
  });
});
