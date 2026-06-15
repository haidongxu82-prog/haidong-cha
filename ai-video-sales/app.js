const sampleData = {
  product_name: "中老年民族风刺绣外套",
  product_features: ["宽松显瘦", "刺绣细节", "适合旅行拍照", "春秋可穿"],
  target_audience: "45-65岁喜欢民族风、旅行穿搭和舒适面料的女性",
  price_range: "199-299",
  platform: "douyin",
  template_type: "storytelling",
};

const templates = {
  hook_fast: {
    template_id: "tpl_hook_fast_001",
    assets_required: ["product_image", "try_on_video", "price_card"],
    transition_map: ["hard_cut", "zoom_in", "flash_text"],
  },
  comparison: {
    template_id: "tpl_comparison_001",
    assets_required: ["before_after", "product_image", "detail_shot"],
    transition_map: ["split_screen", "wipe", "detail_zoom"],
  },
  storytelling: {
    template_id: "tpl_storytelling_001",
    assets_required: ["product_image", "lifestyle_video", "detail_shot", "user_scene"],
    transition_map: ["soft_cut", "push_in", "warm_end_card"],
  },
};

const dataInput = document.querySelector("#dataInput");
const sampleButton = document.querySelector(".sample-button");
const generateButton = document.querySelector("#generateButton");
const clearButton = document.querySelector("#clearButton");
const copyJson = document.querySelector("#copyJson");
const platformLabel = document.querySelector("#platformLabel");
const templateLabel = document.querySelector("#templateLabel");
const actionCount = document.querySelector("#actionCount");
const scriptOutput = document.querySelector("#scriptOutput");
const sceneRows = document.querySelector("#sceneRows");
const dslRows = document.querySelector("#dslRows");
const jsonOutput = document.querySelector("#jsonOutput");

function parseInput() {
  const raw = dataInput.value.trim();
  if (!raw) throw new Error("请先输入产品信息 JSON。");
  const parsed = JSON.parse(raw);
  if (!parsed.product_name) throw new Error("缺少 product_name。");
  return {
    product_name: parsed.product_name,
    product_features: Array.isArray(parsed.product_features) ? parsed.product_features : [],
    target_audience: parsed.target_audience || "目标用户",
    price_range: parsed.price_range || "未设置",
    platform: parsed.platform || "douyin",
    template_type: parsed.template_type || "hook_fast",
  };
}

function generateScript(input) {
  const featureText = input.product_features.join("、") || "核心卖点";
  const isDouyin = input.platform === "douyin";
  const tone = isDouyin ? "emotional" : "rational";
  return {
    title_options: [
      `${input.product_name}，适合妈妈辈的舒服穿搭`,
      `旅行拍照想显气质，可以看看这件`,
      `不是夸张风，是真正日常能穿的民族风外套`,
    ],
    hook: `别急着买民族风外套，先看它是不是舒服、显气质、日常能穿。`,
    script: {
      opening: `很多${input.target_audience}，不是不喜欢民族风，是怕买回来太夸张。`,
      pain_point: `普通款没特色，太花的又不好日常穿。`,
      solution: `这件${input.product_name}主打${featureText}，适合旅行、聚会和日常外穿。`,
      proof: `版型宽松，刺绣在视觉重点位置，拍照有细节，平时穿也不突兀。`,
      cta: `喜欢这种低调民族风的，可以先看尺码和颜色。`,
    },
    scene_by_scene: [
      {
        time: "0-3s",
        visual: "模特快速上身，镜头从整体推近到刺绣细节",
        text: "民族风别乱买，先看日常能不能穿",
        voiceover: "别急着买民族风外套，先看它日常好不好穿。",
      },
      {
        time: "3-8s",
        visual: "展示普通外套与刺绣外套对比",
        text: "太素没特点，太花又压人",
        voiceover: "很多人怕的不是民族风，是怕太夸张。",
      },
      {
        time: "8-16s",
        visual: "面料、袖口、领口、刺绣细节特写",
        text: featureText,
        voiceover: `这件重点在${featureText}，看起来有细节，穿起来不累赘。`,
      },
      {
        time: "16-24s",
        visual: "旅行、饭局、日常出门三个场景切换",
        text: "旅行拍照 / 日常外穿 / 聚会都能用",
        voiceover: "旅行拍照有氛围，平时穿也不会太抢。",
      },
      {
        time: "24-30s",
        visual: "尺码卡 + 颜色卡 + 商品近景",
        text: "先看尺码和颜色",
        voiceover: "喜欢这种低调民族风的，先看尺码和颜色。",
      },
    ],
    hashtags: ["民族风穿搭", "妈妈装", "旅行穿搭", "中老年女装", "刺绣外套"],
    tone,
  };
}

function mapTemplate(input, script) {
  const template = templates[input.template_type] || templates.hook_fast;
  return {
    template_id: template.template_id,
    template_type: input.template_type,
    assets_required: template.assets_required,
    text_overlay: script.scene_by_scene.map((scene) => ({
      time_range: scene.time,
      content: scene.text,
    })),
    transition_map: template.transition_map,
  };
}

function generateEditingDsl(template, script) {
  const actions = [
    {
      type: "set_music",
      mood: script.tone === "emotional" ? "emotional" : "fast",
    },
    ...script.scene_by_scene.flatMap((scene, index) => [
      {
        type: "add_media",
        source: template.assets_required[index % template.assets_required.length],
        time_range: scene.time,
      },
      {
        type: "add_text",
        content: scene.text,
        time_range: scene.time,
      },
      {
        type: "add_voiceover",
        content: scene.voiceover,
        time_range: scene.time,
      },
    ]),
    {
      type: "add_end_card",
      content: "人工审核后发布",
      time_range: "30-32s",
    },
  ];

  return {
    editor: "jianying",
    actions,
    rpa_hook: "export JSON to RPA executor after manual review",
  };
}

function buildPublishTask(input, script) {
  return {
    video_id: `video_${Date.now()}`,
    platforms: [input.platform],
    title_variants: script.title_options,
    publish_time: "manual_review_required",
    guardrails: ["人工审核后发布", "素材需确认可商用", "避免医疗/金融违规承诺"],
  };
}

function buildOptimizationLoop(script) {
  return {
    metrics_to_collect: ["views", "ctr", "avg_watch_time", "conversion_rate"],
    insights: [
      "重点观察 0-3 秒 hook 留存。",
      "如果 CTR 高但转化低，下一轮加强尺码、场景和信任证明。",
      "如果完播低，压缩中段细节展示，提前出现上身效果。",
    ],
    next_script_rules: [
      `保留标题方向：${script.title_options[0]}`,
      "下一轮至少测试 2 个不同 hook。",
      "每条视频只讲 1 个核心转化点。",
    ],
  };
}

function runFactory(input) {
  const script = generateScript(input);
  const template = mapTemplate(input, script);
  const editing_dsl = generateEditingDsl(template, script);
  const publish_task = buildPublishTask(input, script);
  return {
    generated_at: new Date().toISOString(),
    input,
    script,
    template,
    editing_dsl,
    publish_task,
    optimization_loop: buildOptimizationLoop(script),
  };
}

function render(result) {
  platformLabel.textContent = result.input.platform;
  templateLabel.textContent = result.template.template_type;
  actionCount.textContent = String(result.editing_dsl.actions.length);
  scriptOutput.innerHTML = `
    <strong>Hook</strong>
    <p>${escapeHtml(result.script.hook)}</p>
    <strong>脚本结构</strong>
    <p>${Object.entries(result.script.script)
      .map(([key, value]) => `${key}: ${value}`)
      .map(escapeHtml)
      .join("<br>")}</p>
    <strong>标题</strong>
    <p>${result.script.title_options.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</p>
    <strong>标签</strong>
    <p>${result.script.hashtags.map((item) => `<span class="tag">#${escapeHtml(item)}</span>`).join("")}</p>
  `;
  sceneRows.innerHTML = result.script.scene_by_scene
    .map(
      (scene) => `
        <article class="table-row">
          <strong>${escapeHtml(scene.time)}</strong>
          <span>${escapeHtml(scene.visual)}</span>
          <span>${escapeHtml(scene.text)}</span>
          <span>${escapeHtml(scene.voiceover)}</span>
        </article>
      `,
    )
    .join("");
  dslRows.innerHTML = result.editing_dsl.actions
    .slice(0, 8)
    .map(
      (action) => `
        <article>
          <strong>${escapeHtml(action.type)}</strong>
          <span>${escapeHtml(action.content || action.source || action.mood || "")}</span>
        </article>
      `,
    )
    .join("");
  jsonOutput.textContent = JSON.stringify(result, null, 2);
}

function generate() {
  try {
    render(runFactory(parseInput()));
  } catch (error) {
    scriptOutput.textContent = `生成失败：${error.message}`;
    sceneRows.innerHTML = "";
    dslRows.innerHTML = "";
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

generateButton.addEventListener("click", generate);

clearButton.addEventListener("click", () => {
  dataInput.value = "";
  platformLabel.textContent = "-";
  templateLabel.textContent = "-";
  actionCount.textContent = "0";
  scriptOutput.textContent = "等待生成。";
  sceneRows.innerHTML = "";
  dslRows.innerHTML = "";
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
generate();
