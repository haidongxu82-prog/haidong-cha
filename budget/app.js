const sampleData = [
  {
    channel: "douyin",
    ad_group: "A",
    date_time: "2026-06-15T09:00:00+08:00",
    impressions: 10000,
    clicks: 500,
    cost: 1000,
    orders: 20,
    gmv: 3000,
  },
  {
    channel: "douyin",
    ad_group: "B",
    date_time: "2026-06-15T09:00:00+08:00",
    impressions: 8000,
    clicks: 300,
    cost: 800,
    orders: 5,
    gmv: 500,
  },
  {
    channel: "taobao",
    ad_group: "民族风连衣裙-拉新",
    date_time: "2026-06-15T09:00:00+08:00",
    impressions: 22000,
    clicks: 1320,
    cost: 2600,
    orders: 58,
    gmv: 7200,
  },
  {
    channel: "google",
    ad_group: "brand-search",
    date_time: "2026-06-15T09:00:00+08:00",
    impressions: 6000,
    clicks: 420,
    cost: 900,
    orders: 18,
    gmv: 1700,
  },
  {
    channel: "meta",
    ad_group: "中老年穿搭素材-测试",
    date_time: "2026-06-15T09:00:00+08:00",
    impressions: 18000,
    clicks: 540,
    cost: 1600,
    orders: 8,
    gmv: 1200,
  },
];

const dataInput = document.querySelector("#dataInput");
const calculateButton = document.querySelector("#calculateButton");
const clearButton = document.querySelector("#clearButton");
const sampleButton = document.querySelector(".sample-button");
const resultRows = document.querySelector("#resultRows");
const channelSummary = document.querySelector("#channelSummary");
const jsonOutput = document.querySelector("#jsonOutput");
const totalCostEl = document.querySelector("#totalCost");
const totalGmvEl = document.querySelector("#totalGmv");
const overallRoiEl = document.querySelector("#overallRoi");

function safeDivide(numerator, denominator) {
  return denominator ? numerator / denominator : 0;
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function money(value) {
  return Number(value || 0).toLocaleString("zh-CN", {
    maximumFractionDigits: 0,
  });
}

function percent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

function normalizeRow(row) {
  return {
    channel: String(row.channel || "unknown"),
    ad_group: String(row.ad_group || "unknown"),
    date_time: row.date_time || new Date().toISOString(),
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    cost: Number(row.cost || 0),
    orders: Number(row.orders || 0),
    gmv: Number(row.gmv || 0),
  };
}

function calculateMetrics(row) {
  return {
    ctr: round(safeDivide(row.clicks, row.impressions)),
    cpc: round(safeDivide(row.cost, row.clicks), 2),
    cvr: round(safeDivide(row.orders, row.clicks)),
    cpa: round(safeDivide(row.cost, row.orders), 2),
    roi: round(safeDivide(row.gmv, row.cost), 4),
  };
}

function recommend(metrics) {
  if (metrics.roi >= 2 && metrics.cvr >= 0.03) {
    return {
      action: "increase_budget",
      ratio: 1.2,
      label: "扩量",
      reason: "ROI ≥ 2.0 且 CVR ≥ 3%，具备扩量条件。",
    };
  }
  if (metrics.roi >= 1 && metrics.roi < 2) {
    return {
      action: "keep",
      ratio: 1.0,
      label: "维持",
      reason: "ROI 处于 1.0 到 2.0 区间，建议继续观察。",
    };
  }
  return {
    action: "decrease_budget",
    ratio: 0.7,
    label: "降预算",
    reason: "ROI < 1.0，当前投入产出不足。",
  };
}

function summarizeByChannel(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.channel)) {
      map.set(item.channel, {
        channel: item.channel,
        total_cost: 0,
        total_gmv: 0,
        impressions: 0,
        clicks: 0,
        orders: 0,
        recommended_budget_ratio_sum: 0,
        ad_group_count: 0,
      });
    }
    const summary = map.get(item.channel);
    summary.total_cost += item.cost;
    summary.total_gmv += item.gmv;
    summary.impressions += item.impressions;
    summary.clicks += item.clicks;
    summary.orders += item.orders;
    summary.recommended_budget_ratio_sum += item.recommendation.ratio;
    summary.ad_group_count += 1;
  }

  return [...map.values()].map((summary) => {
    const roi = round(safeDivide(summary.total_gmv, summary.total_cost), 4);
    const avgRatio = round(safeDivide(summary.recommended_budget_ratio_sum, summary.ad_group_count), 2);
    return {
      channel: summary.channel,
      total_cost: round(summary.total_cost, 2),
      total_gmv: round(summary.total_gmv, 2),
      average_roi: roi,
      recommended_budget_ratio: avgRatio,
      recommended_budget_change:
        avgRatio > 1 ? "increase" : avgRatio < 1 ? "decrease" : "keep",
    };
  });
}

function calculate(data) {
  const rows = data.map(normalizeRow);
  const adGroups = rows.map((row) => {
    const metrics = calculateMetrics(row);
    return {
      ...row,
      metrics,
      recommendation: recommend(metrics),
    };
  });
  const channel_summary = summarizeByChannel(adGroups);
  const totals = {
    total_cost: round(adGroups.reduce((sum, item) => sum + item.cost, 0), 2),
    total_gmv: round(adGroups.reduce((sum, item) => sum + item.gmv, 0), 2),
  };
  totals.overall_roi = round(safeDivide(totals.total_gmv, totals.total_cost), 4);

  return {
    generated_at: new Date().toISOString(),
    totals,
    ad_groups: adGroups.map((item) => ({
      channel: item.channel,
      ad_group: item.ad_group,
      metrics: item.metrics,
      recommendation: {
        action: item.recommendation.action,
        ratio: item.recommendation.ratio,
        reason: item.recommendation.reason,
      },
    })),
    channel_summary,
  };
}

function parseInput() {
  const raw = dataInput.value.trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("输入必须是 JSON 数组。");
  }
  return parsed;
}

function actionClass(action) {
  return {
    increase_budget: "increase",
    keep: "keep",
    decrease_budget: "decrease",
  }[action] || "keep";
}

function actionLabel(action) {
  return {
    increase_budget: "扩量 1.2x",
    keep: "维持 1.0x",
    decrease_budget: "降预算 0.7x",
  }[action] || action;
}

function render(result) {
  totalCostEl.textContent = money(result.totals.total_cost);
  totalGmvEl.textContent = money(result.totals.total_gmv);
  overallRoiEl.textContent = result.totals.overall_roi.toFixed(2);

  resultRows.innerHTML = result.ad_groups
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.channel)}</td>
          <td>${escapeHtml(item.ad_group)}</td>
          <td>${percent(item.metrics.ctr)}</td>
          <td>${percent(item.metrics.cvr)}</td>
          <td>${item.metrics.roi.toFixed(2)}</td>
          <td><span class="badge ${actionClass(item.recommendation.action)}">${actionLabel(item.recommendation.action)}</span></td>
        </tr>
      `,
    )
    .join("");

  channelSummary.innerHTML = result.channel_summary
    .map(
      (item) => `
        <article>
          <span>${escapeHtml(item.channel)}</span>
          <p>总花费 ${money(item.total_cost)}，总 GMV ${money(item.total_gmv)}，平均 ROI ${item.average_roi.toFixed(2)}。</p>
          <p>推荐预算变化：${item.recommended_budget_change}，综合比例 ${item.recommended_budget_ratio}x。</p>
        </article>
      `,
    )
    .join("");

  jsonOutput.textContent = JSON.stringify(result, null, 2);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function runCalculate() {
  try {
    const data = parseInput();
    render(calculate(data));
  } catch (error) {
    resultRows.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

sampleButton.addEventListener("click", () => {
  dataInput.value = JSON.stringify(sampleData, null, 2);
  render(calculate(sampleData));
});

calculateButton.addEventListener("click", runCalculate);

clearButton.addEventListener("click", () => {
  dataInput.value = "";
  resultRows.innerHTML = '<tr><td colspan="6">等待计算。</td></tr>';
  channelSummary.innerHTML = "<article><span>暂无数据</span><p>填入广告数据后生成渠道报表。</p></article>";
  jsonOutput.textContent = "{}";
  totalCostEl.textContent = "0";
  totalGmvEl.textContent = "0";
  overallRoiEl.textContent = "0.00";
});

dataInput.value = JSON.stringify(sampleData.slice(0, 2), null, 2);
