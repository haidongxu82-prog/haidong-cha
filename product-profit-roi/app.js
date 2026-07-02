const STORAGE_KEY = "haidong.product-profit-roi.v1";

const tabs = [
  ["dashboard", "利润看板"],
  ["products", "基础产品"],
  ["bundles", "组合装"],
  ["query", "编码联动"],
  ["ads", "投放 ROI"],
  ["io", "导入导出"],
];

const emptyState = () => ({
  products: [],
  bundles: [],
  ads: [],
  logs: [],
});

let state = loadState();
let activeTab = "dashboard";
let editingProductId = null;
let editingBundleId = null;
let editingAdId = null;

const view = document.querySelector("#view");
const pageTitle = document.querySelector("#pageTitle");
const toast = document.querySelector("#toast");

document.querySelector("#tabs").innerHTML = tabs
  .map(([key, label]) => `<button type="button" data-tab="${key}">${label}</button>`)
  .join("");

document.querySelector("#tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-tab]");
  if (!button) return;
  activeTab = button.dataset.tab;
  render();
});

document.querySelector("#seedBtn").addEventListener("click", () => {
  seedDemo();
  saveState();
  flash("已载入模拟数据");
  render();
});

document.querySelector("#resetBtn").addEventListener("click", () => {
  if (!confirm("确认清空本浏览器里的所有核算数据？")) return;
  state = emptyState();
  saveState();
  flash("已清空本地数据");
  render();
});

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (parsed && Array.isArray(parsed.products)) return parsed;
  } catch (error) {}
  return emptyState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function money(value) {
  const number = Number(value || 0);
  return number.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function percent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toFixed(2)}%`;
}

function roi(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toFixed(2);
}

function numeric(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(String(value).replace(/[,￥¥元\s]/g, ""));
  if (!Number.isFinite(number)) throw new Error("金额和数量必须是数字");
  return Math.round(number * 100) / 100;
}

function rate(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const raw = String(value).trim();
  const number = Number(raw.replace("%", ""));
  if (!Number.isFinite(number)) throw new Error("平台扣点必须是合法数字");
  const result = raw.includes("%") || Math.abs(number) > 1 ? number : number * 100;
  if (result < 0 || result > 100) throw new Error("平台扣点比例必须在 0 到 100% 之间");
  return Math.round(result * 100) / 100;
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function round4(value) {
  return Math.round(Number(value || 0) * 10000) / 10000;
}

function productProfit(product) {
  const platformFee = product.sale_price * product.platform_rate / 100;
  const totalCost = product.cost_price + product.package_fee + platformFee + product.shipping_fee + product.other_fee;
  const profit = product.sale_price - totalCost;
  return {
    platform_fee: round2(platformFee),
    total_cost: round2(totalCost),
    profit: round2(profit),
    profit_rate: product.sale_price ? round2(profit / product.sale_price * 100) : null,
  };
}

function bundleProfit(bundle) {
  const totalProductCost = bundle.items.reduce((sum, item) => {
    const product = findProduct(item.product_code);
    return sum + (product ? product.cost_price * Number(item.quantity || 0) : 0);
  }, 0);
  const platformFee = bundle.sale_price * bundle.platform_rate / 100;
  const totalCost = totalProductCost + bundle.package_fee + platformFee + bundle.shipping_fee + bundle.other_fee;
  const profit = bundle.sale_price - totalCost;
  return {
    total_product_cost: round2(totalProductCost),
    total_cost: round2(totalCost),
    profit: round2(profit),
    profit_rate: bundle.sale_price ? round2(profit / bundle.sale_price * 100) : null,
  };
}

function adMetrics(record) {
  const item = record.item_type === "single" ? findProduct(record.item_code) : findBundle(record.item_code);
  const economics = item
    ? record.item_type === "single"
      ? { sale: item.sale_price, profit: productProfit(item).profit }
      : { sale: item.sale_price, profit: bundleProfit(item).profit }
    : { sale: 0, profit: 0 };
  const adProfit = economics.profit * record.order_count - record.ad_spend;
  return {
    unit_profit: round2(economics.profit),
    roi: record.ad_spend ? round4(record.sales_amount / record.ad_spend) : null,
    break_even_roi: economics.profit > 0 ? round4(economics.sale / economics.profit) : null,
    ad_profit: round2(adProfit),
    ad_profit_rate: record.sales_amount ? round2(adProfit / record.sales_amount * 100) : null,
  };
}

function findProduct(code) {
  return state.products.find((item) => item.product_code.toLowerCase() === String(code || "").toLowerCase());
}

function findBundle(code) {
  return state.bundles.find((item) => item.bundle_code.toLowerCase() === String(code || "").toLowerCase());
}

function todayKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dashboardData() {
  const today = todayKey();
  const todayAds = state.ads.filter((item) => item.date === today);
  const products = state.products.map((product) => ({
    type: "单品",
    code: product.product_code,
    name: product.product_name,
    ...productProfit(product),
  }));
  const bundles = state.bundles.map((bundle) => ({
    type: "组合装",
    code: bundle.bundle_code,
    name: bundle.bundle_name,
    ...bundleProfit(bundle),
  }));
  const allItems = [...products, ...bundles];
  const roiRows = state.ads.map((item) => ({ ...item, ...adMetrics(item) }));
  return {
    metrics: [
      ["总产品数", state.products.length],
      ["总组合装数", state.bundles.length],
      ["今日销售额", money(todayAds.reduce((sum, item) => sum + item.sales_amount, 0))],
      ["今日广告花费", money(todayAds.reduce((sum, item) => sum + item.ad_spend, 0))],
      [
        "今日投放 ROI",
        roi(todayAds.reduce((sum, item) => sum + item.ad_spend, 0)
          ? todayAds.reduce((sum, item) => sum + item.sales_amount, 0) /
              todayAds.reduce((sum, item) => sum + item.ad_spend, 0)
          : null),
      ],
      ["今日投放后利润", money(todayAds.reduce((sum, item) => sum + adMetrics(item).ad_profit, 0))],
      ["低利润数量", allItems.filter((item) => item.profit_rate !== null && item.profit_rate < 20).length],
      ["低 ROI 数量", roiRows.filter((item) => item.roi !== null && item.break_even_roi !== null && item.roi < item.break_even_roi).length],
      ["成本变动记录", state.logs.length],
      ["受影响组合装", state.logs.reduce((sum, item) => sum + item.affected_bundle_count, 0)],
    ],
    lowProfit: allItems.filter((item) => item.profit_rate !== null && item.profit_rate < 20),
    lowRoi: roiRows.filter((item) => item.roi !== null && item.break_even_roi !== null && item.roi < item.break_even_roi),
    negativeProfit: allItems.filter((item) => item.profit < 0),
  };
}

function render() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });
  pageTitle.textContent = tabs.find(([key]) => key === activeTab)?.[1] || "";
  if (activeTab === "dashboard") renderDashboard();
  if (activeTab === "products") renderProducts();
  if (activeTab === "bundles") renderBundles();
  if (activeTab === "query") renderQuery();
  if (activeTab === "ads") renderAds();
  if (activeTab === "io") renderIo();
}

function renderDashboard() {
  const data = dashboardData();
  view.innerHTML = `
    <div class="grid cards">
      ${data.metrics.map(([label, value]) => `<div class="panel card"><span>${label}</span><strong>${value ?? "-"}</strong></div>`).join("")}
    </div>
    <div class="grid" style="margin-top:16px;grid-template-columns:repeat(2,minmax(0,1fr));">
      ${smallTable("利润率低于 20%", data.lowProfit, ["code", "name", "type", "profit", "profit_rate"])}
      ${smallTable("ROI 低于保本 ROI", data.lowRoi, ["date", "item_code", "roi", "break_even_roi", "ad_profit"])}
      ${smallTable("利润为负", data.negativeProfit, ["code", "name", "type", "profit", "profit_rate"])}
      ${smallTable("最近成本变动", state.logs.slice(-10).reverse(), ["product_code", "old_cost_price", "new_cost_price", "affected_bundle_count"])}
    </div>
  `;
}

function smallTable(title, rows, keys) {
  const labels = {
    code: "编码",
    name: "名称",
    type: "类型",
    profit: "利润",
    profit_rate: "利润率",
    date: "日期",
    item_code: "编码",
    roi: "ROI",
    break_even_roi: "保本 ROI",
    ad_profit: "投放后利润",
    product_code: "产品编码",
    old_cost_price: "原成本",
    new_cost_price: "新成本",
    affected_bundle_count: "影响组合装",
  };
  return `
    <section class="panel">
      <div class="panel-head"><h2>${title}</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr>${keys.map((key) => `<th>${labels[key] || key}</th>`).join("")}</tr></thead>
          <tbody>${rows.length ? rows.map((row) => `<tr>${keys.map((key) => `<td>${formatCell(key, row[key])}</td>`).join("")}</tr>`).join("") : `<tr><td class="empty" colspan="${keys.length}">暂无数据</td></tr>`}</tbody>
        </table>
      </div>
    </section>`;
}

function formatCell(key, value) {
  if (["profit", "ad_profit", "old_cost_price", "new_cost_price"].includes(key)) return money(value);
  if (["profit_rate", "ad_profit_rate"].includes(key)) return percent(value);
  if (["roi", "break_even_roi"].includes(key)) return roi(value);
  return value ?? "-";
}

function renderProducts() {
  const rows = state.products.map((item) => ({ ...item, ...productProfit(item) }));
  view.innerHTML = `
    <div class="grid two">
      <form class="panel" id="productForm">
        <div class="panel-head"><h2>${editingProductId ? "编辑产品" : "新增产品"}</h2><button class="btn ghost small" type="button" data-cancel-product>取消</button></div>
        <div class="panel-body form-grid">
          ${input("product_code", "产品编码")}
          ${input("product_name", "产品名称")}
          ${input("category", "分类")}
          ${input("cost_price", "产品成本")}
          ${input("package_fee", "包装费")}
          ${input("platform_rate", "平台扣点 %")}
          ${input("sale_price", "售价")}
          ${input("shipping_fee", "运费成本")}
          ${input("other_fee", "其他成本")}
          ${input("remark", "备注")}
          <button class="btn" type="submit" style="grid-column:1/-1">保存产品</button>
        </div>
      </form>
      <section class="panel">
        <div class="panel-head"><h2>基础产品列表</h2><input class="field" data-product-search placeholder="搜索编码 / 名称" style="max-width:240px" /></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>编码</th><th>名称</th><th>分类</th><th>成本</th><th>售价</th><th>利润</th><th>利润率</th><th>操作</th></tr></thead>
            <tbody data-product-rows>${productRows(rows)}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
  fillProductForm();
  bindProductEvents(rows);
}

function productRows(rows) {
  return rows.length
    ? rows.map((item) => `
      <tr>
        <td><strong>${item.product_code}</strong></td>
        <td>${item.product_name}</td>
        <td>${item.category || "-"}</td>
        <td>${money(item.cost_price)}</td>
        <td>${money(item.sale_price)}</td>
        <td class="${item.profit < 0 ? "negative" : ""}">${money(item.profit)}</td>
        <td>${percent(item.profit_rate)}</td>
        <td><div class="actions"><button class="btn ghost small" data-edit-product="${item.id}">编辑</button><button class="btn danger small" data-delete-product="${item.id}">删除</button></div></td>
      </tr>`).join("")
    : `<tr><td class="empty" colspan="8">暂无产品</td></tr>`;
}

function fillProductForm() {
  if (!editingProductId) return;
  const product = state.products.find((item) => item.id === editingProductId);
  if (!product) return;
  Object.entries(product).forEach(([key, value]) => {
    const field = document.querySelector(`[name="${key}"]`);
    if (field) field.value = value;
  });
}

function bindProductEvents(rows) {
  document.querySelector("[data-cancel-product]").addEventListener("click", () => {
    editingProductId = null;
    renderProducts();
  });
  document.querySelector("#productForm").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const next = {
        id: editingProductId || uid("product"),
        product_code: required(form.get("product_code"), "产品编码不能为空"),
        product_name: required(form.get("product_name"), "产品名称不能为空"),
        category: String(form.get("category") || "").trim(),
        cost_price: numeric(form.get("cost_price")),
        package_fee: numeric(form.get("package_fee")),
        platform_rate: rate(form.get("platform_rate")),
        sale_price: numeric(form.get("sale_price")),
        shipping_fee: numeric(form.get("shipping_fee")),
        other_fee: numeric(form.get("other_fee")),
        remark: String(form.get("remark") || "").trim(),
        updated_at: nowIso(),
      };
      const duplicate = state.products.find((item) => item.product_code.toLowerCase() === next.product_code.toLowerCase() && item.id !== next.id);
      if (duplicate) throw new Error("产品编码不能重复");
      const old = state.products.find((item) => item.id === next.id);
      if (old && old.cost_price !== next.cost_price) {
        const affected = state.bundles.filter((bundle) => bundle.items.some((item) => item.product_code.toLowerCase() === old.product_code.toLowerCase()));
        state.logs.push({
          id: uid("log"),
          product_code: next.product_code,
          product_name: next.product_name,
          old_cost_price: old.cost_price,
          new_cost_price: next.cost_price,
          affected_bundle_count: affected.length,
          changed_at: nowIso(),
        });
      }
      if (old) Object.assign(old, next);
      else state.products.push({ ...next, created_at: nowIso() });
      editingProductId = null;
      saveState();
      flash("产品已保存，关联组合装已联动重算");
      renderProducts();
    } catch (error) {
      alert(error.message);
    }
  });
  document.querySelector("[data-product-search]").addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    document.querySelector("[data-product-rows]").innerHTML = productRows(rows.filter((item) => item.product_code.toLowerCase().includes(query) || item.product_name.toLowerCase().includes(query)));
  });
  document.querySelector("[data-product-rows]").addEventListener("click", productClickHandler);
}

function productClickHandler(event) {
  const edit = event.target.closest("[data-edit-product]");
  const del = event.target.closest("[data-delete-product]");
  if (edit) {
    editingProductId = edit.dataset.editProduct;
    renderProducts();
    return;
  }
  if (del && confirm("确认删除该产品？")) {
    const id = del.dataset.deleteProduct;
    const removed = state.products.find((item) => item.id === id);
    state.products = state.products.filter((item) => item.id !== id);
    state.bundles.forEach((bundle) => {
      bundle.items = bundle.items.filter((item) => item.product_code !== removed?.product_code);
    });
    saveState();
    renderProducts();
  }
}

function renderBundles() {
  const rows = state.bundles.map((item) => ({ ...item, ...bundleProfit(item) }));
  view.innerHTML = `
    <div class="grid two">
      <form class="panel" id="bundleForm">
        <div class="panel-head"><h2>${editingBundleId ? "编辑组合装" : "新增组合装"}</h2><button class="btn ghost small" type="button" data-cancel-bundle>取消</button></div>
        <div class="panel-body">
          <div class="form-grid">
            ${input("bundle_code", "组合装编码")}
            ${input("bundle_name", "组合装名称")}
            ${input("sale_price", "售价")}
            ${input("package_fee", "包装费")}
            ${input("platform_rate", "平台扣点 %")}
            ${input("shipping_fee", "运费成本")}
            ${input("other_fee", "其他成本")}
            ${input("remark", "备注")}
          </div>
          <div style="margin-top:16px">
            <div class="panel-head" style="padding:0 0 10px;border:0"><h2>组合明细</h2><button class="btn ghost small" type="button" data-add-bundle-row>添加</button></div>
            <div id="bundleItems"></div>
          </div>
          <button class="btn" type="submit" style="margin-top:14px;width:100%">保存组合装</button>
        </div>
      </form>
      <section class="panel">
        <div class="panel-head"><h2>组合装列表</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>编码</th><th>名称</th><th>产品数量</th><th>售价</th><th>总成本</th><th>利润</th><th>利润率</th><th>操作</th></tr></thead>
            <tbody data-bundle-rows>${rows.length ? rows.map((item) => `
              <tr><td><strong>${item.bundle_code}</strong></td><td>${item.bundle_name}</td><td>${item.items.reduce((sum, row) => sum + Number(row.quantity || 0), 0)}</td><td>${money(item.sale_price)}</td><td>${money(item.total_cost)}</td><td class="${item.profit < 0 ? "negative" : ""}">${money(item.profit)}</td><td>${percent(item.profit_rate)}</td><td><div class="actions"><button class="btn ghost small" data-edit-bundle="${item.id}">编辑</button><button class="btn danger small" data-delete-bundle="${item.id}">删除</button></div></td></tr>`).join("") : `<tr><td class="empty" colspan="8">暂无组合装</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
  fillBundleForm();
  bindBundleEvents();
}

function bundleRow(item = { product_code: "", quantity: 1 }) {
  return `
    <div class="bundle-row">
      <select class="field" name="bundle_product_code">
        <option value="">选择基础产品</option>
        ${state.products.map((product) => `<option value="${product.product_code}" ${product.product_code === item.product_code ? "selected" : ""}>${product.product_code} - ${product.product_name}</option>`).join("")}
      </select>
      <input class="field" name="bundle_quantity" value="${item.quantity || 1}" />
      <button class="btn ghost small" type="button" data-remove-bundle-row>×</button>
    </div>`;
}

function fillBundleForm() {
  const bundle = editingBundleId ? state.bundles.find((item) => item.id === editingBundleId) : null;
  if (bundle) {
    Object.entries(bundle).forEach(([key, value]) => {
      const field = document.querySelector(`[name="${key}"]`);
      if (field) field.value = value;
    });
  }
  document.querySelector("#bundleItems").innerHTML = (bundle?.items?.length ? bundle.items : [{ product_code: "", quantity: 1 }]).map(bundleRow).join("");
}

function bindBundleEvents() {
  document.querySelector("[data-cancel-bundle]").addEventListener("click", () => {
    editingBundleId = null;
    renderBundles();
  });
  document.querySelector("[data-add-bundle-row]").addEventListener("click", () => {
    document.querySelector("#bundleItems").insertAdjacentHTML("beforeend", bundleRow());
  });
  document.querySelector("#bundleItems").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-bundle-row]");
    if (button) button.closest(".bundle-row").remove();
  });
  document.querySelector("#bundleForm").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const rows = [...document.querySelectorAll(".bundle-row")].map((row) => ({
        product_code: row.querySelector("[name='bundle_product_code']").value,
        quantity: numeric(row.querySelector("[name='bundle_quantity']").value),
      })).filter((row) => row.product_code);
      if (!rows.length) throw new Error("组合装至少需要一个基础产品");
      const next = {
        id: editingBundleId || uid("bundle"),
        bundle_code: required(form.get("bundle_code"), "组合装编码不能为空"),
        bundle_name: required(form.get("bundle_name"), "组合装名称不能为空"),
        sale_price: numeric(form.get("sale_price")),
        package_fee: numeric(form.get("package_fee")),
        platform_rate: rate(form.get("platform_rate")),
        shipping_fee: numeric(form.get("shipping_fee")),
        other_fee: numeric(form.get("other_fee")),
        remark: String(form.get("remark") || "").trim(),
        items: rows,
        updated_at: nowIso(),
      };
      const duplicate = state.bundles.find((item) => item.bundle_code.toLowerCase() === next.bundle_code.toLowerCase() && item.id !== next.id);
      if (duplicate) throw new Error("组合装编码不能重复");
      const old = state.bundles.find((item) => item.id === next.id);
      if (old) Object.assign(old, next);
      else state.bundles.push({ ...next, created_at: nowIso() });
      editingBundleId = null;
      saveState();
      flash("组合装已保存");
      renderBundles();
    } catch (error) {
      alert(error.message);
    }
  });
  document.querySelector("[data-bundle-rows]").addEventListener("click", bundleClickHandler);
}

function bundleClickHandler(event) {
  const edit = event.target.closest("[data-edit-bundle]");
  const del = event.target.closest("[data-delete-bundle]");
  if (edit) {
    editingBundleId = edit.dataset.editBundle;
    renderBundles();
    return;
  }
  if (del && confirm("确认删除该组合装？")) {
    state.bundles = state.bundles.filter((item) => item.id !== del.dataset.deleteBundle);
    saveState();
    renderBundles();
  }
}

function renderQuery() {
  view.innerHTML = `
    <form class="panel" id="queryForm">
      <div class="panel-body form-grid">
        ${input("query_code", "基础产品编码")}
        ${input("query_new_cost", "新成本预估")}
        <button class="btn" type="submit" style="grid-column:1/-1">查询关联组合装</button>
      </div>
    </form>
    <div id="queryResult" style="margin-top:16px"></div>
  `;
  document.querySelector("#queryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = findProduct(form.get("query_code"));
    if (!product) {
      document.querySelector("#queryResult").innerHTML = `<div class="panel empty">未找到该基础产品编码</div>`;
      return;
    }
    const newCost = form.get("query_new_cost") === "" ? null : numeric(form.get("query_new_cost"));
    const related = state.bundles.filter((bundle) => bundle.items.some((item) => item.product_code.toLowerCase() === product.product_code.toLowerCase()));
    document.querySelector("#queryResult").innerHTML = `
      <div class="grid cards">
        <div class="panel card"><span>产品编码</span><strong>${product.product_code}</strong></div>
        <div class="panel card"><span>当前成本</span><strong>${money(product.cost_price)}</strong></div>
        <div class="panel card"><span>当前利润</span><strong>${money(productProfit(product).profit)}</strong></div>
        <div class="panel card"><span>关联组合装</span><strong>${related.length}</strong></div>
      </div>
      <div class="table-wrap" style="margin-top:16px">
        <table>
          <thead><tr><th>组合装编码</th><th>组合装名称</th><th>包含数量</th><th>售价</th><th>当前总成本</th><th>当前利润</th><th>利润率</th><th>投放 ROI</th><th>预估利润变化</th><th>预估新利润率</th></tr></thead>
          <tbody>${related.length ? related.map((bundle) => {
            const calc = bundleProfit(bundle);
            const item = bundle.items.find((row) => row.product_code.toLowerCase() === product.product_code.toLowerCase());
            const ad = state.ads.filter((row) => row.item_type === "bundle" && row.item_code === bundle.bundle_code);
            const sales = ad.reduce((sum, row) => sum + row.sales_amount, 0);
            const spend = ad.reduce((sum, row) => sum + row.ad_spend, 0);
            let impact = null;
            if (newCost !== null) {
              const delta = (newCost - product.cost_price) * Number(item.quantity || 0);
              const nextProfit = calc.profit - delta;
              impact = {
                change: round2(nextProfit - calc.profit),
                rate: bundle.sale_price ? round2(nextProfit / bundle.sale_price * 100) : null,
              };
            }
            return `<tr><td><strong>${bundle.bundle_code}</strong></td><td>${bundle.bundle_name}</td><td>${item.quantity}</td><td>${money(bundle.sale_price)}</td><td>${money(calc.total_cost)}</td><td>${money(calc.profit)}</td><td>${percent(calc.profit_rate)}</td><td>${roi(spend ? sales / spend : null)}</td><td class="${impact?.change < 0 ? "negative" : ""}">${impact ? money(impact.change) : "-"}</td><td>${impact ? percent(impact.rate) : "-"}</td></tr>`;
          }).join("") : `<tr><td class="empty" colspan="10">暂无关联组合装</td></tr>`}</tbody>
        </table>
      </div>
    `;
  });
}

function renderAds() {
  const rows = state.ads.map((item) => ({ ...item, ...adMetrics(item) }));
  view.innerHTML = `
    <div class="grid two">
      <form class="panel" id="adForm">
        <div class="panel-head"><h2>${editingAdId ? "编辑投放数据" : "新增投放数据"}</h2><button class="btn ghost small" type="button" data-cancel-ad>取消</button></div>
        <div class="panel-body form-grid">
          ${input("date", "日期", "date")}
          <label><span>类型</span><select class="field" name="item_type"><option value="single">单品</option><option value="bundle">组合装</option></select></label>
          ${input("item_code", "产品编码 / 组合装编码")}
          ${input("sales_amount", "销售额")}
          ${input("order_count", "订单数")}
          ${input("ad_spend", "广告花费")}
          ${input("refund_amount", "退款金额")}
          ${input("actual_sales_amount", "实际成交金额")}
          <button class="btn" type="submit" style="grid-column:1/-1">保存投放数据</button>
        </div>
      </form>
      <section class="panel">
        <div class="panel-head"><h2>投放 ROI 列表</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>日期</th><th>编码</th><th>类型</th><th>销售额</th><th>订单数</th><th>广告花费</th><th>ROI</th><th>单件利润</th><th>投放后利润</th><th>投放后利润率</th><th>操作</th></tr></thead>
            <tbody data-ad-rows>${rows.length ? rows.map((item) => `<tr><td>${item.date}</td><td><strong>${item.item_code}</strong></td><td>${item.item_type === "single" ? "单品" : "组合装"}</td><td>${money(item.sales_amount)}</td><td>${item.order_count}</td><td>${money(item.ad_spend)}</td><td>${roi(item.roi)}</td><td>${money(item.unit_profit)}</td><td class="${item.ad_profit < 0 ? "negative" : ""}">${money(item.ad_profit)}</td><td>${percent(item.ad_profit_rate)}</td><td><div class="actions"><button class="btn ghost small" data-edit-ad="${item.id}">编辑</button><button class="btn danger small" data-delete-ad="${item.id}">删除</button></div></td></tr>`).join("") : `<tr><td class="empty" colspan="11">暂无投放记录</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
  fillAdForm();
  bindAdEvents();
}

function fillAdForm() {
  const record = editingAdId ? state.ads.find((item) => item.id === editingAdId) : null;
  if (record) {
    Object.entries(record).forEach(([key, value]) => {
      const field = document.querySelector(`[name="${key}"]`);
      if (field) field.value = value;
    });
  } else {
    document.querySelector("[name='date']").value = todayKey();
  }
}

function bindAdEvents() {
  document.querySelector("[data-cancel-ad]").addEventListener("click", () => {
    editingAdId = null;
    renderAds();
  });
  document.querySelector("#adForm").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const type = String(form.get("item_type"));
      const code = required(form.get("item_code"), "编码不能为空");
      if (type === "single" && !findProduct(code)) throw new Error("未找到该基础产品编码");
      if (type === "bundle" && !findBundle(code)) throw new Error("未找到该组合装编码");
      const next = {
        id: editingAdId || uid("ad"),
        date: String(form.get("date") || todayKey()),
        item_type: type,
        item_code: code,
        sales_amount: numeric(form.get("sales_amount")),
        order_count: numeric(form.get("order_count")),
        ad_spend: numeric(form.get("ad_spend")),
        refund_amount: numeric(form.get("refund_amount")),
        actual_sales_amount: numeric(form.get("actual_sales_amount")),
        updated_at: nowIso(),
      };
      const old = state.ads.find((item) => item.id === next.id);
      if (old) Object.assign(old, next);
      else state.ads.push({ ...next, created_at: nowIso() });
      editingAdId = null;
      saveState();
      flash("投放记录已保存");
      renderAds();
    } catch (error) {
      alert(error.message);
    }
  });
  document.querySelector("[data-ad-rows]").addEventListener("click", adClickHandler);
}

function adClickHandler(event) {
  const edit = event.target.closest("[data-edit-ad]");
  const del = event.target.closest("[data-delete-ad]");
  if (edit) {
    editingAdId = edit.dataset.editAd;
    renderAds();
    return;
  }
  if (del && confirm("确认删除该投放记录？")) {
    state.ads = state.ads.filter((item) => item.id !== del.dataset.deleteAd);
    saveState();
    renderAds();
  }
}

function renderIo() {
  view.innerHTML = `
    <div class="grid two">
      <form class="panel" id="importForm">
        <div class="panel-head"><h2>数据导入</h2></div>
        <div class="panel-body">
          <label><span>导入类型</span><select class="field" name="type"><option value="products">基础产品表</option><option value="bundle-items">组合装关系表</option><option value="ads">投放数据表</option></select></label>
          <label style="margin-top:12px"><span>Excel / CSV 文件</span><input class="field" name="file" type="file" accept=".xlsx,.xls,.csv" /></label>
          <button class="btn" type="submit" style="margin-top:12px;width:100%">开始导入</button>
          <div id="importErrors"></div>
        </div>
      </form>
      <section class="panel">
        <div class="panel-head"><h2>数据导出</h2></div>
        <div class="panel-body grid" style="grid-template-columns:repeat(2,minmax(0,1fr));">
          ${exportCard("单品利润表", "products")}
          ${exportCard("组合装利润表", "bundles")}
          ${exportCard("ROI 分析表", "ads")}
          ${exportCard("成本变动影响表", "logs")}
        </div>
      </section>
    </div>
  `;
  document.querySelector("#importForm").addEventListener("submit", importFile);
  view.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", () => exportRows(button.dataset.export, button.dataset.format));
  });
}

function exportCard(title, key) {
  return `<div class="panel card"><span>${title}</span><div style="display:flex;gap:8px;margin-top:12px"><button class="btn ghost small" data-export="${key}" data-format="xlsx">Excel</button><button class="btn ghost small" data-export="${key}" data-format="csv">CSV</button></div></div>`;
}

async function importFile(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const type = String(form.get("type") || "");
  const file = event.currentTarget.querySelector("[name='file']").files[0];
  if (!file) return;
  const rows = await readRows(file);
  const errors = [];
  try {
    if (type === "products") importProducts(rows, errors);
    if (type === "bundle-items") importBundleItems(rows, errors);
    if (type === "ads") importAds(rows, errors);
  } catch (error) {
    errors.push({ row: 0, reason: error.message });
  }
  document.querySelector("#importErrors").innerHTML = errors.length
    ? `<div class="error-list">${errors.map((error) => `<div>第 ${error.row} 行：${error.reason}</div>`).join("")}</div>`
    : "";
  if (!errors.length) {
    saveState();
    flash(`导入成功：${rows.length} 行`);
    renderIo();
  }
}

async function readRows(file) {
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = book.Sheets[book.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function importProducts(rows, errors) {
  rows.forEach((row, index) => {
    try {
      const product = {
        id: uid("product"),
        product_code: required(pick(row, ["product_code", "产品编码", "编码"]), "产品编码不能为空"),
        product_name: required(pick(row, ["product_name", "产品名称", "名称"]), "产品名称不能为空"),
        category: String(pick(row, ["category", "分类"]) || ""),
        cost_price: numeric(pick(row, ["cost_price", "成本", "产品成本"])),
        package_fee: numeric(pick(row, ["package_fee", "包装费", "包装费用"])),
        platform_rate: rate(pick(row, ["platform_rate", "平台扣点", "平台扣点比例"])),
        sale_price: numeric(pick(row, ["sale_price", "售价"])),
        shipping_fee: numeric(pick(row, ["shipping_fee", "运费", "运费成本"])),
        other_fee: numeric(pick(row, ["other_fee", "其他成本"])),
        remark: String(pick(row, ["remark", "备注"]) || ""),
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      const existing = findProduct(product.product_code);
      if (existing) Object.assign(existing, product, { id: existing.id });
      else state.products.push(product);
    } catch (error) {
      errors.push({ row: index + 2, reason: error.message });
    }
  });
}

function importBundleItems(rows, errors) {
  const groups = new Map();
  rows.forEach((row, index) => {
    try {
      const code = required(pick(row, ["bundle_code", "组合装编码", "组合编码"]), "组合装编码不能为空");
      const productCode = required(pick(row, ["product_code", "产品编码", "基础产品编码"]), "产品编码不能为空");
      if (!findProduct(productCode)) throw new Error(`基础产品编码 ${productCode} 不存在`);
      if (!groups.has(code)) {
        groups.set(code, {
          id: uid("bundle"),
          bundle_code: code,
          bundle_name: String(pick(row, ["bundle_name", "组合装名称", "组合名称"]) || code),
          sale_price: numeric(pick(row, ["sale_price", "组合装售价", "售价"])),
          package_fee: numeric(pick(row, ["package_fee", "包装费", "组合装包装费用"])),
          platform_rate: rate(pick(row, ["platform_rate", "平台扣点", "平台扣点比例"])),
          shipping_fee: numeric(pick(row, ["shipping_fee", "运费", "运费成本"])),
          other_fee: numeric(pick(row, ["other_fee", "其他成本"])),
          remark: String(pick(row, ["remark", "备注"]) || ""),
          items: [],
          created_at: nowIso(),
          updated_at: nowIso(),
        });
      }
      groups.get(code).items.push({ product_code: productCode, quantity: numeric(pick(row, ["quantity", "数量"]) || 1) });
    } catch (error) {
      errors.push({ row: index + 2, reason: error.message });
    }
  });
  for (const bundle of groups.values()) {
    const existing = findBundle(bundle.bundle_code);
    if (existing) Object.assign(existing, bundle, { id: existing.id });
    else state.bundles.push(bundle);
  }
}

function importAds(rows, errors) {
  rows.forEach((row, index) => {
    try {
      const typeRaw = String(pick(row, ["item_type", "类型", "单品/组合装"]) || "single");
      const type = ["bundle", "组合装", "组合"].includes(typeRaw) ? "bundle" : "single";
      state.ads.push({
        id: uid("ad"),
        date: String(pick(row, ["date", "日期"]) || todayKey()).slice(0, 10),
        item_type: type,
        item_code: required(pick(row, ["item_code", "编码", "产品编码", "组合装编码"]), "编码不能为空"),
        sales_amount: numeric(pick(row, ["sales_amount", "销售额"])),
        order_count: numeric(pick(row, ["order_count", "订单数", "订单数量"])),
        ad_spend: numeric(pick(row, ["ad_spend", "广告花费"])),
        refund_amount: numeric(pick(row, ["refund_amount", "退款金额"])),
        actual_sales_amount: numeric(pick(row, ["actual_sales_amount", "实际成交金额"])),
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    } catch (error) {
      errors.push({ row: index + 2, reason: error.message });
    }
  });
}

function exportRows(key, format) {
  const rows = {
    products: state.products.map((product) => ({ ...product, ...productProfit(product) })),
    bundles: state.bundles.map((bundle) => ({ ...bundle, ...bundleProfit(bundle), items: bundle.items.map((item) => `${item.product_code} x ${item.quantity}`).join("; ") })),
    ads: state.ads.map((record) => ({ ...record, ...adMetrics(record) })),
    logs: state.logs,
  }[key] || [];
  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
  if (format === "xlsx") {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "数据");
    XLSX.writeFile(book, `${key}.xlsx`);
  } else {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${key}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

function input(name, label, type = "text") {
  return `<label><span>${label}</span><input class="field" name="${name}" type="${type}" /></label>`;
}

function required(value, reason) {
  const text = String(value || "").trim();
  if (!text) throw new Error(reason);
  return text;
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return "";
}

function flash(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function seedDemo() {
  state = emptyState();
  const products = [
    ["DEMO-P001", "草本洗发水 500ml", "洗护", 20.2, 1.2, 5, 59, 6, 2],
    ["DEMO-P002", "柔顺护发素 300ml", "洗护", 12.8, 1, 5, 39, 5, 1],
    ["DEMO-P003", "玻尿酸面膜 10片", "护肤", 22, 1.5, 6, 79, 6, 2.5],
    ["DEMO-P004", "洁面乳 120g", "护肤", 9.6, 0.8, 6, 29.9, 4.5, 0.8],
    ["DEMO-P005", "电动牙刷替换头 4支", "个护", 16.5, 1.2, 4.5, 49.9, 5, 1.5],
    ["DEMO-P006", "旅行收纳包", "家居", 21, 1.5, 5, 36, 7, 1.2],
  ];
  state.products = products.map(([code, name, category, cost, pack, platform, sale, shipping, other]) => ({
    id: uid("product"),
    product_code: code,
    product_name: name,
    category,
    cost_price: cost,
    package_fee: pack,
    platform_rate: platform,
    sale_price: sale,
    shipping_fee: shipping,
    other_fee: other,
    remark: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  }));
  state.bundles = [
    bundleSeed("DEMO-B001", "洗护套装", 89, 2.2, 5, 7, 2, [["DEMO-P001", 1], ["DEMO-P002", 1]]),
    bundleSeed("DEMO-B002", "护肤入门套装", 109, 2.6, 6, 7.5, 2.5, [["DEMO-P003", 1], ["DEMO-P004", 2]]),
    bundleSeed("DEMO-B003", "家庭囤货装", 178, 4, 5.5, 12, 4, [["DEMO-P001", 2], ["DEMO-P002", 2], ["DEMO-P005", 1]]),
    bundleSeed("DEMO-B004", "低毛利引流包", 59, 2.2, 5, 8, 2.4, [["DEMO-P006", 1], ["DEMO-P004", 1]]),
  ];
  const today = todayKey();
  state.ads = [
    adSeed(today, "single", "DEMO-P001", 1770, 30, 260, 59, 1711),
    adSeed(today, "single", "DEMO-P004", 897, 30, 310, 0, 897),
    adSeed(today, "bundle", "DEMO-B001", 3560, 40, 680, 89, 3471),
    adSeed(today, "bundle", "DEMO-B002", 2180, 20, 520, 0, 2180),
    adSeed(today, "bundle", "DEMO-B003", 2670, 15, 430, 178, 2492),
    adSeed(today, "bundle", "DEMO-B004", 944, 16, 420, 0, 944),
  ];
  state.logs = [{
    id: uid("log"),
    product_code: "DEMO-P001",
    product_name: "草本洗发水 500ml",
    old_cost_price: 18.5,
    new_cost_price: 20.2,
    affected_bundle_count: 2,
    changed_at: nowIso(),
  }];
}

function bundleSeed(code, name, sale, pack, platform, shipping, other, items) {
  return {
    id: uid("bundle"),
    bundle_code: code,
    bundle_name: name,
    sale_price: sale,
    package_fee: pack,
    platform_rate: platform,
    shipping_fee: shipping,
    other_fee: other,
    remark: "",
    items: items.map(([product_code, quantity]) => ({ product_code, quantity })),
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function adSeed(date, itemType, itemCode, sales, orders, spend, refund, actual) {
  return {
    id: uid("ad"),
    date,
    item_type: itemType,
    item_code: itemCode,
    sales_amount: sales,
    order_count: orders,
    ad_spend: spend,
    refund_amount: refund,
    actual_sales_amount: actual,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

render();
