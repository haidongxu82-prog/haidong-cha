/* 运营中心 AI 经营日报助手 —— 纯浏览器端引擎
 * 指标计算 / 异常规则引擎 / 报告生成 / 导出，全部在前端完成，零后端。
 * AI 分析采用规则兜底草稿（离线、无成本）。核心原则不变：指标由程序算，不臆造。
 */
(function (global) {
  'use strict';

  // ---------------- CSV 解析 ----------------
  function stripBom(t) {
    return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
  }
  function tokenize(text) {
    const rows = [];
    let field = '', row = [], inQ = false;
    const pushF = () => { row.push(field); field = ''; };
    const pushR = () => { pushF(); rows.push(row); row = []; };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
        continue;
      }
      if (c === '"') inQ = true;
      else if (c === ',') pushF();
      else if (c === '\n') pushR();
      else if (c === '\r') { if (text[i + 1] !== '\n') pushR(); }
      else field += c;
    }
    if (field.length > 0 || row.length > 0) pushR();
    return rows;
  }
  function parseCsv(text) {
    const matrix = tokenize(stripBom(text)).filter(
      (r) => !(r.length === 1 && r[0].trim() === '')
    );
    if (!matrix.length) return { headers: [], rows: [] };
    const headers = matrix[0].map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < matrix.length; i++) {
      const rec = {};
      headers.forEach((h, idx) => (rec[h] = (matrix[i][idx] ?? '').trim()));
      rows.push(rec);
    }
    return { headers, rows };
  }
  function toNumber(v) {
    if (v == null) return 0;
    const s = String(v).replace(/,/g, '').replace(/%/g, '').trim();
    if (s === '') return 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  // ---------------- 字段校验 ----------------
  const REQUIRED = {
    sales: ['date','platform','shop_name','sku_id','product_name','visitors','orders','units_sold','sales_amount'],
    ads: ['date','platform','campaign_id','campaign_name','sku_id','spend','impressions','clicks','conversions','ad_sales_amount'],
    inventory: ['date','sku_id','product_name','stock_qty','available_days','safety_stock','inbound_qty'],
    refunds: ['date','sku_id','product_name','refund_orders','refund_amount','main_refund_reason'],
    competitor: ['date','competitor_name','product_name','price'],
  };
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function mapRow(type, r) {
    switch (type) {
      case 'sales': return { date: r.date, platform: r.platform, shop_name: r.shop_name, sku_id: r.sku_id, product_name: r.product_name, visitors: toNumber(r.visitors), orders: toNumber(r.orders), units_sold: toNumber(r.units_sold), sales_amount: toNumber(r.sales_amount) };
      case 'ads': return { date: r.date, platform: r.platform, campaign_id: r.campaign_id, campaign_name: r.campaign_name, sku_id: r.sku_id, spend: toNumber(r.spend), impressions: toNumber(r.impressions), clicks: toNumber(r.clicks), conversions: toNumber(r.conversions), ad_sales_amount: toNumber(r.ad_sales_amount) };
      case 'inventory': return { date: r.date, sku_id: r.sku_id, product_name: r.product_name, stock_qty: toNumber(r.stock_qty), available_days: toNumber(r.available_days), safety_stock: toNumber(r.safety_stock), inbound_qty: toNumber(r.inbound_qty) };
      case 'refunds': return { date: r.date, sku_id: r.sku_id, product_name: r.product_name, refund_orders: toNumber(r.refund_orders), refund_amount: toNumber(r.refund_amount), main_refund_reason: r.main_refund_reason };
      case 'competitor': return { date: r.date, competitor_name: r.competitor_name, product_name: r.product_name, price: toNumber(r.price), promotion: r.promotion || '', main_image_changed: r.main_image_changed || '', ranking_change: r.ranking_change || '', notes: r.notes || '' };
    }
  }
  function validateCsv(type, text) {
    const { headers, rows } = parseCsv(text);
    const required = REQUIRED[type];
    const missing = required.filter((c) => !headers.includes(c));
    const errors = [];
    if (missing.length) {
      errors.push('缺少必填列：' + missing.join('、'));
      return { rows: [], totalRows: rows.length, validRows: 0, errors, missingColumns: missing };
    }
    const valid = [];
    rows.forEach((r, idx) => {
      const line = idx + 2, rowErr = [];
      if (!DATE_RE.test(r.date || '')) rowErr.push('date 格式应为 YYYY-MM-DD（当前「' + (r.date || '') + '」）');
      for (const col of required) if (r[col] === undefined || r[col] === '') rowErr.push('字段 ' + col + ' 为空');
      if (rowErr.length) errors.push('第 ' + line + ' 行：' + rowErr.join('；'));
      else valid.push(mapRow(type, r));
    });
    return { rows: valid, totalRows: rows.length, validRows: valid.length, errors, missingColumns: [] };
  }

  // ---------------- 指标计算 ----------------
  const safeDiv = (a, b) => (b === 0 ? 0 : a / b);
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const avg = (a) => (a.length ? sum(a) / a.length : 0);
  const round = (n, d = 2) => { const f = 10 ** d; return Math.round(n * f) / f; };
  function delta(cur, base) { return { value: cur - base, pct: base === 0 ? null : (cur - base) / base }; }
  function previousDates(all, target, n) {
    const u = Array.from(new Set(all)).sort();
    return u.filter((d) => d < target).slice(-n);
  }

  function computeSalesMetrics(rows, target) {
    const byDate = new Map();
    rows.forEach((r) => { if (!byDate.has(r.date)) byDate.set(r.date, []); byDate.get(r.date).push(r); });
    const agg = (rs) => ({ salesAmount: sum(rs.map(r=>r.sales_amount)), orders: sum(rs.map(r=>r.orders)), visitors: sum(rs.map(r=>r.visitors)), unitsSold: sum(rs.map(r=>r.units_sold)) });
    const today = agg(byDate.get(target) || []);
    const dates = Array.from(byDate.keys());
    const prevDay = previousDates(dates, target, 1)[0];
    const prev = agg(prevDay ? byDate.get(prevDay) || [] : []);
    const last7 = previousDates(dates, target, 7).map((d) => agg(byDate.get(d) || []));
    const avgSales = avg(last7.map(a=>a.salesAmount)), avgOrders = avg(last7.map(a=>a.orders)), avgVis = avg(last7.map(a=>a.visitors));
    const conv = safeDiv(today.orders, today.visitors), prevConv = safeDiv(prev.orders, prev.visitors);
    const skuMap = new Map();
    (byDate.get(target) || []).forEach((r) => {
      const c = skuMap.get(r.sku_id) || { sku_id: r.sku_id, product_name: r.product_name, sales_amount: 0, orders: 0, units_sold: 0 };
      c.sales_amount += r.sales_amount; c.orders += r.orders; c.units_sold += r.units_sold; skuMap.set(r.sku_id, c);
    });
    return {
      salesAmount: round(today.salesAmount), orders: today.orders, visitors: today.visitors, unitsSold: today.unitsSold,
      conversionRate: round(conv, 4), avgOrderValue: round(safeDiv(today.salesAmount, today.orders)), unitPrice: round(safeDiv(today.salesAmount, today.unitsSold)),
      salesAmountMoM: delta(today.salesAmount, prev.salesAmount), ordersMoM: delta(today.orders, prev.orders), visitorsMoM: delta(today.visitors, prev.visitors),
      conversionRateMoM: delta(conv, prevConv), salesVs7dAvg: delta(today.salesAmount, avgSales), ordersVs7dAvg: delta(today.orders, avgOrders), visitorsVs7dAvg: delta(today.visitors, avgVis),
      sevenDayAvgSales: round(avgSales), sevenDayAvgOrders: round(avgOrders), sevenDayAvgVisitors: round(avgVis),
      skuRanking: Array.from(skuMap.values()).sort((a, b) => b.sales_amount - a.sales_amount),
    };
  }

  function computeAdsMetrics(rows, target) {
    const byDate = new Map();
    rows.forEach((r) => { if (!byDate.has(r.date)) byDate.set(r.date, []); byDate.get(r.date).push(r); });
    const agg = (rs) => ({ spend: sum(rs.map(r=>r.spend)), adSales: sum(rs.map(r=>r.ad_sales_amount)), impressions: sum(rs.map(r=>r.impressions)), clicks: sum(rs.map(r=>r.clicks)), conversions: sum(rs.map(r=>r.conversions)) });
    const today = agg(byDate.get(target) || []);
    const dates = Array.from(byDate.keys());
    const prevDay = previousDates(dates, target, 1)[0];
    const prev = agg(prevDay ? byDate.get(prevDay) || [] : []);
    const roi = safeDiv(today.adSales, today.spend), prevRoi = safeDiv(prev.adSales, prev.spend);
    const cpc = safeDiv(today.spend, today.clicks), prevCpc = safeDiv(prev.spend, prev.clicks);
    return {
      spend: round(today.spend), adSalesAmount: round(today.adSales), impressions: today.impressions, clicks: today.clicks, conversions: today.conversions,
      roi: round(roi), ctr: round(safeDiv(today.clicks, today.impressions), 4), cpc: round(cpc), adConversionRate: round(safeDiv(today.conversions, today.clicks), 4),
      spendMoM: delta(today.spend, prev.spend), adSalesMoM: delta(today.adSales, prev.adSales), roiMoM: delta(roi, prevRoi), cpcMoM: delta(cpc, prevCpc),
    };
  }

  function computeInventoryMetrics(invRows, salesRows, target) {
    const STOCKOUT_DAYS = 7, LOW_UNITS = 5;
    const dates = Array.from(new Set(invRows.map(r=>r.date))).sort();
    let snapDate = target;
    if (!dates.includes(target)) { const b = dates.filter(d=>d<=target); snapDate = b[b.length-1] || dates[dates.length-1]; }
    const snap = invRows.filter(r=>r.date===snapDate);
    const last14 = previousDates(Array.from(new Set(salesRows.map(r=>r.date))), target, 14).concat(target);
    const skuUnits = new Map();
    salesRows.forEach((r) => { if (!last14.includes(r.date)) return; if (!skuUnits.has(r.sku_id)) skuUnits.set(r.sku_id, []); skuUnits.get(r.sku_id).push(r.units_sold); });
    const items = snap.map((r) => {
      const u = skuUnits.get(r.sku_id) || [];
      const dailyAvg = safeDiv(sum(u), Math.max(1, u.length));
      let risk = 'normal';
      if (r.available_days < STOCKOUT_DAYS) risk = 'stockout';
      else if (r.stock_qty > r.safety_stock && dailyAvg < LOW_UNITS) risk = 'overstock';
      return { sku_id: r.sku_id, product_name: r.product_name, stock_qty: r.stock_qty, available_days: r.available_days, safety_stock: r.safety_stock, risk };
    });
    return { totalStock: sum(items.map(i=>i.stock_qty)), stockoutRiskCount: items.filter(i=>i.risk==='stockout').length, overstockRiskCount: items.filter(i=>i.risk==='overstock').length, items };
  }

  function computeRefundMetrics(refundRows, salesRows, target) {
    const todayR = refundRows.filter(r=>r.date===target);
    const todayS = salesRows.filter(r=>r.date===target);
    const ordersBySku = new Map();
    todayS.forEach((r) => ordersBySku.set(r.sku_id, (ordersBySku.get(r.sku_id) || 0) + r.orders));
    const items = todayR.map((r) => {
      const orders = ordersBySku.get(r.sku_id) || 0;
      return { sku_id: r.sku_id, product_name: r.product_name, refund_orders: r.refund_orders, refund_amount: r.refund_amount, refund_rate: round(safeDiv(r.refund_orders, orders), 4), main_refund_reason: r.main_refund_reason };
    });
    const totalRO = sum(items.map(i=>i.refund_orders)), totalO = sum(Array.from(ordersBySku.values()));
    return { totalRefundOrders: totalRO, totalRefundAmount: round(sum(items.map(i=>i.refund_amount))), shopRefundRate: round(safeDiv(totalRO, totalO), 4), items };
  }

  function latestDate(ds) {
    const d = [].concat(ds.sales.map(r=>r.date), ds.ads.map(r=>r.date), ds.inventory.map(r=>r.date), ds.refunds.map(r=>r.date));
    return d.length ? d.sort()[d.length - 1] : '';
  }
  function computeMetrics(ds, target) {
    return { date: target, sales: computeSalesMetrics(ds.sales, target), ads: computeAdsMetrics(ds.ads, target), inventory: computeInventoryMetrics(ds.inventory, ds.sales, target), refunds: computeRefundMetrics(ds.refunds, ds.sales, target) };
  }

  // ---------------- 异常规则引擎 ----------------
  const rulesConfig = {
    sales: { salesDropVs7dAvg: 0.2, ordersDropVs7dAvg: 0.2, conversionDropWhenVisitorsUp: 0.2 },
    ads: { targetRoi: 2.0, spendSurge: 0.3, adSalesLag: 0.3, cpcSurge: 0.2 },
    inventory: { stockoutAvailableDays: 7, overstockLowSalesUnitsPerDay: 5, overstockLowSalesDays: 14 },
    refund: { skuRefundRateVsShopMultiple: 2, concentratedReasonMinOrders: 10 },
  };
  const pctStr = (p) => (p === null ? 'N/A' : (p >= 0 ? '+' : '') + (p * 100).toFixed(1) + '%');
  const money = (n) => '¥' + Math.round(n).toLocaleString('zh-CN');

  function runAnomalyEngine(ds, m, cfg) {
    cfg = cfg || rulesConfig;
    const A = [];
    const { sales, ads, inventory, refunds } = m;
    if (sales.salesVs7dAvg.pct !== null && sales.salesVs7dAvg.pct <= -cfg.sales.salesDropVs7dAvg)
      A.push({ id:'sales_drop', category:'sales', type:'销售下滑', ruleId:'sales.salesDropVs7dAvg', level:'high', description:`今日销售额 ${money(sales.salesAmount)}，较近 7 日均值 ${money(sales.sevenDayAvgSales)} 下降 ${pctStr(sales.salesVs7dAvg.pct)}，超过 ${(cfg.sales.salesDropVs7dAvg*100).toFixed(0)}% 阈值。`, evidence:[`今日销售额 ${money(sales.salesAmount)}`, `近 7 日均值 ${money(sales.sevenDayAvgSales)}`, `环比昨日 ${pctStr(sales.salesAmountMoM.pct)}`] });
    if (sales.ordersVs7dAvg.pct !== null && sales.ordersVs7dAvg.pct <= -cfg.sales.ordersDropVs7dAvg)
      A.push({ id:'orders_drop', category:'sales', type:'订单下滑', ruleId:'sales.ordersDropVs7dAvg', level:'medium', description:`今日订单量 ${sales.orders}，较近 7 日均值 ${sales.sevenDayAvgOrders} 下降 ${pctStr(sales.ordersVs7dAvg.pct)}，超过 ${(cfg.sales.ordersDropVs7dAvg*100).toFixed(0)}% 阈值。`, evidence:[`今日订单量 ${sales.orders}`, `近 7 日均值 ${sales.sevenDayAvgOrders}`] });
    if (sales.visitorsMoM.value > 0 && sales.conversionRateMoM.pct !== null && sales.conversionRateMoM.pct <= -cfg.sales.conversionDropWhenVisitorsUp)
      A.push({ id:'conversion_anomaly', category:'sales', type:'转化异常', ruleId:'sales.conversionDropWhenVisitorsUp', level:'high', description:`访客环比 ${pctStr(sales.visitorsMoM.pct)}（上涨），但转化率环比 ${pctStr(sales.conversionRateMoM.pct)}（下降），降幅超过 ${(cfg.sales.conversionDropWhenVisitorsUp*100).toFixed(0)}% 阈值。`, evidence:[`今日访客 ${sales.visitors}，环比 ${pctStr(sales.visitorsMoM.pct)}`, `今日转化率 ${(sales.conversionRate*100).toFixed(2)}%，环比 ${pctStr(sales.conversionRateMoM.pct)}`] });
    if (ads.spend > 0 && ads.roi < cfg.ads.targetRoi)
      A.push({ id:'roi_below_target', category:'ads', type:'投放亏损风险', ruleId:'ads.targetRoi', level:'high', description:`今日广告 ROI ${ads.roi.toFixed(2)}，低于目标 ROI ${cfg.ads.targetRoi.toFixed(1)}。`, evidence:[`广告消耗 ${money(ads.spend)}`, `广告成交额 ${money(ads.adSalesAmount)}`, `ROI ${ads.roi.toFixed(2)}（目标 ${cfg.ads.targetRoi.toFixed(1)}）`] });
    if (ads.spendMoM.pct !== null && ads.spendMoM.pct >= cfg.ads.spendSurge && (ads.adSalesMoM.pct === null || ads.adSalesMoM.pct < cfg.ads.adSalesLag))
      A.push({ id:'spend_surge', category:'ads', type:'消耗异常', ruleId:'ads.spendSurge', level:'medium', description:`广告消耗环比 ${pctStr(ads.spendMoM.pct)}，涨幅超过 ${(cfg.ads.spendSurge*100).toFixed(0)}%，但广告成交额环比仅 ${pctStr(ads.adSalesMoM.pct)}，未同步上涨。`, evidence:[`广告消耗环比 ${pctStr(ads.spendMoM.pct)}`, `广告成交额环比 ${pctStr(ads.adSalesMoM.pct)}`] });
    if (ads.cpcMoM.pct !== null && ads.cpcMoM.pct >= cfg.ads.cpcSurge)
      A.push({ id:'cpc_surge', category:'ads', type:'点击成本异常', ruleId:'ads.cpcSurge', level:'medium', description:`CPC 环比 ${pctStr(ads.cpcMoM.pct)}，涨幅超过 ${(cfg.ads.cpcSurge*100).toFixed(0)}% 阈值。`, evidence:[`今日 CPC ¥${ads.cpc.toFixed(2)}`, `CPC 环比 ${pctStr(ads.cpcMoM.pct)}`] });
    inventory.items.forEach((it) => {
      if (it.available_days < cfg.inventory.stockoutAvailableDays)
        A.push({ id:'stockout:'+it.sku_id, category:'inventory', type:'断货风险', ruleId:'inventory.stockoutAvailableDays', level:'high', relatedSku:it.sku_id, description:`${it.product_name}（${it.sku_id}）可售天数 ${it.available_days} 天，低于 ${cfg.inventory.stockoutAvailableDays} 天阈值。`, evidence:[`当前库存 ${it.stock_qty}`, `可售天数 ${it.available_days} 天`, `安全库存 ${it.safety_stock}`] });
      if (it.risk === 'overstock')
        A.push({ id:'overstock:'+it.sku_id, category:'inventory', type:'滞销风险', ruleId:'inventory.overstockLowSales', level:'medium', relatedSku:it.sku_id, description:`${it.product_name}（${it.sku_id}）库存 ${it.stock_qty} 高于安全库存 ${it.safety_stock}，且近 ${cfg.inventory.overstockLowSalesDays} 天日均销量低于 ${cfg.inventory.overstockLowSalesUnitsPerDay} 件。`, evidence:[`当前库存 ${it.stock_qty}`, `安全库存 ${it.safety_stock}`, `可售天数 ${it.available_days} 天`] });
    });
    const shopRate = refunds.shopRefundRate;
    refunds.items.forEach((it) => {
      if (shopRate > 0 && it.refund_rate > shopRate * cfg.refund.skuRefundRateVsShopMultiple)
        A.push({ id:'refund_rate:'+it.sku_id, category:'refund', type:'退款异常', ruleId:'refund.skuRefundRateVsShopMultiple', level:'high', relatedSku:it.sku_id, description:`${it.product_name}（${it.sku_id}）退款率 ${(it.refund_rate*100).toFixed(1)}%，高于店铺平均 ${(shopRate*100).toFixed(1)}% 的 ${cfg.refund.skuRefundRateVsShopMultiple} 倍。`, evidence:[`SKU 退款率 ${(it.refund_rate*100).toFixed(1)}%`, `店铺平均退款率 ${(shopRate*100).toFixed(1)}%`, `退款订单 ${it.refund_orders} 单`] });
      if (it.refund_orders >= cfg.refund.concentratedReasonMinOrders && it.main_refund_reason)
        A.push({ id:'refund_reason:'+it.sku_id, category:'refund', type:'质量或描述风险', ruleId:'refund.concentratedReason', level:'medium', relatedSku:it.sku_id, description:`${it.product_name}（${it.sku_id}）退款订单达 ${it.refund_orders} 单，且退款原因集中于「${it.main_refund_reason}」。`, evidence:[`退款订单 ${it.refund_orders} 单`, `退款金额 ${money(it.refund_amount)}`, `主要退款原因：${it.main_refund_reason}`] });
    });
    return A;
  }

  // ---------------- 规则兜底草稿 ----------------
  function overallStatus(anomalies) {
    if (anomalies.some((a) => a.level === 'high')) return '异常';
    if (anomalies.length) return '需关注';
    return '正常';
  }
  function buildFallbackDraft(date, m, anomalies) {
    const { sales, ads, inventory, refunds } = m;
    const status = overallStatus(anomalies);
    const summary = `${date} 整体经营表现：${status}。销售额 ${money(sales.salesAmount)}（环比 ${pctStr(sales.salesAmountMoM.pct)}，较近7日均值 ${pctStr(sales.salesVs7dAvg.pct)}），订单 ${sales.orders} 单，访客 ${sales.visitors}，转化率 ${(sales.conversionRate*100).toFixed(2)}%，广告 ROI ${ads.roi}。本日规则引擎共识别 ${anomalies.length} 项异常。（本草稿由规则引擎兜底生成，未接入 AI）`;
    const highlights = anomalies.length === 0
      ? [{ title:'经营指标平稳', evidence:[`销售额 ${money(sales.salesAmount)}`, `广告 ROI ${ads.roi}`, `店铺退款率 ${(refunds.shopRefundRate*100).toFixed(2)}%`] }]
      : [{ title:'SKU 销售 TOP1', evidence: sales.skuRanking.slice(0,1).map((s)=>`${s.product_name} 销售额 ${money(s.sales_amount)}`) }];
    const aiAnomalies = anomalies.map((a) => ({ type:a.type, level:a.level, description:a.description, evidence:a.evidence, possible_causes:['可能与近期投放、活动、竞品或供应链变化有关，需人工核实'], recommended_checks:['请运营负责人结合后台数据人工排查该项异常的具体原因'], confidence:'medium', need_human_review:true, need_boss_attention:a.level==='high' }));
    const actions = [];
    if (inventory.stockoutRiskCount > 0) actions.push({ action:'请运营/商品负责人人工核对断货风险 SKU 的补货计划', reason:`存在 ${inventory.stockoutRiskCount} 个断货风险 SKU`, risk:'high' });
    if (ads.roi < 2) actions.push({ action:'请广告负责人人工检查投放结构与关键词，暂不做自动调整', reason:`广告 ROI ${ads.roi} 偏低`, risk:'medium' });
    actions.push({ action:'建议先人工确认异常，再决定是否调整策略', reason:'所有涉及金额/库存/预算的动作均需人工审核', risk:'low' });
    const boss = `${date} 经营${status}。销售额 ${money(sales.salesAmount)}（环比 ${pctStr(sales.salesAmountMoM.pct)}），订单 ${sales.orders} 单，广告 ROI ${ads.roi}，退款率 ${(refunds.shopRefundRate*100).toFixed(2)}%。今日识别 ${anomalies.length} 项异常${anomalies.length ? '：'+anomalies.map(a=>a.type).join('、') : ''}。建议先人工排查确认，再决定后续动作。`;
    return { summary, highlights, anomalies: aiAnomalies, today_actions: actions, boss_report: boss };
  }

  // ---------------- 老板日报 Markdown / HTML ----------------
  const levelZh = (l) => (l === 'high' ? '高' : l === 'medium' ? '中' : '低');
  function buildBossMarkdown(date, m, draft) {
    const { sales, ads, inventory, refunds } = m;
    const status = draft.anomalies.some(a=>a.level==='high') ? '异常' : draft.anomalies.length ? '需关注' : '正常';
    const L = [];
    L.push(`# 昨日经营日报（${date}）`, '', '## 一、整体结论', `昨日整体经营表现：**${status}**。`, '', draft.summary || '（无总结）', '');
    L.push('## 二、核心数据');
    L.push(`- 销售额：${money(sales.salesAmount)}（环比 ${pctStr(sales.salesAmountMoM.pct)}）`);
    L.push(`- 订单量：${sales.orders}（环比 ${pctStr(sales.ordersMoM.pct)}）`);
    L.push(`- 访客数：${sales.visitors}（环比 ${pctStr(sales.visitorsMoM.pct)}）`);
    L.push(`- 转化率：${(sales.conversionRate*100).toFixed(2)}%（环比 ${pctStr(sales.conversionRateMoM.pct)}）`);
    L.push(`- 广告消耗：${money(ads.spend)}（环比 ${pctStr(ads.spendMoM.pct)}）`);
    L.push(`- ROI：${ads.roi}（环比 ${pctStr(ads.roiMoM.pct)}）`);
    L.push(`- 退款率：${(refunds.shopRefundRate*100).toFixed(2)}%`);
    L.push(`- 库存风险：断货 ${inventory.stockoutRiskCount} 个 / 滞销 ${inventory.overstockRiskCount} 个`, '');
    L.push('## 三、关键异常');
    const bossA = draft.anomalies.filter(a=>a.need_boss_attention);
    const shown = bossA.length ? bossA : draft.anomalies;
    if (!shown.length) L.push('暂无关键异常。');
    else shown.forEach((a, i) => { L.push(`### 异常 ${i+1}：${a.type}`, `- 风险等级：${levelZh(a.level)}`, `- 数据依据：${a.evidence.join('；') || '（见明细）'}`, `- 可能原因：${a.possible_causes.join('；') || '待人工确认'}`, `- 建议排查：${a.recommended_checks.join('；') || '请运营人工核实'}`, `- 是否需要老板关注：${a.need_boss_attention ? '是' : '否'}`, ''); });
    L.push('## 四、今日建议');
    if (!draft.today_actions.length) L.push('1. 暂无特别建议，保持日常运营。');
    else draft.today_actions.forEach((t, i) => L.push(`${i+1}. ${t.action}（依据：${t.reason}）`));
    L.push('', '## 五、需要老板决策的问题');
    const dec = draft.anomalies.filter(a=>a.need_boss_attention && a.level==='high');
    if (!dec.length) L.push('- 暂无需要老板即时决策的问题。');
    else dec.forEach((a) => L.push(`- ${a.type}：${a.description}`));
    L.push('', '> 说明：本日报由系统计算指标、规则引擎判定异常、AI 生成分析草稿，并经运营负责人人工审核确认。所有涉及价格、预算、库存、退款、发货的动作均需人工执行。');
    return L.join('\n');
  }
  function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function inlineMd(s) { return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function markdownToHtml(md) {
    const lines = md.split('\n'), out = []; let list = null;
    const close = () => { if (list) { out.push('</' + list + '>'); list = null; } };
    for (const raw of lines) {
      const line = raw.replace(/\s+$/,'');
      if (line === '') { close(); continue; }
      if (line.startsWith('### ')) { close(); out.push('<h3>'+inlineMd(line.slice(4))+'</h3>'); }
      else if (line.startsWith('## ')) { close(); out.push('<h2>'+inlineMd(line.slice(3))+'</h2>'); }
      else if (line.startsWith('# ')) { close(); out.push('<h1>'+inlineMd(line.slice(2))+'</h1>'); }
      else if (line.startsWith('> ')) { close(); out.push('<blockquote>'+inlineMd(line.slice(2))+'</blockquote>'); }
      else if (/^\d+\.\s/.test(line)) { if (list !== 'ol') { close(); out.push('<ol>'); list='ol'; } out.push('<li>'+inlineMd(line.replace(/^\d+\.\s/,''))+'</li>'); }
      else if (line.startsWith('- ')) { if (list !== 'ul') { close(); out.push('<ul>'); list='ul'; } out.push('<li>'+inlineMd(line.slice(2))+'</li>'); }
      else { close(); out.push('<p>'+inlineMd(line)+'</p>'); }
    }
    close();
    return out.join('\n');
  }
  function buildBossHtml(date, md) {
    return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>经营日报 ${escapeHtml(date)}</title>\n<style>body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#1f2937;line-height:1.7}h1{font-size:24px;border-bottom:2px solid #2563eb;padding-bottom:8px}h2{font-size:18px;margin-top:28px;color:#111827}h3{font-size:15px;margin-top:18px;color:#b91c1c}ul,ol{padding-left:22px}li{margin:4px 0}blockquote{border-left:3px solid #d1d5db;margin:16px 0;padding:8px 14px;color:#6b7280;background:#f9fafb;font-size:13px}strong{color:#b91c1c}</style>\n</head><body>\n${markdownToHtml(md)}\n</body></html>`;
  }

  global.OADR = {
    parseCsv, toNumber, validateCsv, REQUIRED,
    computeMetrics, latestDate, computeSalesMetrics, computeAdsMetrics, computeInventoryMetrics, computeRefundMetrics,
    rulesConfig, runAnomalyEngine, buildFallbackDraft, buildBossMarkdown, markdownToHtml, buildBossHtml,
    helpers: { money, pctStr, safeDiv, delta, previousDates, round },
  };
})(window);
