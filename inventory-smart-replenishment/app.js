const DEFAULT_WAREHOUSES = [
  "北京仓",
  "上海仓",
  "广州仓",
  "成都仓",
  "武汉仓",
  "西安仓",
  "沈阳仓",
  "济南仓",
];

const SAMPLE_CSV = `SKU ID,SKU 名称,品类,季节款标记,主图文件,当前库龄分级,在途库存,历史累计销量,历史销售额,单日峰值销量,下单排期,工厂生产,物流运输,仓库上架,整装单位,起发量,近7天销量,近30天销量,北京仓当前库存,北京仓近28天出库量,北京仓近28天有货天数,北京仓历史销售占比,上海仓当前库存,上海仓近28天出库量,上海仓近28天有货天数,上海仓历史销售占比,广州仓当前库存,广州仓近28天出库量,广州仓近28天有货天数,广州仓历史销售占比,成都仓当前库存,成都仓近28天出库量,成都仓近28天有货天数,成都仓历史销售占比,武汉仓当前库存,武汉仓近28天出库量,武汉仓近28天有货天数,武汉仓历史销售占比,西安仓当前库存,西安仓近28天出库量,西安仓近28天有货天数,西安仓历史销售占比,沈阳仓当前库存,沈阳仓近28天出库量,沈阳仓近28天有货天数,沈阳仓历史销售占比,济南仓当前库存,济南仓近28天出库量,济南仓近28天有货天数,济南仓历史销售占比
SLP-1001,雨季防滑洞洞拖,拖鞋,否,,A,0,4820,193600,186,5,28,8,4,200,200,318,1220,36,310,28,26%,48,260,28,18%,32,220,26,16%,310,120,28,10%,78,130,28,10%,22,90,21,7%,15,74,20,6%,42,96,26,7%
SLP-1002,轻量速干沙滩拖,拖鞋,否,,C1,100,1780,65860,126,5,30,8,4,200,200,104,410,0,86,12,24%,8,66,18,18%,260,42,28,10%,420,38,28,8%,40,54,18,12%,0,46,12,10%,0,32,10,8%,120,46,28,10%
SLP-1003,儿童防滑居家拖,拖鞋,否,,B,0,860,29240,74,4,22,7,3,200,200,52,230,18,72,28,16%,24,56,28,15%,16,42,28,14%,82,18,28,10%,12,28,28,12%,10,22,28,9%,8,18,28,8%,12,22,28,16%
SLP-1004,厚底棉拖冬季款,棉拖,是,,C1,0,2320,118320,210,8,45,12,5,200,200,18,96,520,8,28,16%,410,6,28,14%,380,4,28,13%,620,3,28,13%,280,4,28,12%,230,2,28,10%,320,3,28,11%,350,4,28,11%
SLP-1005,商务浴室防滑拖,拖鞋,否,,A,0,610,24400,52,4,24,7,3,200,200,76,240,20,70,28,18%,18,42,28,15%,16,38,28,14%,26,30,28,11%,14,28,28,12%,12,22,28,9%,10,18,28,8%,14,22,28,13%
SLP-1006,基础款静音拖鞋,拖鞋,否,,C1,0,430,15480,32,4,25,7,3,200,200,10,64,680,6,28,18%,540,4,28,14%,620,5,28,14%,760,4,28,13%,360,3,28,12%,280,3,28,9%,240,2,28,8%,320,3,28,12%`;

const FIELD_ALIASES = {
  skuId: ["SKU ID", "SKU_ID", "SKU编号", "SKU 编号", "SKU编码", "商品编码", "货号", "sku"],
  skuName: ["SKU 名称", "SKU名称", "商品名称", "款名", "标题", "商品标题"],
  category: ["品类", "类目", "商品品类", "分类"],
  seasonal: ["季节款标记", "是否季节款", "排除标记", "是否排除", "排除"],
  imageName: ["主图文件", "主图文件名", "图片文件", "图片"],
  ageGrade: ["库龄分级", "当前库龄分级", "库龄等级", "库存等级"],
  ageDays: ["库龄天数", "最大库龄天数", "最长库龄", "入库天数"],
  transit: ["在途库存", "在途数量", "在途"],
  historicalSales: ["历史累计销量", "累计销量", "历史销量"],
  historicalRevenue: ["历史销售额", "累计销售额", "销售额"],
  peakDailySales: ["单日峰值销量", "峰值销量", "单日最高销量", "单日爆发销量"],
  leadOrder: ["下单排期", "下单天数", "排期天数"],
  leadProduction: ["工厂生产", "生产天数", "工厂生产天数"],
  leadLogistics: ["物流运输", "运输天数", "物流天数"],
  leadInbound: ["仓库上架", "上架天数", "入仓上架天数"],
  safetyDays: ["安全周期", "目标天数", "目标库存天数", "补货目标天数"],
  packUnit: ["整装单位", "装箱单位", "整装数量"],
  minShipment: ["起发量", "最低起发量", "最小发货量"],
  sales7: ["近7天销量", "近7日销量", "7天销量"],
  sales30: ["近30天销量", "近30日销量", "30天销量"],
};

const WH_KEYWORDS = {
  stock: ["当前库存", "可售库存", "现货库存", "库存数量", "库存"],
  sales28: ["近28天出库量", "近28日出库量", "28天出库量", "28日出库量", "近28天销量", "近28日销量", "28天销量"],
  availableDays: ["近28天有货天数", "近28日有货天数", "有货天数"],
  share: ["历史销售占比", "销售占比", "占比"],
  transit: ["在途库存", "在途数量", "在途"],
};

const WH_EXCLUDES = {
  stock: ["库存天数", "库龄", "在途", "占比"],
  sales28: ["有货天数", "库存", "库存天数", "占比"],
  availableDays: ["出库", "销量", "库存"],
  share: ["库存", "出库", "销量", "有货"],
  transit: ["库存天数", "占比"],
};

const state = {
  activeTab: "replenishment",
  rawRows: [],
  headers: [],
  records: [],
  imageMap: new Map(),
  sourceName: "",
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  restoreSettings();
  bindEvents();
  renderAll();
  refreshIcons();
});

function bindEvents() {
  $("dataFile").addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (file) {
      await handleDataFile(file);
    }
  });

  $("imageFiles").addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      const key = normalizeImageKey(file.name);
      if (key) {
        state.imageMap.set(key, URL.createObjectURL(file));
      }
    });
    recompute();
  });

  $("loadSample").addEventListener("click", () => {
    const rows = parseDelimitedText(SAMPLE_CSV);
    setRows(rows, "示例数据");
  });

  $("downloadTemplate").addEventListener("click", () => {
    downloadText("智能补货系统-标准底表模板.csv", "\uFEFF" + SAMPLE_CSV, "text/csv;charset=utf-8");
  });

  $("exportCsv").addEventListener("click", () => {
    const table = getCurrentTableData();
    downloadCsv(table.filename, table.headers, table.rows);
  });

  $("exportWorkbook").addEventListener("click", exportWorkbook);
  $("downloadReport").addEventListener("click", downloadBossReport);

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");
      renderTable();
    });
  });

  ["layerFilter", "statusFilter"].forEach((id) => {
    $(id).addEventListener("change", renderTable);
  });

  [
    "thresholdDays",
    "defaultSafetyDays",
    "hotThreshold",
    "potentialThreshold",
    "peakThreshold",
    "defaultPackUnit",
    "useAvailableDays",
    "subtractTransit",
    "warehouses",
  ].forEach((id) => {
    $(id).addEventListener("input", () => {
      persistSettings();
      recompute();
    });
  });
}

async function handleDataFile(file) {
  const lowerName = file.name.toLowerCase();
  try {
    if (/\.(xlsx|xls)$/.test(lowerName)) {
      if (!window.XLSX) {
        throw new Error("Excel 解析组件未加载，请检查网络后重试，或先导出 CSV 上传。");
      }
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: false });
      setRows(rows, file.name);
      return;
    }

    const text = await file.text();
    setRows(parseDelimitedText(text), file.name);
  } catch (error) {
    alert(error.message || "文件解析失败，请检查底表格式。");
  }
}

function setRows(rows, sourceName) {
  state.rawRows = rows.filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));
  state.headers = collectHeaders(state.rawRows);
  state.sourceName = sourceName;
  recompute();
}

function recompute() {
  const settings = readSettings();
  state.records = state.rawRows.map((row, index) => normalizeRecord(row, index, settings));
  renderAll();
}

function readSettings() {
  const warehouses = $("warehouses").value
    .split(/\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    warehouses: warehouses.length ? warehouses : DEFAULT_WAREHOUSES,
    thresholdDays: positiveNumber($("thresholdDays").value, 15),
    defaultSafetyDays: positiveNumber($("defaultSafetyDays").value, 60),
    hotThreshold: positiveNumber($("hotThreshold").value, 1000),
    potentialThreshold: positiveNumber($("potentialThreshold").value, 500),
    peakThreshold: positiveNumber($("peakThreshold").value, 100),
    defaultPackUnit: positiveNumber($("defaultPackUnit").value, 200),
    useAvailableDays: $("useAvailableDays").checked,
    subtractTransit: $("subtractTransit").checked,
  };
}

function persistSettings() {
  const settings = {
    thresholdDays: $("thresholdDays").value,
    defaultSafetyDays: $("defaultSafetyDays").value,
    hotThreshold: $("hotThreshold").value,
    potentialThreshold: $("potentialThreshold").value,
    peakThreshold: $("peakThreshold").value,
    defaultPackUnit: $("defaultPackUnit").value,
    useAvailableDays: $("useAvailableDays").checked,
    subtractTransit: $("subtractTransit").checked,
    warehouses: $("warehouses").value,
  };
  localStorage.setItem("replenishment.settings", JSON.stringify(settings));
}

function restoreSettings() {
  const raw = localStorage.getItem("replenishment.settings");
  if (!raw) return;
  try {
    const settings = JSON.parse(raw);
    Object.entries(settings).forEach(([key, value]) => {
      const input = $(key);
      if (!input) return;
      if (input.type === "checkbox") {
        input.checked = Boolean(value);
      } else {
        input.value = value;
      }
    });
  } catch {
    localStorage.removeItem("replenishment.settings");
  }
}

function normalizeRecord(row, index, settings) {
  const skuId = textValue(pick(row, FIELD_ALIASES.skuId)) || `SKU-${String(index + 1).padStart(4, "0")}`;
  const skuName = textValue(pick(row, FIELD_ALIASES.skuName)) || skuId;
  const category = textValue(pick(row, FIELD_ALIASES.category));
  const seasonal = textValue(pick(row, FIELD_ALIASES.seasonal));
  const ageGrade = textValue(pick(row, FIELD_ALIASES.ageGrade));
  const ageDays = toNumber(pick(row, FIELD_ALIASES.ageDays));
  const totalTransit = toNumber(pick(row, FIELD_ALIASES.transit));
  const historicalSales = toNumber(pick(row, FIELD_ALIASES.historicalSales));
  const historicalRevenue = toNumber(pick(row, FIELD_ALIASES.historicalRevenue));
  const peakDailySales = toNumber(pick(row, FIELD_ALIASES.peakDailySales));
  const leadDays = [
    toNumber(pick(row, FIELD_ALIASES.leadOrder)),
    toNumber(pick(row, FIELD_ALIASES.leadProduction)),
    toNumber(pick(row, FIELD_ALIASES.leadLogistics)),
    toNumber(pick(row, FIELD_ALIASES.leadInbound)),
  ];
  const safetyFromRow = toNumber(pick(row, FIELD_ALIASES.safetyDays));
  const leadSum = leadDays.reduce((sum, value) => sum + value, 0);
  const safetyDays = safetyFromRow || leadSum || settings.defaultSafetyDays;
  const packUnit = toNumber(pick(row, FIELD_ALIASES.packUnit)) || toNumber(pick(row, FIELD_ALIASES.minShipment)) || settings.defaultPackUnit;
  const sales7 = toNumber(pick(row, FIELD_ALIASES.sales7));
  const sales30 = toNumber(pick(row, FIELD_ALIASES.sales30));
  const imageName = textValue(pick(row, FIELD_ALIASES.imageName));
  const imageUrl = resolveImageUrl(skuId, imageName);
  const excluded = isExcluded(category, seasonal);
  const isC1 = isC1Aging(ageGrade, ageDays);

  const initialWarehouses = settings.warehouses.map((name) => {
    const stock = toNumber(pickWarehouse(row, name, "stock"));
    const sales28 = toNumber(pickWarehouse(row, name, "sales28"));
    const availableDays = toNumber(pickWarehouse(row, name, "availableDays"));
    const shareRaw = toRatio(pickWarehouse(row, name, "share"));
    const transit = toNumber(pickWarehouse(row, name, "transit"));
    return { name, stock, sales28, availableDays, shareRaw, transit };
  });

  const shareSum = initialWarehouses.reduce((sum, item) => sum + item.shareRaw, 0);
  const salesSum = initialWarehouses.reduce((sum, item) => sum + item.sales28, 0);

  const warehouses = initialWarehouses.map((item) => {
    const share = shareSum > 0 ? item.shareRaw / shareSum : salesSum > 0 ? item.sales28 / salesSum : 1 / initialWarehouses.length;
    const daysBase = settings.useAvailableDays && item.availableDays > 0 ? item.availableDays : 28;
    const dailyAvg = item.sales28 > 0 ? item.sales28 / daysBase : 0;
    const stockDays = dailyAvg > 0 ? item.stock / dailyAvg : item.stock > 0 ? 999 : 0;
    const transitDeduction = settings.subtractTransit ? item.transit || totalTransit * share : 0;
    const targetStock = safetyDays * dailyAvg;
    const rawNeed = !excluded && stockDays < settings.thresholdDays ? Math.max(0, targetStock - item.stock - transitDeduction) : 0;
    const roundedNeed = roundToPack(rawNeed, packUnit);
    return {
      ...item,
      share,
      dailyAvg,
      stockDays,
      transitDeduction,
      rawNeed,
      roundedNeed,
    };
  });

  const totalStock = warehouses.reduce((sum, item) => sum + item.stock, 0);
  const totalSales28 = warehouses.reduce((sum, item) => sum + item.sales28, 0);
  const totalDailyAvg = warehouses.reduce((sum, item) => sum + item.dailyAvg, 0);
  const nationalStockDays = totalDailyAvg > 0 ? totalStock / totalDailyAvg : totalStock > 0 ? 999 : 0;
  const totalRecommended = warehouses.reduce((sum, item) => sum + item.roundedNeed, 0);
  const triggeredWarehouses = warehouses.filter((item) => item.roundedNeed > 0);
  const layer = historicalSales >= settings.hotThreshold ? "爆款" : historicalSales >= settings.potentialThreshold ? "潜力款" : "观察款";
  const trend = buildTrend(sales7, sales30);
  const wake = buildWakeSignal({
    warehouses,
    excluded,
    isC1,
    category,
    historicalSales,
    peakDailySales,
    nationalStockDays,
    totalStock,
    settings,
  });

  return {
    row,
    skuId,
    skuName,
    category,
    seasonal,
    excluded,
    imageUrl,
    ageGrade,
    ageDays,
    isC1,
    totalTransit,
    historicalSales,
    historicalRevenue,
    peakDailySales,
    safetyDays,
    packUnit,
    sales7,
    sales30,
    trend,
    warehouses,
    totalStock,
    totalSales28,
    totalDailyAvg,
    nationalStockDays,
    totalRecommended,
    triggered: triggeredWarehouses.length > 0,
    triggeredWarehouses,
    layer,
    wake,
  };
}

function buildTrend(sales7, sales30) {
  if (!sales7 && !sales30) {
    return { label: "无数据", className: "gray", ratio: 0 };
  }
  if (!sales30) {
    return { label: "新近动销", className: "blue", ratio: 1 };
  }
  const ratio = (sales7 / 7) / (sales30 / 30);
  if (ratio >= 1.15) return { label: "上升", className: "green", ratio };
  if (ratio <= 0.85) return { label: "下降", className: "amber", ratio };
  return { label: "平稳", className: "blue", ratio };
}

function buildWakeSignal(input) {
  const {
    warehouses,
    excluded,
    isC1,
    category,
    historicalSales,
    peakDailySales,
    nationalStockDays,
    totalStock,
    settings,
  } = input;
  const stockoutWarehouses = warehouses.filter((item) => item.stock <= 5 && item.sales28 >= 20);
  const surplusWarehouses = warehouses.filter((item) => item.stock >= Math.max(settings.defaultPackUnit, 300));
  const hasDemand = historicalSales >= settings.potentialThreshold || peakDailySales >= settings.peakThreshold;
  const hasAgingPressure = isC1 || nationalStockDays >= 120 || totalStock >= settings.defaultPackUnit * 2;
  const matched = !excluded && hasDemand && hasAgingPressure && (stockoutWarehouses.length > 0 || surplusWarehouses.length > 0 || peakDailySales >= settings.peakThreshold);
  const criteria = [];
  const actions = [];

  if (peakDailySales >= settings.peakThreshold) {
    criteria.push(`单日峰值 ${formatNumber(peakDailySales)} 双`);
    actions.push("保留需求判断，优先恢复主力仓货量");
  }
  if (historicalSales >= settings.potentialThreshold) {
    criteria.push(`历史累计 ${formatNumber(historicalSales)} 双`);
  }
  if (surplusWarehouses.length && stockoutWarehouses.length) {
    criteria.push(`区域售罄：${stockoutWarehouses.map((item) => item.name).join("、")}`);
    actions.push(`从 ${surplusWarehouses[0].name} 调拨到 ${stockoutWarehouses.slice(0, 3).map((item) => item.name).join("、")}`);
  }
  if (/拖|防滑|速干|浴室|雨/.test(category)) {
    criteria.push("功能型拖鞋场景");
    actions.push("主图突出防滑、速干、雨季、浴室等使用场景");
  }
  if (nationalStockDays >= 120) {
    criteria.push(`全国库存 ${formatDays(nationalStockDays)}`);
    actions.push("同步小幅调价或组合促销，观察 7 天曲线");
  }

  return {
    matched,
    criteria: criteria.length ? criteria : ["未命中"],
    actions: actions.length ? Array.from(new Set(actions)) : ["继续观察"],
  };
}

function renderAll() {
  renderKpis();
  renderUrgentPanel();
  renderTable();
  drawBossReport();
  refreshIcons();
}

function renderKpis() {
  const records = state.records;
  const triggered = records.filter((item) => item.triggered);
  const totalNeed = triggered.reduce((sum, item) => sum + item.totalRecommended, 0);
  const totalStock = records.reduce((sum, item) => sum + item.totalStock, 0);
  const c1Stock = records.filter((item) => item.isC1).reduce((sum, item) => sum + item.totalStock, 0);
  const wakeCount = records.filter((item) => item.wake.matched).length;
  const excludedCount = records.filter((item) => item.excluded).length;
  const c1Ratio = totalStock > 0 ? c1Stock / totalStock : 0;

  $("kpiStrip").innerHTML = [
    metricCard("SKU 总数", formatNumber(records.length), state.sourceName || "未导入底表"),
    metricCard("触发补货", formatNumber(triggered.length), `建议补 ${formatNumber(totalNeed)} 双`),
    metricCard("C1 库存占比", formatPercent(c1Ratio), `C1 库存 ${formatNumber(c1Stock)} 双`),
    metricCard("可唤醒 SKU", formatNumber(wakeCount), "疑似假滞销"),
    metricCard("排除季节款", formatNumber(excludedCount), "不进线性补货模型"),
  ].join("");

  $("dataStatus").textContent = records.length ? `${records.length} 条` : "等待导入";
  $("runSummary").textContent = records.length
    ? `当前有 ${triggered.length} 个 SKU 需要补货，建议补 ${formatNumber(totalNeed)} 双；请优先处理页面上方的补货提醒。`
    : "导入底表后，最需要补货的 SKU 会优先显示在页面上方。";
}

function metricCard(label, value, note) {
  return `<article class="metric-card"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span></article>`;
}

function renderUrgentPanel() {
  const panel = $("urgentPanel");
  if (!panel) return;

  if (!state.records.length) {
    panel.innerHTML = `
      <div class="urgent-empty">
        <strong>补货提醒</strong>
        <span>导入底表后，这里会直接显示需要补货的 SKU、当前库存和建议补货量。</span>
      </div>
    `;
    return;
  }

  const urgentRecords = getUrgentRecords();
  const totalNeed = urgentRecords.reduce((sum, record) => sum + record.totalRecommended, 0);

  if (!urgentRecords.length) {
    panel.innerHTML = `
      <div class="urgent-empty good">
        <strong>暂无需要立即补货的 SKU</strong>
        <span>当前底表没有低于触发阈值的仓库，继续按日/周更新底表观察。</span>
      </div>
    `;
    return;
  }

  const topRecords = urgentRecords.slice(0, 6);
  panel.innerHTML = `
    <div class="urgent-head">
      <div>
        <span class="urgent-eyebrow">补货提醒</span>
        <h3>${formatNumber(urgentRecords.length)} 个 SKU 需要补货</h3>
        <p>建议补货 ${formatNumber(totalNeed)} 双，按库存天数最短的 SKU 优先处理。</p>
      </div>
      <button id="viewUrgentRows" class="primary-button" type="button">
        <i data-lucide="bell-ring"></i>
        只看补货清单
      </button>
    </div>
    <div class="urgent-grid">
      ${topRecords.map(urgentCard).join("")}
    </div>
  `;

  const viewButton = $("viewUrgentRows");
  if (viewButton) {
    viewButton.addEventListener("click", () => {
      state.activeTab = "replenishment";
      document.querySelectorAll(".tab-button").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.tab === "replenishment");
      });
      $("statusFilter").value = "triggered";
      renderTable();
      document.querySelector(".workspace-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function getUrgentRecords() {
  return state.records
    .filter((record) => record.triggered)
    .sort((a, b) => {
      const aMinDays = Math.min(...a.triggeredWarehouses.map((item) => item.stockDays));
      const bMinDays = Math.min(...b.triggeredWarehouses.map((item) => item.stockDays));
      return aMinDays - bMinDays || b.totalRecommended - a.totalRecommended || b.historicalSales - a.historicalSales;
    });
}

function urgentCard(record) {
  const mostUrgent = record.triggeredWarehouses
    .slice()
    .sort((a, b) => a.stockDays - b.stockDays || b.roundedNeed - a.roundedNeed)[0];
  const warehouseText = record.triggeredWarehouses
    .slice(0, 3)
    .map((item) => `${item.name} ${formatNumber(item.roundedNeed)}双`)
    .join("，");

  return `
    <article class="urgent-card">
      <div class="urgent-card-top">
        ${skuCell(record)}
        <span class="urgent-tag">${escapeHtml(record.layer)}</span>
      </div>
      <div class="urgent-numbers">
        <div>
          <small>当前库存</small>
          <strong>${formatNumber(record.totalStock)} 双</strong>
        </div>
        <div>
          <small>建议补货</small>
          <strong>${formatNumber(record.totalRecommended)} 双</strong>
        </div>
        <div>
          <small>最短库存</small>
          <strong>${formatDays(mostUrgent?.stockDays || 0)}</strong>
        </div>
      </div>
      <div class="urgent-warehouses">
        <span>${escapeHtml(mostUrgent?.name || "-")} 最急</span>
        <p>${escapeHtml(warehouseText || "-")}</p>
      </div>
    </article>
  `;
}

function renderTable() {
  const table = getCurrentTableData();
  $("tableCount").textContent = `${table.rows.length} 条`;

  if (!state.records.length) {
    $("tableWrap").innerHTML = `<div class="empty-state">请先上传京东原始底表，或点击左侧“示例数据”。</div>`;
    return;
  }

  if (!table.rows.length) {
    $("tableWrap").innerHTML = `<div class="empty-state">当前筛选条件下没有结果。</div>`;
    return;
  }

  $("tableWrap").innerHTML = `
    <table>
      <thead>
        <tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>${table.htmlRows.join("")}</tbody>
    </table>
  `;
}

function getCurrentTableData() {
  const tab = state.activeTab;
  if (tab === "wake") return buildWakeTable();
  if (tab === "allocation") return buildAllocationTable();
  if (tab === "ops") return buildOpsTable();
  if (tab === "aging") return buildAgingTable();
  return buildReplenishmentTable();
}

function filteredRecords() {
  const layerFilter = $("layerFilter").value;
  const statusFilter = $("statusFilter").value;
  return state.records.filter((record) => {
    if (layerFilter !== "all" && record.layer !== layerFilter) return false;
    if (statusFilter === "triggered" && !record.triggered) return false;
    if (statusFilter === "excluded" && !record.excluded) return false;
    if (statusFilter === "c1" && !record.isC1) return false;
    return true;
  });
}

function buildReplenishmentTable() {
  const records = filteredRecords().sort((a, b) => Number(b.triggered) - Number(a.triggered) || b.totalRecommended - a.totalRecommended || b.historicalSales - a.historicalSales);
  const headers = ["SKU", "层级", "当前库存", "全国库存天数", "销量趋势", "补货标识", "建议补货", "重点仓", "库龄"];
  const rows = records.map((record) => [
    `${record.skuName} (${record.skuId})`,
    record.layer,
    `${formatNumber(record.totalStock)} 双`,
    formatDays(record.nationalStockDays),
    record.trend.label,
    record.excluded ? "季节款排除" : record.triggered ? "触发" : "未触发",
    `${formatNumber(record.totalRecommended)} 双`,
    record.triggeredWarehouses.map((item) => `${item.name}${formatNumber(item.roundedNeed)}`).join(" / ") || "-",
    record.isC1 ? "C1" : record.ageGrade || "-",
  ]);
  const htmlRows = records.map((record) => `
    <tr>
      <td>${skuCell(record)}</td>
      <td>${pill(record.layer, record.layer === "爆款" ? "green" : record.layer === "潜力款" ? "blue" : "gray")}</td>
      <td>${formatNumber(record.totalStock)} 双</td>
      <td>${formatDays(record.nationalStockDays)}</td>
      <td>${pill(record.trend.label, record.trend.className)}</td>
      <td>${record.excluded ? pill("季节款排除", "gray") : record.triggered ? pill("触发补货", "amber") : pill("未触发", "green")}</td>
      <td class="num-strong">${formatNumber(record.totalRecommended)} 双</td>
      <td>${escapeHtml(record.triggeredWarehouses.slice(0, 4).map((item) => `${item.name} ${formatNumber(item.roundedNeed)}双`).join("，") || "-")}</td>
      <td>${record.isC1 ? pill("C1", "red") : escapeHtml(record.ageGrade || "-")}</td>
    </tr>
  `);
  return { filename: "补货清单.csv", headers, rows, htmlRows };
}

function buildWakeTable() {
  const records = filteredRecords().filter((record) => record.wake.matched).sort((a, b) => b.peakDailySales - a.peakDailySales || b.historicalSales - a.historicalSales);
  const headers = ["SKU", "历史累计销量", "单日峰值", "命中判据", "建议动作"];
  const rows = records.map((record) => [
    `${record.skuName} (${record.skuId})`,
    `${formatNumber(record.historicalSales)} 双`,
    `${formatNumber(record.peakDailySales)} 双`,
    record.wake.criteria.join("；"),
    record.wake.actions.join("；"),
  ]);
  const htmlRows = records.map((record) => `
    <tr>
      <td>${skuCell(record)}</td>
      <td>${formatNumber(record.historicalSales)} 双</td>
      <td>${formatNumber(record.peakDailySales)} 双</td>
      <td>${escapeHtml(record.wake.criteria.join("；"))}</td>
      <td>${escapeHtml(record.wake.actions.join("；"))}</td>
    </tr>
  `);
  return { filename: "滞销款唤醒清单.csv", headers, rows, htmlRows };
}

function buildAllocationTable() {
  const settings = readSettings();
  const records = filteredRecords().filter((record) => record.triggered).sort((a, b) => b.totalRecommended - a.totalRecommended);
  const headers = ["SKU", "总建议补货", ...settings.warehouses];
  const rows = records.map((record) => [
    `${record.skuName} (${record.skuId})`,
    `${formatNumber(record.totalRecommended)} 双`,
    ...settings.warehouses.map((name) => {
      const wh = record.warehouses.find((item) => item.name === name);
      return wh ? `${formatPercent(wh.share)} / ${formatNumber(wh.roundedNeed)} 双` : "-";
    }),
  ]);
  const htmlRows = records.map((record) => `
    <tr>
      <td>${skuCell(record)}</td>
      <td class="num-strong">${formatNumber(record.totalRecommended)} 双</td>
      ${settings.warehouses
        .map((name) => {
          const wh = record.warehouses.find((item) => item.name === name);
          const text = wh ? `${formatPercent(wh.share)} / ${formatNumber(wh.roundedNeed)} 双` : "-";
          return `<td>${escapeHtml(text)}</td>`;
        })
        .join("")}
    </tr>
  `);
  return { filename: "八大仓配比建议.csv", headers, rows, htmlRows };
}

function buildOpsTable() {
  const records = filteredRecords().filter((record) => record.triggered);
  const details = records
    .flatMap((record) =>
      record.warehouses
        .filter((wh) => wh.roundedNeed > 0)
        .map((wh) => ({ record, wh }))
    )
    .sort((a, b) => b.wh.roundedNeed - a.wh.roundedNeed);
  const headers = ["SKU ID", "款名", "仓库", "当前库存", "近28天出库", "日均出库", "库存天数", "原始缺口", "整装建议", "安全周期"];
  const rows = details.map(({ record, wh }) => [
    record.skuId,
    record.skuName,
    wh.name,
    formatNumber(wh.stock),
    formatNumber(wh.sales28),
    formatDecimal(wh.dailyAvg),
    formatDays(wh.stockDays),
    formatNumber(Math.ceil(wh.rawNeed)),
    formatNumber(wh.roundedNeed),
    `${formatNumber(record.safetyDays)} 天`,
  ]);
  const htmlRows = details.map(({ record, wh }) => `
    <tr>
      <td>${escapeHtml(record.skuId)}</td>
      <td>${escapeHtml(record.skuName)}</td>
      <td>${escapeHtml(wh.name)}</td>
      <td>${formatNumber(wh.stock)}</td>
      <td>${formatNumber(wh.sales28)}</td>
      <td>${formatDecimal(wh.dailyAvg)}</td>
      <td>${formatDays(wh.stockDays)}</td>
      <td>${formatNumber(Math.ceil(wh.rawNeed))}</td>
      <td class="num-strong">${formatNumber(wh.roundedNeed)}</td>
      <td>${formatNumber(record.safetyDays)} 天</td>
    </tr>
  `);
  return { filename: "运营分仓明细.csv", headers, rows, htmlRows };
}

function buildAgingTable() {
  const records = filteredRecords()
    .filter((record) => record.isC1 || record.nationalStockDays >= 120)
    .sort((a, b) => b.totalStock - a.totalStock);
  const headers = ["SKU", "库龄状态", "库存数量", "全国库存天数", "可能成因", "建议动作"];
  const rows = records.map((record) => [
    `${record.skuName} (${record.skuId})`,
    record.isC1 ? "C1" : "高库存天数",
    `${formatNumber(record.totalStock)} 双`,
    formatDays(record.nationalStockDays),
    agingCause(record),
    agingAction(record),
  ]);
  const htmlRows = records.map((record) => `
    <tr>
      <td>${skuCell(record)}</td>
      <td>${record.isC1 ? pill("C1", "red") : pill("高库存天数", "amber")}</td>
      <td>${formatNumber(record.totalStock)} 双</td>
      <td>${formatDays(record.nationalStockDays)}</td>
      <td>${escapeHtml(agingCause(record))}</td>
      <td>${escapeHtml(agingAction(record))}</td>
    </tr>
  `);
  return { filename: "长库龄治理.csv", headers, rows, htmlRows };
}

function agingCause(record) {
  if (record.excluded) return "强季节款，不适合线性补货模型";
  const maxWh = record.warehouses.reduce((max, item) => (item.stock > max.stock ? item : max), record.warehouses[0]);
  const stockout = record.warehouses.filter((item) => item.stock <= 5 && item.sales28 > 0);
  if (maxWh && stockout.length) return `库存集中在${maxWh.name}，主销仓疑似断货`;
  if (record.totalDailyAvg <= 0) return "近 28 天动销不足";
  if (record.nationalStockDays >= 120) return "库存覆盖天数超过 120 天";
  return "库龄达到 C1";
}

function agingAction(record) {
  if (record.excluded) return "独立做季节款清退计划";
  if (record.wake.matched) return record.wake.actions.join("；");
  if (record.totalDailyAvg <= 0) return "优先清退或组合促销";
  return "按仓库集中度拆分清退，单次控制 1-2 款";
}

function skuCell(record) {
  const image = record.imageUrl
    ? `<img class="sku-thumb" src="${record.imageUrl}" alt="${escapeHtml(record.skuName)}" />`
    : `<div class="sku-thumb sku-placeholder">${escapeHtml(record.skuId.slice(-4))}</div>`;
  return `
    <div class="sku-cell">
      ${image}
      <div>
        <span class="sku-name">${escapeHtml(record.skuName)}</span>
        <span class="sku-id">${escapeHtml(record.skuId)}</span>
      </div>
    </div>
  `;
}

function pill(label, color) {
  return `<span class="pill ${color}">${escapeHtml(label)}</span>`;
}

async function drawBossReport() {
  const canvas = $("bossCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const records = state.records.filter((item) => item.triggered).sort((a, b) => b.totalRecommended - a.totalRecommended || b.historicalSales - a.historicalSales).slice(0, 8);
  const settings = readSettings();
  const now = new Date();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#172421";
  ctx.fillRect(0, 0, canvas.width, 170);
  ctx.fillStyle = "#5eead4";
  ctx.font = "700 24px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText("智能补货周报", 60, 58);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText("补货拍板清单", 60, 122);
  ctx.fillStyle = "#bdd6d1";
  ctx.font = "400 22px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(`触发阈值 ${settings.thresholdDays} 天 · 安全周期按 SKU 参数/默认 ${settings.defaultSafetyDays} 天 · ${formatDate(now)}`, 60, 155);

  drawReportMetric(ctx, 60, 210, "触发 SKU", `${state.records.filter((item) => item.triggered).length}`);
  drawReportMetric(ctx, 330, 210, "建议补货", `${formatNumber(state.records.reduce((sum, item) => sum + item.totalRecommended, 0))} 双`);
  drawReportMetric(ctx, 600, 210, "可唤醒", `${state.records.filter((item) => item.wake.matched).length}`);
  drawReportMetric(ctx, 870, 210, "C1 SKU", `${state.records.filter((item) => item.isC1).length}`);

  if (!records.length) {
    ctx.fillStyle = "#61716e";
    ctx.font = "500 28px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(state.records.length ? "当前没有 SKU 触发补货。" : "导入底表后自动生成图片报表。", 60, 420);
    return;
  }

  let y = 340;
  for (const record of records) {
    drawRoundRect(ctx, 48, y - 34, 1104, 132, 10, "#f8fbfa", "#dce5e2");
    await drawSkuImage(ctx, record, 70, y - 12, 84, 84);

    ctx.fillStyle = "#182422";
    ctx.font = "800 25px PingFang SC, Microsoft YaHei, sans-serif";
    wrapCanvasText(ctx, record.skuName, 174, y + 4, 390, 30, 1);
    ctx.fillStyle = "#61716e";
    ctx.font = "500 18px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(`${record.skuId} · ${record.layer} · ${formatDays(record.nationalStockDays)}`, 174, y + 42);

    ctx.fillStyle = "#0b5f58";
    ctx.font = "900 34px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(`${formatNumber(record.totalRecommended)} 双`, 600, y + 12);
    ctx.fillStyle = "#61716e";
    ctx.font = "500 17px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText("建议补货", 600, y + 44);

    const warehouseText = record.triggeredWarehouses
      .slice(0, 3)
      .map((item) => `${item.name}${formatNumber(item.roundedNeed)}`)
      .join(" / ");
    ctx.fillStyle = "#182422";
    ctx.font = "700 20px PingFang SC, Microsoft YaHei, sans-serif";
    wrapCanvasText(ctx, warehouseText || "-", 760, y + 4, 320, 26, 2);

    if (record.isC1) {
      drawSmallBadge(ctx, "C1", 1080, y - 5, "#fde0dc", "#a12a20");
    } else if (record.trend.label === "上升") {
      drawSmallBadge(ctx, "上升", 1060, y - 5, "#d9f8f1", "#0f6f64");
    }
    y += 150;
  }

  ctx.fillStyle = "#61716e";
  ctx.font = "400 18px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText("口径：库存天数 = 当前库存 ÷ 近28天日均出库；建议补货按安全周期补足并按起发量取整。", 60, 1540);
}

function drawReportMetric(ctx, x, y, label, value) {
  drawRoundRect(ctx, x, y, 220, 86, 8, "#f8fbfa", "#dce5e2");
  ctx.fillStyle = "#61716e";
  ctx.font = "700 17px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(label, x + 20, y + 30);
  ctx.fillStyle = "#172421";
  ctx.font = "900 32px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(value, x + 20, y + 66);
}

function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

async function drawSkuImage(ctx, record, x, y, width, height) {
  if (record.imageUrl) {
    try {
      const image = await loadImage(record.imageUrl);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 8);
      ctx.clip();
      ctx.drawImage(image, x, y, width, height);
      ctx.restore();
      return;
    } catch {
      // fall through to placeholder
    }
  }

  drawRoundRect(ctx, x, y, width, height, 8, "#edf2f0", "#dce5e2");
  ctx.fillStyle = "#75908a";
  ctx.font = "900 22px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(record.skuId.slice(-4), x + 17, y + 51);
}

function drawSmallBadge(ctx, label, x, y, fill, color) {
  drawRoundRect(ctx, x, y, 58, 30, 15, fill, null);
  ctx.fillStyle = color;
  ctx.font = "800 17px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(label, x + 14, y + 21);
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = String(text).split("");
  let line = "";
  let lines = 0;
  for (let index = 0; index < chars.length; index += 1) {
    const test = line + chars[index];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      line = chars[index];
      lines += 1;
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) {
    ctx.fillText(line, x, y + lines * lineHeight);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function downloadBossReport() {
  const canvas = $("bossCanvas");
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "智能补货系统-老板图片报表.png";
    anchor.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function exportWorkbook() {
  if (!state.records.length) {
    alert("请先导入底表。");
    return;
  }
  if (!window.XLSX) {
    alert("Excel 导出组件未加载，请检查网络后重试。也可以先使用“导出当前表”。");
    return;
  }

  const workbook = window.XLSX.utils.book_new();
  const tabs = [
    ["补货清单", buildReplenishmentTable()],
    ["滞销唤醒", buildWakeTable()],
    ["八仓配比", buildAllocationTable()],
    ["运营明细", buildOpsTable()],
    ["长库龄治理", buildAgingTable()],
  ];
  tabs.forEach(([name, table]) => {
    const sheet = window.XLSX.utils.aoa_to_sheet([table.headers, ...table.rows]);
    window.XLSX.utils.book_append_sheet(workbook, sheet, name);
  });
  window.XLSX.writeFile(workbook, "智能补货系统-结果表.xlsx");
}

function downloadCsv(filename, headers, rows) {
  if (!state.records.length) {
    alert("请先导入底表。");
    return;
  }
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadText(filename, "\uFEFF" + csv, "text/csv;charset=utf-8");
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseDelimitedText(text) {
  const trimmed = text.replace(/^\uFEFF/, "");
  const firstLine = trimmed.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? "\t" : ",";
  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    const next = trimmed[index + 1];
    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }
    if (char === delimiter && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows.shift().map((header) => String(header || "").trim());
  return rows.map((cells) => {
    const output = {};
    headers.forEach((header, index) => {
      output[header || `字段${index + 1}`] = cells[index] ?? "";
    });
    return output;
  });
}

function collectHeaders(rows) {
  const set = new Set();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => set.add(key));
  });
  return Array.from(set);
}

function pick(row, aliases) {
  const headers = Object.keys(row);
  const found = findHeader(headers, aliases);
  return found ? row[found] : "";
}

function pickWarehouse(row, warehouse, type) {
  const header = findWarehouseHeader(Object.keys(row), warehouse, type);
  return header ? row[header] : "";
}

function findHeader(headers, aliases) {
  const normalizedAliases = aliases.map(normalizeHeader);
  const exact = headers.find((header) => normalizedAliases.includes(normalizeHeader(header)));
  if (exact) return exact;
  return headers.find((header) => normalizedAliases.some((alias) => normalizeHeader(header).includes(alias)));
}

function findWarehouseHeader(headers, warehouse, type) {
  const wh = normalizeHeader(warehouse);
  const keywords = WH_KEYWORDS[type].map(normalizeHeader);
  const excludes = WH_EXCLUDES[type].map(normalizeHeader);

  return headers.find((header) => {
    const normalized = normalizeHeader(header);
    return normalized.includes(wh) && keywords.some((keyword) => normalized.includes(keyword)) && !excludes.some((keyword) => normalized.includes(keyword));
  });
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）_\-\/]/g, "");
}

function normalizeImageKey(name) {
  return String(name || "")
    .trim()
    .replace(/\.[^.]+$/, "")
    .toLowerCase();
}

function resolveImageUrl(skuId, imageName) {
  const keys = [skuId, imageName].map(normalizeImageKey).filter(Boolean);
  for (const key of keys) {
    if (state.imageMap.has(key)) return state.imageMap.get(key);
  }
  return "";
}

function isExcluded(category, seasonal) {
  const text = `${category} ${seasonal}`.toLowerCase();
  if (/否|false|不排除/.test(text) && !/棉拖|凉拖/.test(text)) return false;
  return /是|true|排除|季节|棉拖|凉拖/.test(text);
}

function isC1Aging(ageGrade, ageDays) {
  const text = String(ageGrade || "").toLowerCase();
  return /c1|≥120|>=120|120天/.test(text) || Number(ageDays) >= 120;
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/，/g, "")
    .replace(/双|天|元|¥|￥|\s/g, "")
    .trim();
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
}

function toRatio(value) {
  if (value === null || value === undefined || value === "") return 0;
  const text = String(value).trim();
  const number = toNumber(text);
  if (!number) return 0;
  return text.includes("%") || number > 1 ? number / 100 : number;
}

function positiveNumber(value, fallback) {
  const number = toNumber(value);
  return number > 0 ? number : fallback;
}

function textValue(value) {
  return String(value ?? "").trim();
}

function roundToPack(value, packUnit) {
  if (value <= 0) return 0;
  const unit = Math.max(1, Math.round(packUnit || 1));
  return Math.ceil(value / unit) * unit;
}

function formatNumber(value) {
  const number = Number(value) || 0;
  return Math.round(number).toLocaleString("zh-CN");
}

function formatDecimal(value) {
  const number = Number(value) || 0;
  return number.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
}

function formatPercent(value) {
  const number = Number(value) || 0;
  return `${(number * 100).toFixed(1)}%`;
}

function formatDays(value) {
  if (value >= 998) return "999+ 天";
  return `${formatDecimal(value)} 天`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
