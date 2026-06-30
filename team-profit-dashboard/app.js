(() => {
  const STORAGE_KEY = "team-profit-dashboard:main-site:v1";
  const statusMeta = {
    leading: { label: "领先", color: "#34d399" },
    normal: { label: "正常", color: "#38bdf8" },
    lagging: { label: "落后", color: "#f59e0b" },
    danger: { label: "危险", color: "#fb7185" },
  };
  const fields = [
    ["date", "日期", true, ["日期", "下单日期", "支付日期", "统计日期", "date"]],
    ["teamName", "团队名称", true, ["团队名称", "团队", "小组", "部门", "team"]],
    ["shopName", "店铺名称", false, ["店铺名称", "店铺", "店铺名", "shop"]],
    ["grossSalesAmount", "成交金额", true, ["成交金额", "支付金额", "销售额", "GMV", "gross"]],
    ["refundAmount", "退款金额", false, ["退款金额", "售后退款", "refund"]],
    ["costAmount", "成本金额", false, ["成本金额", "商品成本", "成本", "cost"]],
    ["shippingFee", "运费", false, ["运费", "物流费", "快递费", "shipping"]],
    ["platformFee", "平台扣点", false, ["平台扣点", "平台服务费", "技术服务费", "platform"]],
    ["adCost", "广告费", false, ["广告费", "投流费用", "千川消耗", "ad"]],
    ["influencerCommission", "达人佣金", false, ["达人佣金", "佣金", "联盟佣金", "commission"]],
    ["orderCount", "订单数", false, ["订单数", "成交订单数", "支付订单数", "orders"]],
    ["refundOrderCount", "退款订单数", false, ["退款订单数", "售后订单数", "refund orders"]],
  ];

  let state = load();
  let currentView = "dashboard";
  let parsedFile = null;
  let fieldMapping = {};

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  }

  function today() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const pick = (type) => parts.find((item) => item.type === type)?.value;
    return `${pick("year")}-${pick("month")}-${pick("day")}`;
  }

  function currentMonth() {
    return today().slice(0, 7);
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {}
    return sampleData();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function sampleData(month = currentMonth()) {
    const blueprints = [
      ["增长一组", "林佳", 120000, 3210, 13800],
      ["内容二组", "周宁", 100000, 2240, 11200],
      ["店播三组", "陈默", 90000, 2660, 12600],
      ["新品孵化组", "许清", 60000, 1360, 7600],
    ];
    const teams = blueprints.map(([name, leaderName]) => ({ id: uid("team"), name, leaderName }));
    const targets = teams.map((team, index) => ({ id: uid("target"), teamId: team.id, month, profitTarget: blueprints[index][2] }));
    const days = Math.min(Math.max(elapsedDays(month), 20), daysInMonth(month));
    const records = [];
    teams.forEach((team, teamIndex) => {
      const [, , , profitBase, salesBase] = blueprints[teamIndex];
      for (let i = 1; i <= days; i += 1) {
        const wave = Math.sin((i + teamIndex) / 3) * 0.12;
        const lift = i % 6 === 0 || i % 7 === 0 ? 0.1 : 0;
        const grossSalesAmount = Math.round(salesBase * (1 + wave + lift));
        const refundAmount = Math.round(grossSalesAmount * (0.045 + ((i + teamIndex) % 5) * 0.006));
        const shippingFee = Math.round(grossSalesAmount * 0.027);
        const platformFee = Math.round(grossSalesAmount * 0.035);
        const adCost = Math.round(grossSalesAmount * (teamIndex === 1 ? 0.075 : 0.052));
        const influencerCommission = Math.round(grossSalesAmount * (teamIndex === 2 ? 0.04 : 0.025));
        const targetProfit = Math.round(profitBase * (1 + wave + lift));
        const costAmount = Math.max(0, grossSalesAmount - refundAmount - shippingFee - platformFee - adCost - influencerCommission - targetProfit);
        records.push(buildRecord({
          date: `${month}-${String(i).padStart(2, "0")}`,
          teamName: team.name,
          shopName: `${team.name}旗舰店`,
          grossSalesAmount,
          refundAmount,
          costAmount,
          shippingFee,
          platformFee,
          adCost,
          influencerCommission,
          orderCount: Math.round(grossSalesAmount / 188),
          refundOrderCount: Math.round(refundAmount / 188),
        }, team.id));
      }
    });
    return { teams, targets, records };
  }

  function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const raw = String(value ?? "").trim();
    const negative = raw.startsWith("(") && raw.endsWith(")");
    const cleaned = raw.replace(/[,，¥￥%\s]/g, "").replace(/[()]/g, "");
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return 0;
    return negative ? -Math.abs(parsed) : parsed;
  }

  function normalizeDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    if (typeof value === "number" && Number.isFinite(value)) return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10);
    const text = String(value ?? "").trim();
    const normalized = text.replace(/[年月.]/g, "-").replace(/日/g, "").replace(/\//g, "-").replace(/\s.+$/, "");
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : "";
  }

  function calc(input) {
    const grossSalesAmount = toNumber(input.grossSalesAmount);
    const refundAmount = toNumber(input.refundAmount);
    const costAmount = toNumber(input.costAmount);
    const shippingFee = toNumber(input.shippingFee);
    const platformFee = toNumber(input.platformFee);
    const adCost = toNumber(input.adCost);
    const influencerCommission = toNumber(input.influencerCommission);
    const netSalesAmount = grossSalesAmount - refundAmount;
    const grossProfit = netSalesAmount - costAmount - shippingFee - platformFee;
    const operatingProfit = grossProfit - adCost - influencerCommission;
    return {
      grossSalesAmount,
      refundAmount,
      costAmount,
      shippingFee,
      platformFee,
      adCost,
      influencerCommission,
      orderCount: toNumber(input.orderCount),
      refundOrderCount: toNumber(input.refundOrderCount),
      netSalesAmount,
      grossProfit,
      operatingProfit,
      refundRate: ratio(refundAmount, grossSalesAmount),
      profitRate: ratio(operatingProfit, netSalesAmount),
    };
  }

  function buildRecord(input, teamId) {
    return { id: uid("record"), date: input.date, teamId, teamName: input.teamName, shopName: input.shopName || "默认店铺", ...calc(input) };
  }

  function aggregate(records) {
    const total = {
      grossSalesAmount: 0, refundAmount: 0, netSalesAmount: 0, costAmount: 0, shippingFee: 0, platformFee: 0,
      adCost: 0, influencerCommission: 0, grossProfit: 0, operatingProfit: 0, orderCount: 0, refundOrderCount: 0,
      refundRate: 0, profitRate: 0,
    };
    records.forEach((record) => {
      Object.keys(total).forEach((key) => {
        if (key !== "refundRate" && key !== "profitRate") total[key] += Number(record[key] || 0);
      });
    });
    total.refundRate = ratio(total.refundAmount, total.grossSalesAmount);
    total.profitRate = ratio(total.operatingProfit, total.netSalesAmount);
    return total;
  }

  function ratio(a, b) {
    return !b ? 0 : a / b;
  }

  function daysInMonth(month) {
    const [year, value] = month.split("-").map(Number);
    return new Date(year, value, 0).getDate();
  }

  function elapsedDays(month) {
    const now = today();
    if (month < now.slice(0, 7)) return daysInMonth(month);
    if (month > now.slice(0, 7)) return 0;
    return Number(now.slice(8, 10));
  }

  function statusFor(completionRate, timeProgress) {
    const delta = completionRate - timeProgress;
    if (delta >= 0.05) return "leading";
    if (delta >= 0) return "normal";
    if (delta >= -0.1) return "lagging";
    return "danger";
  }

  function targetOf(teamId, month) {
    return state.targets.find((target) => target.teamId === teamId && target.month === month)?.profitTarget || 0;
  }

  function monthRecords(month, teamId = "") {
    return state.records.filter((record) => record.date.startsWith(month) && (!teamId || record.teamId === teamId));
  }

  function teamProgress(team, month) {
    const records = monthRecords(month, team.id);
    const metrics = aggregate(records);
    const profitTarget = targetOf(team.id, month);
    const elapsed = elapsedDays(month);
    const totalDays = daysInMonth(month);
    const remainingDays = Math.max(totalDays - elapsed, 0);
    const completionRate = ratio(metrics.operatingProfit, profitTarget);
    const timeProgress = ratio(elapsed, totalDays);
    const remainingTarget = Math.max(profitTarget - metrics.operatingProfit, 0);
    const currentDailyProfit = metrics.operatingProfit / Math.max(elapsed, 1);
    return {
      team,
      ...metrics,
      profitTarget,
      currentProfit: metrics.operatingProfit,
      completionRate,
      timeProgress,
      progressDelta: completionRate - timeProgress,
      remainingTarget,
      remainingDays,
      requiredDailyProfit: remainingDays ? remainingTarget / remainingDays : 0,
      currentDailyProfit,
      projectedMonthProfit: currentDailyProfit * totalDays,
      status: statusFor(completionRate, timeProgress),
    };
  }

  function snapshot(month, teamId = "") {
    const teams = teamId ? state.teams.filter((team) => team.id === teamId) : state.teams;
    const teamIds = new Set(teams.map((team) => team.id));
    const records = monthRecords(month).filter((record) => teamIds.has(record.teamId));
    const metrics = aggregate(records);
    const totalTarget = teams.reduce((sum, team) => sum + targetOf(team.id, month), 0);
    const elapsed = elapsedDays(month);
    const totalDays = daysInMonth(month);
    const remainingDays = Math.max(totalDays - elapsed, 0);
    const completionRate = ratio(metrics.operatingProfit, totalTarget);
    const timeProgress = ratio(elapsed, totalDays);
    const remainingTarget = Math.max(totalTarget - metrics.operatingProfit, 0);
    const currentDailyProfit = metrics.operatingProfit / Math.max(elapsed, 1);
    return {
      teams,
      records,
      metrics,
      totalTarget,
      currentProfit: metrics.operatingProfit,
      completionRate,
      timeProgress,
      progressDelta: completionRate - timeProgress,
      remainingTarget,
      remainingDays,
      requiredDailyProfit: remainingDays ? remainingTarget / remainingDays : 0,
      currentDailyProfit,
      projectedMonthProfit: currentDailyProfit * totalDays,
      projectedCompletionRate: ratio(currentDailyProfit * totalDays, totalTarget),
      status: statusFor(completionRate, timeProgress),
      teamProgress: teams.map((team) => teamProgress(team, month)),
      trend: trend(records, month, totalTarget),
    };
  }

  function trend(records, month, targetTotal) {
    let cumulativeProfit = 0;
    return Array.from({ length: daysInMonth(month) }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, "0")}`;
      const metrics = aggregate(records.filter((record) => record.date === date));
      cumulativeProfit += metrics.operatingProfit;
      return { day: `${index + 1}日`, date, ...metrics, cumulativeProfit, targetCurve: targetTotal ? (targetTotal / daysInMonth(month)) * (index + 1) : 0 };
    });
  }

  function money(value) {
    return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(value || 0);
  }

  function percent(value) {
    return `${((value || 0) * 100).toFixed(1)}%`;
  }

  function signedPercent(value) {
    const num = (value || 0) * 100;
    return `${num >= 0 ? "+" : ""}${num.toFixed(1)}%`;
  }

  function render() {
    renderSelects();
    renderDashboard();
    renderTeams();
    renderTargets();
    renderReport();
  }

  function renderSelects() {
    const month = document.querySelector("#dashboard-month");
    const team = document.querySelector("#dashboard-team");
    const targetMonth = document.querySelector("#target-month");
    const reportMonth = document.querySelector("#report-month");
    const reportDate = document.querySelector("#report-date");
    if (!month.value) month.value = currentMonth();
    if (!targetMonth.value) targetMonth.value = month.value;
    if (!reportMonth.value) reportMonth.value = month.value;
    if (!reportDate.value) reportDate.value = today();
    team.innerHTML = `<option value="">全部团队</option>${state.teams.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}`;
  }

  function renderDashboard() {
    const month = document.querySelector("#dashboard-month").value || currentMonth();
    const teamId = document.querySelector("#dashboard-team").value || "";
    const data = snapshot(month, teamId);
    const cards = [
      ["本月总利润目标", money(data.totalTarget), `${daysInMonth(month)} 天目标周期`],
      ["当前累计利润", money(data.currentProfit), `利润率 ${percent(data.metrics.profitRate)}`],
      ["整体完成率", percent(data.completionRate), `较时间进度 ${signedPercent(data.progressDelta)}`],
      ["剩余日均需完成", money(data.requiredDailyProfit), `剩余 ${data.remainingDays} 天`],
      ["剩余目标", money(data.remainingTarget), "按经营利润口径"],
      ["预计月底利润", money(data.projectedMonthProfit), `预计达成 ${percent(data.projectedCompletionRate)}`],
      ["退款率", percent(data.metrics.refundRate), `退款金额 ${money(data.metrics.refundAmount)}`],
      ["净成交金额", money(data.metrics.netSalesAmount), `成交 ${money(data.metrics.grossSalesAmount)}`],
    ];
    document.querySelector("#metric-grid").innerHTML = cards.map(([label, value, hint]) => `<article class="panel metric-card"><span>${label}</span><strong>${value}</strong><em>${hint}</em></article>`).join("");

    const meta = statusMeta[data.status];
    const angle = Math.min(Math.max(data.completionRate, 0), 1) * 360;
    document.querySelector("#gauge").style.background = `conic-gradient(${meta.color} ${angle}deg, rgba(148,163,184,.18) ${angle}deg 360deg)`;
    document.querySelector("#gauge-rate").textContent = percent(data.completionRate);
    document.querySelector("#gauge-status").textContent = meta.label;
    document.querySelector("#gauge-status").className = `status status-${data.status}`;
    document.querySelector("#time-progress").textContent = percent(data.timeProgress);
    document.querySelector("#time-bar").style.width = `${Math.min(data.timeProgress * 100, 100)}%`;

    const sortKey = document.querySelector("#sort-key").value;
    const sorted = [...data.teamProgress].sort((a, b) => b[sortKey] - a[sortKey]);
    document.querySelector("#ranking-body").innerHTML = sorted.map((item, index) => `
      <tr data-team-id="${item.team.id}">
        <td>#${index + 1}</td>
        <td><strong>${escapeHtml(item.team.name)}</strong><br><small>${escapeHtml(item.team.leaderName)}</small></td>
        <td class="right">${money(item.profitTarget)}</td>
        <td class="right">${money(item.currentProfit)}</td>
        <td class="right">${percent(item.completionRate)}</td>
        <td class="right">${percent(item.timeProgress)}</td>
        <td class="right ${item.progressDelta >= 0 ? "positive" : "negative"}">${signedPercent(item.progressDelta)}</td>
        <td class="right">${money(item.remainingTarget)}</td>
        <td><span class="status status-${item.status}">${statusMeta[item.status].label}</span></td>
      </tr>
    `).join("");
    document.querySelectorAll("#ranking-body tr").forEach((row) => row.addEventListener("click", () => renderTeamDetail(row.dataset.teamId, month)));
    renderCharts(data);
  }

  function renderCharts(data) {
    drawBars("profit-chart", data.trend.map((item) => item.operatingProfit), "#2dd4bf");
    drawLine("sales-chart", data.trend.map((item) => item.grossSalesAmount), "#38bdf8");
    drawLine("refund-chart", data.trend.map((item) => item.refundRate * 100), "#f59e0b", true);
    drawTwoLines("target-chart", data.trend.map((item) => item.cumulativeProfit), data.trend.map((item) => item.targetCurve));
  }

  function drawBars(id, values, color) {
    const canvas = setupCanvas(id);
    const ctx = canvas.getContext("2d");
    const max = Math.max(...values.map(Math.abs), 1);
    values.forEach((value, index) => {
      const width = canvas.width / values.length;
      const height = (Math.abs(value) / max) * (canvas.height - 34);
      ctx.fillStyle = color;
      ctx.fillRect(index * width + 2, canvas.height - height - 20, Math.max(width - 4, 2), height);
    });
  }

  function drawLine(id, values, color, isPercent = false) {
    const canvas = setupCanvas(id);
    const ctx = canvas.getContext("2d");
    const max = Math.max(...values.map(Math.abs), 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * (canvas.width - 20) + 10;
      const y = canvas.height - 20 - (Math.abs(value) / max) * (canvas.height - 34);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.fillText(isPercent ? `${max.toFixed(1)}%` : money(max), 8, 14);
  }

  function drawTwoLines(id, valuesA, valuesB) {
    drawLine(id, valuesA, "#34d399");
    const canvas = document.querySelector(`#${id}`);
    const ctx = canvas.getContext("2d");
    const max = Math.max(...valuesA, ...valuesB, 1);
    ctx.strokeStyle = "#94a3b8";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    valuesB.forEach((value, index) => {
      const x = (index / Math.max(valuesB.length - 1, 1)) * (canvas.width - 20) + 10;
      const y = canvas.height - 20 - (value / max) * (canvas.height - 34);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function setupCanvas(id) {
    const canvas = document.querySelector(`#${id}`);
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = 220 * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    canvas.width = rect.width;
    canvas.height = 220;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function renderTeamDetail(teamId, month) {
    const team = state.teams.find((item) => item.id === teamId);
    if (!team) return;
    const item = teamProgress(team, month);
    const direction = item.progressDelta >= 0 ? "领先" : "落后";
    document.querySelector("#team-detail").innerHTML = `
      <h2>${escapeHtml(team.name)} · 团队详情</h2>
      <div class="detail-grid">
        <article class="panel metric-card"><span>本月目标</span><strong>${money(item.profitTarget)}</strong></article>
        <article class="panel metric-card"><span>当前利润</span><strong>${money(item.currentProfit)}</strong></article>
        <article class="panel metric-card"><span>完成率</span><strong>${percent(item.completionRate)}</strong></article>
        <article class="panel metric-card"><span>进度差</span><strong class="${item.progressDelta >= 0 ? "positive" : "negative"}">${signedPercent(item.progressDelta)}</strong></article>
      </div>
      <p class="detail-note">当前利润完成率 ${percent(item.completionRate)}，时间进度 ${percent(item.timeProgress)}，${direction} ${Math.abs(item.progressDelta * 100).toFixed(1)}%，${item.status === "leading" || item.status === "normal" ? "进度健康。" : "需要重点关注转化、退款和利润率。"}</p>
    `;
  }

  function renderTeams() {
    document.querySelector("#teams-list").innerHTML = state.teams.map((team) => `
      <div class="edit-card" data-team="${team.id}">
        <label>团队名称<input data-name value="${escapeAttr(team.name)}"></label>
        <label>负责人<input data-leader value="${escapeAttr(team.leaderName)}"></label>
        <span>${money(targetOf(team.id, currentMonth()))}</span>
        <div><button data-save>保存</button> <button data-delete>删除</button></div>
      </div>
    `).join("");
    document.querySelectorAll("[data-team]").forEach((card) => {
      card.querySelector("[data-save]").addEventListener("click", () => {
        const team = state.teams.find((item) => item.id === card.dataset.team);
        team.name = card.querySelector("[data-name]").value.trim();
        team.leaderName = card.querySelector("[data-leader]").value.trim() || "未设置";
        save();
        render();
      });
      card.querySelector("[data-delete]").addEventListener("click", () => {
        if (!confirm("确认删除该团队及其记录？")) return;
        state.teams = state.teams.filter((item) => item.id !== card.dataset.team);
        state.targets = state.targets.filter((item) => item.teamId !== card.dataset.team);
        state.records = state.records.filter((item) => item.teamId !== card.dataset.team);
        save();
        render();
      });
    });
  }

  function renderTargets() {
    const month = document.querySelector("#target-month").value || currentMonth();
    document.querySelector("#targets-list").innerHTML = state.teams.map((team) => `
      <div class="edit-card" data-target-team="${team.id}">
        <strong>${escapeHtml(team.name)}</strong>
        <span>${escapeHtml(team.leaderName)}</span>
        <label>利润目标<input data-target-value value="${targetOf(team.id, month) || ""}"></label>
        <span></span>
      </div>
    `).join("");
    const total = state.teams.reduce((sum, team) => sum + targetOf(team.id, month), 0);
    document.querySelector("#target-total").textContent = money(total);
  }

  function renderReport() {
    const month = document.querySelector("#report-month").value || currentMonth();
    const reportDate = document.querySelector("#report-date").value || today();
    document.querySelector("#report-output").value = dailyReport(month, reportDate);
  }

  function dailyReport(month, reportDate) {
    const data = snapshot(month);
    const teamLines = [...data.teamProgress].sort((a, b) => b.completionRate - a.completionRate).map((item) => {
      const delta = `${item.progressDelta >= 0 ? "领先" : "落后"} ${Math.abs(item.progressDelta * 100).toFixed(1)}%`;
      return `${item.team.name}：本月目标：${money(item.profitTarget)} 当前利润：${money(item.currentProfit)} 完成率：${percent(item.completionRate)} 时间进度：${percent(item.timeProgress)} 状态：${statusMeta[item.status].label} ${delta} 距离目标：还差 ${money(item.remainingTarget)} 剩余日均需完成：${money(item.requiredDailyProfit)} / 天`;
    }).join("\n");
    return `【团队利润目标日报】
日期：${reportDate}

整体情况：
本月利润目标：${money(data.totalTarget)}
当前累计利润：${money(data.currentProfit)}
目标完成率：${percent(data.completionRate)}
时间进度：${percent(data.timeProgress)}
当前状态：${statusMeta[data.status].label}（${signedPercent(data.progressDelta)}）
距离目标：还差 ${money(data.remainingTarget)}
剩余天数：${data.remainingDays} 天
剩余日均需完成：${money(data.requiredDailyProfit)} / 天
预计月底利润：${money(data.projectedMonthProfit)}

团队明细：
${teamLines || "暂无团队数据"}

系统结论：
${data.status === "leading" || data.status === "normal" ? "当前整体进度健康，继续关注退款率和利润率。" : "当前部分团队存在明显掉队，需要重点跟进转化、退款和毛利。"}`;
  }

  function autoMap(headers) {
    const normalize = (value) => String(value).toLowerCase().replace(/[\s_（）()/-]/g, "");
    return Object.fromEntries(fields.map(([key, , , aliases]) => {
      const matched = headers.find((header) => aliases.some((alias) => normalize(header).includes(normalize(alias))));
      return [key, matched || ""];
    }));
  }

  function mappedRows() {
    if (!parsedFile) return { rows: [], errors: [] };
    const errors = [];
    const rows = parsedFile.rows.map((row, index) => {
      const get = (key) => fieldMapping[key] ? row[fieldMapping[key]] : "";
      const mapped = {
        date: normalizeDate(get("date")),
        teamName: String(get("teamName") || "").trim(),
        shopName: String(get("shopName") || "默认店铺").trim(),
        grossSalesAmount: toNumber(get("grossSalesAmount")),
        refundAmount: toNumber(get("refundAmount")),
        costAmount: toNumber(get("costAmount")),
        shippingFee: toNumber(get("shippingFee")),
        platformFee: toNumber(get("platformFee")),
        adCost: toNumber(get("adCost")),
        influencerCommission: toNumber(get("influencerCommission")),
        orderCount: toNumber(get("orderCount")),
        refundOrderCount: toNumber(get("refundOrderCount")),
      };
      if (!mapped.date || !mapped.teamName || !mapped.grossSalesAmount) {
        errors.push(`第 ${index + 2} 行缺少日期、团队名称或成交金额`);
        return null;
      }
      return mapped;
    }).filter(Boolean);
    return { rows, errors };
  }

  function renderMapping() {
    const panel = document.querySelector("#mapping-panel");
    panel.classList.remove("hidden");
    document.querySelector("#file-title").textContent = parsedFile.name;
    document.querySelector("#file-summary").textContent = `识别 ${parsedFile.headers.length} 个字段，${parsedFile.rows.length} 行数据`;
    document.querySelector("#mapping-grid").innerHTML = fields.map(([key, label, required]) => `
      <label>${label}${required ? " *" : " 可空"}
        <select data-map="${key}">
          <option value="">不映射</option>
          ${parsedFile.headers.map((header) => `<option value="${escapeAttr(header)}" ${fieldMapping[key] === header ? "selected" : ""}>${escapeHtml(header)}</option>`).join("")}
        </select>
      </label>
    `).join("");
    document.querySelectorAll("[data-map]").forEach((select) => select.addEventListener("change", () => {
      fieldMapping[select.dataset.map] = select.value;
      renderPreview();
    }));
    renderPreview();
  }

  function renderPreview() {
    const { rows, errors } = mappedRows();
    document.querySelector("#upload-errors").innerHTML = errors.slice(0, 8).map((error) => `<div>${escapeHtml(error)}</div>`).join("");
    document.querySelector("#preview-body").innerHTML = rows.slice(0, 12).map((row) => {
      const metrics = calc(row);
      return `<tr><td>${row.date}</td><td>${escapeHtml(row.teamName)}</td><td>${escapeHtml(row.shopName)}</td><td class="right">${money(row.grossSalesAmount)}</td><td class="right">${money(row.refundAmount)}</td><td class="right positive">${money(metrics.operatingProfit)}</td></tr>`;
    }).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function bind() {
    document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
      currentView = button.dataset.view;
      document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
      document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${currentView}`));
      render();
    }));
    document.querySelector("[data-reset]").addEventListener("click", () => {
      state = sampleData();
      save();
      render();
    });
    ["#dashboard-month", "#dashboard-team", "#sort-key", "#target-month", "#report-month", "#report-date"].forEach((id) => {
      document.querySelector(id).addEventListener("change", render);
    });
    document.querySelector("#team-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.teams.push({ id: uid("team"), name: String(form.get("name")).trim(), leaderName: String(form.get("leaderName") || "未设置").trim() });
      event.currentTarget.reset();
      save();
      render();
    });
    document.querySelector("#save-targets").addEventListener("click", () => {
      const month = document.querySelector("#target-month").value;
      document.querySelectorAll("[data-target-team]").forEach((card) => {
        const teamId = card.dataset.targetTeam;
        const value = toNumber(card.querySelector("[data-target-value]").value);
        const existing = state.targets.find((target) => target.teamId === teamId && target.month === month);
        if (existing) existing.profitTarget = value;
        else state.targets.push({ id: uid("target"), teamId, month, profitTarget: value });
      });
      save();
      render();
    });
    document.querySelector("#file-input").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file || !window.XLSX) return;
      const ext = file.name.split(".").pop().toLowerCase();
      const workbook = ext === "csv" ? XLSX.read(await file.text(), { type: "string", raw: true }) : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const headerRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const headers = (headerRows[0] || []).map(String).filter(Boolean);
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
      parsedFile = { name: file.name, headers, rows };
      fieldMapping = autoMap(headers);
      renderMapping();
    });
    document.querySelector("#import-data").addEventListener("click", () => {
      const { rows } = mappedRows();
      const mode = document.querySelector("input[name='duplicate-mode']:checked").value;
      const teams = state.teams;
      const imported = rows.map((row) => {
        let team = teams.find((item) => item.name.trim().toLowerCase() === row.teamName.trim().toLowerCase());
        if (!team) {
          team = { id: uid("team"), name: row.teamName, leaderName: "未设置" };
          teams.push(team);
        }
        return buildRecord({ ...row, teamName: team.name }, team.id);
      });
      const keys = new Set(imported.map((record) => `${record.date}|${record.teamId}|${record.shopName}`));
      state.records = mode === "overwrite" ? state.records.filter((record) => !keys.has(`${record.date}|${record.teamId}|${record.shopName}`)) : state.records;
      state.records.push(...imported);
      parsedFile = null;
      document.querySelector("#mapping-panel").classList.add("hidden");
      save();
      render();
      document.querySelector("[data-view='dashboard']").click();
    });
    document.querySelector("#copy-report").addEventListener("click", async () => {
      await navigator.clipboard.writeText(document.querySelector("#report-output").value);
      document.querySelector("#copy-report").textContent = "已复制";
      setTimeout(() => (document.querySelector("#copy-report").textContent = "复制日报"), 1300);
    });
    window.addEventListener("resize", () => currentView === "dashboard" && renderDashboard());
  }

  bind();
  render();
})();
