const sampleData = {
  date: "2026-06-15",
  slot_duration_hours: 1,
  groups: [
    {
      group_id: "A",
      host_name: "阿岚组",
      avg_gmv: 36000,
      peak_gmv: 62000,
      stability_score: 0.88,
      max_daily_hours: 3,
      unavailable: ["14:00-15:00"],
      min_rest_slots: 1,
      preferred_slots: ["20:00-21:00", "21:00-22:00"],
    },
    {
      group_id: "B",
      host_name: "小乔组",
      avg_gmv: 28000,
      peak_gmv: 48000,
      stability_score: 0.74,
      max_daily_hours: 3,
      unavailable: ["10:00-11:00"],
      min_rest_slots: 1,
      preferred_slots: ["15:00-16:00", "16:00-17:00"],
    },
    {
      group_id: "C",
      host_name: "民族风专场组",
      avg_gmv: 42000,
      peak_gmv: 71000,
      stability_score: 0.81,
      max_daily_hours: 4,
      unavailable: [],
      min_rest_slots: 1,
      preferred_slots: ["19:00-20:00", "20:00-21:00"],
    },
  ],
  slots: [
    { slot_id: "10:00-11:00", uv: 4200, gmv: 22000, conversion_rate: 0.028, is_promo: false },
    { slot_id: "14:00-15:00", uv: 5200, gmv: 26000, conversion_rate: 0.031, is_promo: false },
    { slot_id: "15:00-16:00", uv: 6500, gmv: 32000, conversion_rate: 0.034, is_promo: true },
    { slot_id: "16:00-17:00", uv: 6100, gmv: 30000, conversion_rate: 0.032, is_promo: false },
    { slot_id: "19:00-20:00", uv: 9800, gmv: 56000, conversion_rate: 0.044, is_promo: true },
    { slot_id: "20:00-21:00", uv: 12800, gmv: 76000, conversion_rate: 0.052, is_promo: true },
    { slot_id: "21:00-22:00", uv: 11200, gmv: 69000, conversion_rate: 0.049, is_promo: false },
  ],
};

const dataInput = document.querySelector("#dataInput");
const sampleButton = document.querySelector(".sample-button");
const scheduleButton = document.querySelector("#scheduleButton");
const clearButton = document.querySelector("#clearButton");
const dateLabel = document.querySelector("#dateLabel");
const gmvLabel = document.querySelector("#gmvLabel");
const conflictLabel = document.querySelector("#conflictLabel");
const scheduleRows = document.querySelector("#scheduleRows");
const scoreRows = document.querySelector("#scoreRows");
const jsonOutput = document.querySelector("#jsonOutput");

function minMax(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function normalizeCollection(items, key) {
  const values = items.map((item) => Number(item[key] || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return new Map(items.map((item) => [item, minMax(Number(item[key] || 0), min, max)]));
}

function money(value) {
  return Number(value || 0).toLocaleString("zh-CN", {
    maximumFractionDigits: 0,
  });
}

function parseInput() {
  const raw = dataInput.value.trim();
  if (!raw) throw new Error("请先输入排班数据 JSON。");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.groups) || !Array.isArray(parsed.slots)) {
    throw new Error("输入必须包含 groups 和 slots。");
  }
  return parsed;
}

function getSlotIndex(slots, slotId) {
  return slots.findIndex((slot) => slot.slot_id === slotId);
}

function buildScoreMatrix(data) {
  const uvScore = normalizeCollection(data.slots, "uv");
  const gmvScore = normalizeCollection(data.slots, "gmv");
  const cvrScore = normalizeCollection(data.slots, "conversion_rate");
  const avgScore = normalizeCollection(data.groups, "avg_gmv");
  const peakScore = normalizeCollection(data.groups, "peak_gmv");

  const rows = [];
  for (const group of data.groups) {
    const groupScore =
      avgScore.get(group) * 0.52 +
      peakScore.get(group) * 0.26 +
      Number(group.stability_score || 0) * 0.22;

    for (const slot of data.slots) {
      const slotValue =
        uvScore.get(slot) * 0.4 +
        gmvScore.get(slot) * 0.42 +
        cvrScore.get(slot) * 0.18 +
        (slot.is_promo ? 0.06 : 0);
      const preference = group.preferred_slots?.includes(slot.slot_id) ? 0.08 : 0;
      const score = Math.min(1, slotValue * groupScore + preference);
      const predictedGmv = slot.gmv * (0.62 + groupScore * 0.66);

      rows.push({
        group_id: group.group_id,
        host_name: group.host_name,
        slot_id: slot.slot_id,
        score: Number(score.toFixed(4)),
        predicted_gmv: Math.round(predictedGmv),
        explanation: `${group.host_name} 在该时段综合得分 ${(score * 100).toFixed(1)}，时段流量 ${money(slot.uv)} UV。`,
      });
    }
  }
  return rows.sort((a, b) => b.score - a.score);
}

function violatesRest(group, slotId, picked, slots) {
  const currentIndex = getSlotIndex(slots, slotId);
  const rest = Number(group.min_rest_slots || 0);
  return picked.some((item) => {
    if (item.group_id !== group.group_id) return false;
    const pickedIndex = getSlotIndex(slots, item.slot_id);
    return Math.abs(currentIndex - pickedIndex) <= rest;
  });
}

function generateSchedule(data, scoreMatrix) {
  const picked = [];
  const usedSlots = new Set();
  const hoursByGroup = new Map(data.groups.map((group) => [group.group_id, 0]));
  const conflicts = [];

  for (const candidate of scoreMatrix) {
    const group = data.groups.find((item) => item.group_id === candidate.group_id);
    if (!group) continue;

    if (usedSlots.has(candidate.slot_id)) {
      continue;
    }
    if (group.unavailable?.includes(candidate.slot_id)) {
      conflicts.push(`${group.host_name} 不可用：${candidate.slot_id}`);
      continue;
    }
    const nextHours = hoursByGroup.get(group.group_id) + Number(data.slot_duration_hours || 1);
    if (nextHours > Number(group.max_daily_hours || 0)) {
      conflicts.push(`${group.host_name} 超出每日时长限制`);
      continue;
    }
    if (violatesRest(group, candidate.slot_id, picked, data.slots)) {
      conflicts.push(`${group.host_name} 与相邻档期休息间隔不足`);
      continue;
    }

    picked.push(candidate);
    usedSlots.add(candidate.slot_id);
    hoursByGroup.set(group.group_id, nextHours);
  }

  const sortedSchedule = [...picked].sort(
    (a, b) => getSlotIndex(data.slots, a.slot_id) - getSlotIndex(data.slots, b.slot_id),
  );
  return {
    date: data.date || new Date().toISOString().slice(0, 10),
    schedule: sortedSchedule,
    total_expected_gmv: sortedSchedule.reduce((sum, item) => sum + item.predicted_gmv, 0),
    conflicts: [...new Set(conflicts)].slice(0, 8),
  };
}

function runScheduler(data) {
  const scoreMatrix = buildScoreMatrix(data);
  const schedule = generateSchedule(data, scoreMatrix);
  return {
    generated_at: new Date().toISOString(),
    date: schedule.date,
    total_expected_gmv: schedule.total_expected_gmv,
    schedule: schedule.schedule.map((item) => ({
      slot: item.slot_id,
      group_id: item.group_id,
      group: item.host_name,
      predicted_gmv: item.predicted_gmv,
      score: item.score,
      explanation: item.explanation,
    })),
    conflicts: schedule.conflicts,
    score_matrix_top: scoreMatrix.slice(0, 8),
    review: {
      approved: false,
      modified_slots: [],
      note: "MVP 输出为待人工审核排班，不自动发布。",
    },
  };
}

function render(result) {
  dateLabel.textContent = result.date;
  gmvLabel.textContent = money(result.total_expected_gmv);
  conflictLabel.textContent = String(result.conflicts.length);
  scheduleRows.innerHTML = result.schedule
    .map(
      (item) => `
        <article class="table-row">
          <strong>${escapeHtml(item.slot)}</strong>
          <span><span class="badge">${escapeHtml(item.group)}</span></span>
          <span>${money(item.predicted_gmv)}</span>
          <span>${escapeHtml(item.explanation)}</span>
        </article>
      `,
    )
    .join("");

  scoreRows.innerHTML = result.score_matrix_top
    .map(
      (item) => `
        <article>
          <strong>${escapeHtml(item.host_name)} · ${escapeHtml(item.slot_id)}</strong>
          <span>score ${item.score.toFixed(2)} · predicted GMV ${money(item.predicted_gmv)}</span>
        </article>
      `,
    )
    .join("");

  jsonOutput.textContent = JSON.stringify(result, null, 2);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function schedule() {
  try {
    render(runScheduler(parseInput()));
  } catch (error) {
    scheduleRows.innerHTML = `<article class="table-row"><strong>解析失败</strong><span>${escapeHtml(error.message)}</span><span>-</span><span>请检查 JSON 格式。</span></article>`;
    scoreRows.innerHTML = "";
    jsonOutput.textContent = "{}";
  }
}

sampleButton.addEventListener("click", () => {
  dataInput.value = JSON.stringify(sampleData, null, 2);
  schedule();
});

scheduleButton.addEventListener("click", schedule);

clearButton.addEventListener("click", () => {
  dataInput.value = "";
  dateLabel.textContent = "-";
  gmvLabel.textContent = "0";
  conflictLabel.textContent = "0";
  scheduleRows.innerHTML = "";
  scoreRows.innerHTML = "";
  jsonOutput.textContent = "{}";
});

dataInput.value = JSON.stringify(sampleData, null, 2);
schedule();
