const sampleData = {
  images: [
    "https://example.com/white-bg-floral-dress-french-blue.jpg",
    "https://example.com/main-image-slim-waist-chiffon-dress.jpg"
  ]
};

const platformItems = [
  {
    platform: "douyin",
    title: "法式碎花裙夏季显瘦，一条拍出旅行感",
    url: "https://douyin.example.com/video/1001",
    likes: 12800,
    sales: 860,
    comments: 1320,
    tags: ["强视觉", "显瘦", "旅行场景"]
  },
  {
    platform: "douyin",
    title: "中年妈妈穿这条碎花裙，腰线真的很重要",
    url: "https://douyin.example.com/video/1002",
    likes: 8600,
    sales: 520,
    comments: 970,
    tags: ["人群精准", "痛点明确"]
  },
  {
    platform: "xiaohongshu",
    title: "微胖也能穿的法式碎花裙，拍照很出片",
    url: "https://xiaohongshu.example.com/note/2001",
    likes: 5300,
    sales: 0,
    comments: 620,
    favorites: 2100,
    tags: ["种草笔记", "场景感"]
  },
  {
    platform: "xiaohongshu",
    title: "蓝白碎花裙合集，温柔但不装嫩",
    url: "https://xiaohongshu.example.com/note/2002",
    likes: 3900,
    sales: 0,
    comments: 480,
    favorites: 1600,
    tags: ["合集", "颜色趋势"]
  },
  {
    platform: "tmall",
    title: "法式收腰雪纺连衣裙 女夏季",
    url: "https://tmall.example.com/item/3001",
    likes: 0,
    sales: 2600,
    comments: 840,
    tags: ["销量验证", "搜索款"]
  },
  {
    platform: "tmall",
    title: "蓝色碎花连衣裙中长款",
    url: "https://tmall.example.com/item/3002",
    likes: 0,
    sales: 1700,
    comments: 520,
    tags: ["同款结构", "价格带参考"]
  }
];

const dataInput = document.querySelector("#dataInput");
const sampleButton = document.querySelector(".sample-button");
const analyzeButton = document.querySelector("#analyzeButton");
const clearButton = document.querySelector("#clearButton");
const copyJson = document.querySelector("#copyJson");
const categoryLabel = document.querySelector("#categoryLabel");
const keywordCount = document.querySelector("#keywordCount");
const materialCount = document.querySelector("#materialCount");
const profileOutput = document.querySelector("#profileOutput");
const materialRows = document.querySelector("#materialRows");
const keywordRows = document.querySelector("#keywordRows");
const jsonOutput = document.querySelector("#jsonOutput");

function parseInput() {
  const raw = dataInput.value.trim();
  if (!raw) throw new Error("请先输入图片 JSON。");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.images) || parsed.images.length === 0) {
    throw new Error("输入必须包含 images 数组。");
  }
  return parsed;
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function recognizeProduct(images) {
  const text = images.join(" ").toLowerCase();
  const category = includesAny(text, ["dress", "skirt", "连衣裙", "裙"]) ? "连衣裙" : "服饰";
  const styleTags = [
    includesAny(text, ["french", "法式"]) ? "法式" : null,
    includesAny(text, ["floral", "flower", "碎花"]) ? "碎花" : null,
    includesAny(text, ["slim", "waist", "收腰", "显瘦"]) ? "收腰显瘦" : null,
    includesAny(text, ["travel", "旅行"]) ? "旅行拍照" : null,
  ].filter(Boolean);
  const color = [
    includesAny(text, ["white", "白"]) ? "白色" : null,
    includesAny(text, ["blue", "蓝"]) ? "蓝色" : null,
  ].filter(Boolean);
  const materialGuess = includesAny(text, ["chiffon", "雪纺"]) ? ["雪纺"] : ["轻薄面料"];
  const normalizedTags = styleTags.length ? styleTags : ["日常", "显瘦"];

  return {
    category,
    style_tags: normalizedTags,
    color: color.length ? color : ["浅色"],
    material_guess: materialGuess,
    embedding: [0.21, 0.38, 0.56, 0.72, 0.44],
  };
}

function buildKeywords(profile) {
  const base = [
    [profile.style_tags[0], profile.style_tags[1], profile.category].filter(Boolean).join(" "),
    [profile.color[0], profile.style_tags[0], profile.category].filter(Boolean).join(" "),
    [profile.category, "显瘦", "爆款"].join(" "),
    [profile.category, "小红书", "种草"].join(" "),
    [profile.category, "抖音", "同款"].join(" "),
  ];
  return [...new Set(base.filter(Boolean))];
}

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function scoreItems(items) {
  const likes = items.map((item) => Number(item.likes || item.favorites || 0));
  const comments = items.map((item) => Number(item.comments || 0));
  const sales = items.map((item) => Number(item.sales || 0));
  const minLikes = Math.min(...likes);
  const maxLikes = Math.max(...likes);
  const minComments = Math.min(...comments);
  const maxComments = Math.max(...comments);
  const minSales = Math.min(...sales);
  const maxSales = Math.max(...sales);

  return items
    .map((item) => {
      const likeValue = Number(item.likes || item.favorites || 0);
      const score =
        normalize(likeValue, minLikes, maxLikes) * 0.4 +
        normalize(Number(item.comments || 0), minComments, maxComments) * 0.2 +
        normalize(Number(item.sales || 0), minSales, maxSales) * 0.4;
      return {
        ...item,
        hot_score: Number(score.toFixed(4)),
        level: score >= 0.8 ? "爆款" : score >= 0.5 ? "潜力款" : "普通",
      };
    })
    .sort((a, b) => b.hot_score - a.hot_score);
}

function runSearch(input) {
  const product = recognizeProduct(input.images);
  const keywords = buildKeywords(product);
  const hotMaterials = scoreItems(platformItems);
  return {
    generated_at: new Date().toISOString(),
    product,
    keywords,
    risk_control: {
      douyin: { use_rpa: true, rate_limit: true },
      xiaohongshu: { use_rpa: true, rate_limit: true },
      sales_data: { require_validation: true },
    },
    top_items: hotMaterials.map((item) => ({
      platform: item.platform,
      title: item.title,
      url: item.url,
      likes: item.likes,
      sales: item.sales,
      comments: item.comments,
      hot_score: item.hot_score,
      level: item.level,
      reason_tags: item.tags,
    })),
  };
}

function render(result) {
  categoryLabel.textContent = result.product.category;
  keywordCount.textContent = String(result.keywords.length);
  materialCount.textContent = String(result.top_items.length);
  profileOutput.innerHTML = `
    <p>类目：${escapeHtml(result.product.category)}</p>
    <p>颜色：${result.product.color.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</p>
    <p>风格：${result.product.style_tags.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</p>
    <p>材质推测：${result.product.material_guess.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</p>
  `;
  materialRows.innerHTML = result.top_items
    .map(
      (item) => `
        <article class="table-row">
          <strong>${escapeHtml(item.platform)}</strong>
          <span>${escapeHtml(item.title)}<br><small>${escapeHtml(item.url)}</small></span>
          <span>赞 ${num(item.likes)} / 评 ${num(item.comments)} / 销 ${num(item.sales)}</span>
          <span><strong>${item.hot_score.toFixed(2)}</strong><br>${escapeHtml(item.level)}</span>
          <span>${item.reason_tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</span>
        </article>
      `,
    )
    .join("");
  keywordRows.innerHTML = result.keywords.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  jsonOutput.textContent = JSON.stringify(result, null, 2);
}

function analyze() {
  try {
    render(runSearch(parseInput()));
  } catch (error) {
    profileOutput.textContent = `检索失败：${error.message}`;
    materialRows.innerHTML = "";
    keywordRows.innerHTML = "";
    jsonOutput.textContent = "{}";
  }
}

function num(value) {
  return Number(value || 0).toLocaleString("zh-CN");
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
  categoryLabel.textContent = "-";
  keywordCount.textContent = "0";
  materialCount.textContent = "0";
  profileOutput.textContent = "等待检索。";
  materialRows.innerHTML = "";
  keywordRows.innerHTML = "";
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
