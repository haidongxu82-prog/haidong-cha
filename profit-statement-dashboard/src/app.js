import {
  BENCHMARK_FIELDS,
  DEFAULT_BENCHMARK,
  DEFAULT_RULES,
  DEFAULT_TARGETS,
  EDITABLE_FIELDS,
  FIELD_DEFINITIONS,
  METRIC_META,
  MONEY_INPUT_KEYS,
  RATE_METRICS,
  TARGET_FIELDS,
} from "./data.js";
import { analyze, buildSnapshot, computeStatement, getLatestMonth, getStatements } from "./calculations.js";
import { generateMonthlyReport } from "./report.js";
import { createDefaultState, loadState, resetState, saveState } from "./storage.js";
import {
  clone,
  downloadText,
  formatFullMoney,
  formatMoney,
  formatPoints,
  formatRate,
  formatValue,
  normalizeMonth,
  parseNumber,
  uid,
} from "./utils.js";

const root = document.querySelector("#root");

let appState = loadState();
let viewState = {
  activeTab: "dashboard",
  selectedMonth: getLatestMonth(appState.records),
  uploadRows: [],
  uploadHeaders: [],
  fieldMap: {},
  uploadFileName: "",
  uploadError: "",
  toast: "",
  aiDraft: "",
};

function render() {
  document.documentElement.dataset.xlsxReady = globalThis.XLSX ? "true" : "false";
  document.documentElement.dataset.lucideReady = globalThis.lucide ? "true" : "false";
  const months = getStatements(appState.records).map((record) => record.periodMonth);
  if (!viewState.selectedMonth || !months.includes(viewState.selectedMonth)) {
    viewState.selectedMonth = months.at(-1) || "";
  }
  const analysis = analyze(
    appState.records,
    viewState.selectedMonth,
    appState.targets,
    appState.benchmark,
    appState.rules,
  );

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-block">
          <div class="brand-mark">利</div>
          <div>
            <div class="brand-title">利润经营驾驶舱</div>
            <div class="brand-subtitle">确定性公式 · 可配置规则</div>
          </div>
        </div>
        <nav class="nav-list">
          ${navButton("dashboard", "layout-dashboard", "首页")}
          ${navButton("upload", "upload-cloud", "数据上传")}
          ${navButton("ledger", "table-properties", "利润表管理")}
          ${navButton("goals", "target", "目标与标杆")}
          ${navButton("rules", "sliders-horizontal", "经营规则")}
          ${navButton("analysis", "scan-search", "月度分析")}
          ${navButton("report", "file-text", "月度报告")}
        </nav>
        <button class="ghost-button sidebar-reset" data-action="reset-demo">
          <i data-lucide="rotate-ccw"></i>
          重置演示数据
        </button>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1>${pageTitle(viewState.activeTab)}</h1>
            <p>${analysis ? `${analysis.current.periodMonth} · ${warningSummary(analysis)}` : "暂无利润表数据"}</p>
          </div>
          <div class="topbar-actions">
            <label class="field compact">
              <span>当前月份</span>
              <select data-action="select-month">
                ${months.map((month) => `<option value="${month}" ${month === viewState.selectedMonth ? "selected" : ""}>${month}</option>`).join("")}
              </select>
            </label>
          </div>
        </header>
        ${renderActivePage(analysis)}
      </main>
      ${viewState.toast ? `<div class="toast">${escapeHtml(viewState.toast)}</div>` : ""}
    </div>
  `;

  bindEvents();
  globalThis.lucide?.createIcons({ attrs: { width: 18, height: 18, "stroke-width": 2 } });
}

function navButton(tab, icon, label) {
  return `
    <button class="nav-button ${viewState.activeTab === tab ? "active" : ""}" data-tab="${tab}">
      <i data-lucide="${icon}"></i>
      <span>${label}</span>
    </button>
  `;
}

function pageTitle(tab) {
  const titles = {
    dashboard: "老板利润经营驾驶舱",
    upload: "数据上传",
    ledger: "利润表管理",
    goals: "目标与标杆",
    rules: "经营规则设置中心",
    analysis: "月度分析",
    report: "月度利润复盘报告",
  };
  return titles[tab] || titles.dashboard;
}

function warningSummary(analysis) {
  if (!analysis.warningCount) return "本月无红黄灯预警";
  return `${analysis.redWarningCount} 个红灯 · ${analysis.yellowWarningCount} 个黄灯`;
}

function renderActivePage(analysis) {
  if (!analysis) return renderEmptyState();
  if (viewState.activeTab === "upload") return renderUploadPage();
  if (viewState.activeTab === "ledger") return renderLedgerPage(analysis);
  if (viewState.activeTab === "goals") return renderGoalsPage(analysis);
  if (viewState.activeTab === "rules") return renderRulesPage();
  if (viewState.activeTab === "analysis") return renderAnalysisPage(analysis);
  if (viewState.activeTab === "report") return renderReportPage(analysis);
  return renderDashboard(analysis);
}

function renderEmptyState() {
  return `
    <section class="empty-state">
      <i data-lucide="database"></i>
      <h2>暂无利润表数据</h2>
      <button class="primary-button" data-tab="upload">
        <i data-lucide="upload-cloud"></i>
        上传利润表
      </button>
    </section>
  `;
}

function renderDashboard(analysis) {
  const current = analysis.current;
  return `
    <section class="metric-grid">
      ${metricCard("销售收入", formatMoney(current.salesRevenue), momLine(analysis, "salesRevenue"), "blue", "wallet")}
      ${metricCard("净利润", formatMoney(current.netProfit), momLine(analysis, "netProfit"), current.netProfit >= 0 ? "green" : "red", "circle-dollar-sign")}
      ${metricCard("毛利率", formatRate(current.grossMargin), momLine(analysis, "grossMargin"), "green", "chart-no-axes-combined")}
      ${metricCard("净利率", formatRate(current.netMargin), momLine(analysis, "netMargin"), current.netMargin >= appState.targets.targetNetMargin ? "green" : "amber", "badge-percent")}
      ${metricCard("年度利润完成率", formatRate(analysis.annualProfitCompletion), `时间进度 ${formatRate(analysis.timeProgress)}`, analysis.annualProfitCompletion >= analysis.timeProgress ? "green" : "amber", "flag")}
      ${metricCard("本月预警", `${analysis.warningCount} 条`, `${analysis.redWarningCount} 红灯 · ${analysis.yellowWarningCount} 黄灯`, analysis.redWarningCount ? "red" : analysis.yellowWarningCount ? "amber" : "green", "alarm-clock")}
    </section>

    <section class="dashboard-grid">
      <div class="panel wide">
        <div class="panel-header">
          <h2>收入与利润趋势</h2>
          <span>${analysis.statements[0]?.periodMonth} - ${analysis.statements.at(-1)?.periodMonth}</span>
        </div>
        ${renderTrendChart(analysis.statements)}
      </div>
      <div class="panel">
        <div class="panel-header">
          <h2>年度目标进度</h2>
          <span>${appState.targets.year}</span>
        </div>
        ${progressRow("销售目标", analysis.annualSalesCompletion, analysis.timeProgress)}
        ${progressRow("利润目标", analysis.annualProfitCompletion, analysis.timeProgress)}
        <div class="divider"></div>
        <div class="mini-stat">
          <span>累计净利润</span>
          <strong>${formatFullMoney(analysis.cumulativeProfit)}</strong>
        </div>
        <div class="mini-stat">
          <span>年度利润目标</span>
          <strong>${formatFullMoney(appState.targets.annualNetProfitTarget)}</strong>
        </div>
      </div>
      <div class="panel wide">
        <div class="panel-header">
          <h2>本月异常预警</h2>
          <button class="text-button" data-tab="analysis">查看分析</button>
        </div>
        ${renderWarnings(analysis.warnings)}
      </div>
      <div class="panel">
        <div class="panel-header">
          <h2>下月关注</h2>
          <span>系统规则</span>
        </div>
        ${renderSuggestionList(analysis.suggestions)}
      </div>
    </section>
  `;
}

function metricCard(label, value, subline, tone, icon) {
  return `
    <article class="metric-card tone-${tone}">
      <div class="metric-icon"><i data-lucide="${icon}"></i></div>
      <div>
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${subline}</small>
      </div>
    </article>
  `;
}

function momLine(analysis, metricKey) {
  const row = analysis.comparisons.find((item) => item.metricKey === metricKey);
  if (!row || !analysis.previous) return "缺少上月数据";
  return `环比 ${row.changeDisplay}`;
}

function renderUploadPage() {
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>Excel 上传与字段映射</h2>
        <span>${viewState.uploadFileName ? escapeHtml(viewState.uploadFileName) : "SheetJS 解析"}</span>
      </div>
      <div class="upload-box">
        <input id="excel-file" type="file" accept=".xlsx,.xls,.csv" />
        <label for="excel-file">
          <i data-lucide="upload-cloud"></i>
          <strong>选择利润表文件</strong>
          <span>.xlsx / .xls / .csv</span>
        </label>
      </div>
      ${viewState.uploadError ? `<div class="alert red">${escapeHtml(viewState.uploadError)}</div>` : ""}
      ${
        viewState.uploadRows.length
          ? `
            <div class="split-layout">
              <div>
                <h3>字段映射</h3>
                <div class="mapping-list">
                  ${FIELD_DEFINITIONS.map((field) => mappingRow(field)).join("")}
                </div>
              </div>
              <div>
                <h3>数据预览</h3>
                ${renderUploadPreview()}
              </div>
            </div>
            <div class="button-row">
              <button class="primary-button" data-action="save-upload">
                <i data-lucide="save"></i>
                保存利润表
              </button>
              <button class="secondary-button" data-action="clear-upload">
                <i data-lucide="x"></i>
                清空上传
              </button>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function mappingRow(field) {
  return `
    <label class="mapping-row">
      <span>
        ${field.label}
        ${field.required ? `<em>必填</em>` : ""}
      </span>
      <select data-map-key="${field.key}">
        <option value="">不映射</option>
        ${viewState.uploadHeaders
          .map((header) => `<option value="${escapeAttr(header)}" ${viewState.fieldMap[field.key] === header ? "selected" : ""}>${escapeHtml(header)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function renderUploadPreview() {
  const rows = viewState.uploadRows.slice(0, 6);
  return `
    <div class="table-wrap compact-table">
      <table>
        <thead>
          <tr>${viewState.uploadHeaders.slice(0, 8).map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => `
              <tr>
                ${viewState.uploadHeaders.slice(0, 8).map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderLedgerPage() {
  const statements = getStatements(appState.records);
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>历史月份利润表</h2>
        <button class="secondary-button" data-action="add-record">
          <i data-lucide="plus"></i>
          新增月份
        </button>
      </div>
      <div class="table-wrap ledger-table">
        <table>
          <thead>
            <tr>
              ${EDITABLE_FIELDS.map((field) => `<th>${field.label}</th>`).join("")}
              <th>毛利</th>
              <th>毛利率</th>
              <th>总费用</th>
              <th>净利润</th>
              <th>净利率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${statements.map((statement) => renderLedgerRow(statement)).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderLedgerRow(statement) {
  return `
    <tr data-record-id="${statement.id}">
      ${EDITABLE_FIELDS.map((field) => {
        const type = field.key === "periodMonth" ? "month" : "number";
        const step = type === "number" ? "0.01" : "";
        return `
          <td>
            <input class="table-input" type="${type}" step="${step}" data-record-field="${field.key}" value="${escapeAttr(statement[field.key] ?? "")}" />
          </td>
        `;
      }).join("")}
      <td>${formatFullMoney(statement.grossProfit)}</td>
      <td>${formatRate(statement.grossMargin)}</td>
      <td>${formatFullMoney(statement.totalExpense)}</td>
      <td class="${statement.netProfit < 0 ? "negative" : "positive"}">${formatFullMoney(statement.netProfit)}</td>
      <td>${formatRate(statement.netMargin)}</td>
      <td>
        <button class="icon-button danger" title="删除" data-action="delete-record" data-record-id="${statement.id}">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>
  `;
}

function renderGoalsPage(analysis) {
  return `
    <section class="settings-grid">
      <div class="panel">
        <div class="panel-header">
          <h2>年度目标</h2>
          <span>${appState.targets.year}</span>
        </div>
        <div class="form-grid">
          ${settingInput("year", "目标年度", appState.targets.year, "number")}
          ${settingInput("annualSalesTarget", "年度销售收入目标", appState.targets.annualSalesTarget, "money")}
          ${settingInput("annualNetProfitTarget", "年度净利润目标", appState.targets.annualNetProfitTarget, "money")}
          ${settingInput("targetGrossMargin", "目标毛利率", appState.targets.targetGrossMargin, "percent")}
          ${settingInput("targetNetMargin", "目标净利率", appState.targets.targetNetMargin, "percent")}
          ${settingInput("targetAdCostRate", "目标推广费率", appState.targets.targetAdCostRate, "percent")}
          ${settingInput("targetRefundRate", "目标退款率", appState.targets.targetRefundRate, "percent")}
          ${settingInput("targetLaborCostRate", "目标人工费用率", appState.targets.targetLaborCostRate, "percent")}
          ${settingInput("targetManagementCostRate", "目标管理费用率", appState.targets.targetManagementCostRate, "percent")}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <h2>自定义标杆</h2>
          <span>${escapeHtml(appState.benchmark.benchmarkType)}</span>
        </div>
        <div class="form-grid">
          ${benchmarkInput("benchmarkName", "标杆名称", appState.benchmark.benchmarkName, "text")}
          ${benchmarkInput("benchmarkType", "标杆类型", appState.benchmark.benchmarkType, "text")}
          ${benchmarkInput("grossMargin", "优秀同行毛利率", appState.benchmark.grossMargin, "percent")}
          ${benchmarkInput("netMargin", "优秀同行净利率", appState.benchmark.netMargin, "percent")}
          ${benchmarkInput("adCostRate", "健康推广费率", appState.benchmark.adCostRate, "percent")}
          ${benchmarkInput("refundRate", "健康退款率", appState.benchmark.refundRate, "percent")}
          ${benchmarkInput("laborCostRate", "健康人工费用率", appState.benchmark.laborCostRate, "percent")}
          ${benchmarkInput("managementCostRate", "健康管理费用率", appState.benchmark.managementCostRate, "percent")}
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <h2>当前目标偏差</h2>
        <button class="text-button" data-tab="analysis">查看完整分析</button>
      </div>
      ${renderTargetTable(analysis)}
    </section>
  `;
}

function settingInput(key, label, value, valueType) {
  const displayedValue = valueType === "percent" ? Number(value || 0) * 100 : value;
  return `
    <label class="field">
      <span>${label}</span>
      <input type="${valueType === "money" || valueType === "percent" || valueType === "number" ? "number" : "text"}"
        step="${valueType === "percent" ? "0.1" : "1"}"
        data-target-key="${key}"
        data-value-type="${valueType}"
        value="${escapeAttr(displayedValue)}" />
    </label>
  `;
}

function benchmarkInput(key, label, value, valueType) {
  const displayedValue = valueType === "percent" ? Number(value || 0) * 100 : value;
  return `
    <label class="field">
      <span>${label}</span>
      <input type="${valueType === "percent" ? "number" : valueType}"
        step="${valueType === "percent" ? "0.1" : "1"}"
        data-benchmark-key="${key}"
        data-value-type="${valueType}"
        value="${escapeAttr(displayedValue)}" />
    </label>
  `;
}

function renderRulesPage() {
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>规则模板</h2>
        <span>当前 ${appState.rules.filter((rule) => rule.isEnabled).length} 条启用</span>
      </div>
      <div class="template-row">
        <button class="secondary-button" data-action="apply-template" data-template="steady">
          <i data-lucide="shield-check"></i>
          稳健利润型
        </button>
        <button class="secondary-button" data-action="apply-template" data-template="growth">
          <i data-lucide="rocket"></i>
          增长放大型
        </button>
        <button class="secondary-button" data-action="restore-all-rules">
          <i data-lucide="rotate-ccw"></i>
          恢复系统默认
        </button>
      </div>
    </section>
    <section class="rules-layout">
      ${appState.rules.map((rule) => renderRuleCard(rule)).join("")}
    </section>
    <section class="panel">
      <div class="panel-header">
        <h2>新增自定义规则</h2>
        <span>红黄灯阈值按百分点录入</span>
      </div>
      <div class="custom-rule-form">
        <label class="field">
          <span>规则名称</span>
          <input data-custom-rule="name" value="自定义费用率预警" />
        </label>
        <label class="field">
          <span>指标字段</span>
          <select data-custom-rule="metricKey">
            ${RATE_METRICS.map((key) => `<option value="${key}">${METRIC_META[key].label}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>比较对象</span>
          <select data-custom-rule="compareType">
            <option value="custom-mom-point-increase">环比上涨</option>
            <option value="custom-target-gap">目标偏差</option>
            <option value="custom-benchmark-gap">标杆差距</option>
          </select>
        </label>
        <label class="field">
          <span>黄灯阈值</span>
          <input type="number" step="0.1" data-custom-rule="yellow" value="3" />
        </label>
        <label class="field">
          <span>红灯阈值</span>
          <input type="number" step="0.1" data-custom-rule="red" value="5" />
        </label>
        <label class="field wide-field">
          <span>触发建议</span>
          <input data-custom-rule="suggestion" value="建议进一步拆解该指标的结构、负责人和预算变化。" />
        </label>
        <button class="primary-button" data-action="add-custom-rule">
          <i data-lucide="plus"></i>
          新增规则
        </button>
      </div>
    </section>
  `;
}

function renderRuleCard(rule) {
  const meta = METRIC_META[rule.metricKey] || { label: rule.metricKey };
  return `
    <article class="rule-card" data-rule-id="${rule.id}">
      <div class="rule-head">
        <div>
          <h3>${escapeHtml(rule.ruleName)}</h3>
          <p>${escapeHtml(rule.ruleDescription)}</p>
        </div>
        <label class="switch">
          <input type="checkbox" data-rule-field="isEnabled" ${rule.isEnabled ? "checked" : ""} />
          <span></span>
        </label>
      </div>
      <dl class="rule-meta">
        <div><dt>指标字段</dt><dd>${escapeHtml(meta.label)}</dd></div>
        <div><dt>判断条件</dt><dd>${conditionText(rule)}</dd></div>
        <div><dt>默认黄灯</dt><dd>${thresholdText(rule.defaultYellowThreshold, rule.redOnly)}</dd></div>
        <div><dt>默认红灯</dt><dd>${thresholdText(rule.defaultRedThreshold, rule.redOnly)}</dd></div>
      </dl>
      <div class="rule-inputs">
        <label class="field">
          <span>当前黄灯阈值</span>
          <input type="number" step="0.1" data-rule-field="currentYellowThreshold" value="${escapeAttr((rule.currentYellowThreshold * 100).toFixed(1))}" ${rule.redOnly ? "disabled" : ""} />
        </label>
        <label class="field">
          <span>当前红灯阈值</span>
          <input type="number" step="0.1" data-rule-field="currentRedThreshold" value="${escapeAttr((rule.currentRedThreshold * 100).toFixed(1))}" ${rule.redOnly ? "disabled" : ""} />
        </label>
      </div>
      <label class="field">
        <span>系统提示文案与排查建议</span>
        <textarea data-rule-field="suggestionText">${escapeHtml(rule.suggestionText)}</textarea>
      </label>
      <div class="button-row">
        <button class="primary-button" data-action="save-rule" data-rule-id="${rule.id}">
          <i data-lucide="save"></i>
          保存修改
        </button>
        <button class="secondary-button" data-action="restore-rule" data-rule-id="${rule.id}">
          <i data-lucide="rotate-ccw"></i>
          恢复默认
        </button>
      </div>
    </article>
  `;
}

function conditionText(rule) {
  const meta = METRIC_META[rule.metricKey] || { label: rule.metricKey };
  const texts = {
    "mom-point-increase": `${meta.label} - 上月${meta.label} >= 阈值`,
    "target-gap-lower": `目标${meta.label} - 实际${meta.label} >= 阈值`,
    "revenue-up-profit-down": "本月销售收入 > 上月销售收入，且本月净利润 < 上月净利润",
    "annual-progress-gap": "时间进度 - 年度利润目标完成率 >= 阈值",
    "negative-value": "本月净利润 < 0",
    "expense-growth-faster": "总费用环比增长率 - 销售收入环比增长率 >= 阈值",
    "custom-mom-point-increase": `${meta.label}环比上涨 >= 阈值`,
    "custom-target-gap": `${meta.label}目标偏差 >= 阈值`,
    "custom-benchmark-gap": `${meta.label}标杆差距 >= 阈值`,
  };
  return texts[rule.compareType] || rule.compareType;
}

function thresholdText(value, redOnly) {
  return redOnly ? "直接红灯" : `${(Number(value || 0) * 100).toFixed(1)} 个百分点`;
}

function renderAnalysisPage(analysis) {
  return `
    <section class="metric-grid">
      ${metricCard("销售收入", formatMoney(analysis.current.salesRevenue), momLine(analysis, "salesRevenue"), "blue", "wallet")}
      ${metricCard("净利润", formatMoney(analysis.current.netProfit), momLine(analysis, "netProfit"), analysis.current.netProfit >= 0 ? "green" : "red", "circle-dollar-sign")}
      ${metricCard("推广费率", formatRate(analysis.current.adCostRate), momLine(analysis, "adCostRate"), "amber", "megaphone")}
      ${metricCard("退款率", formatRate(analysis.current.refundRate), momLine(analysis, "refundRate"), "amber", "undo-2")}
    </section>
    <section class="panel">
      <div class="panel-header">
        <h2>跟自己比：历史环比分析</h2>
        <span>${analysis.previous ? `上月 ${analysis.previous.periodMonth}` : "缺少上月"}</span>
      </div>
      ${renderComparisonTable(analysis)}
    </section>
    <section class="two-column">
      <div class="panel">
        <div class="panel-header">
          <h2>跟目标比</h2>
          <span>${appState.targets.year}</span>
        </div>
        ${renderTargetTable(analysis)}
      </div>
      <div class="panel">
        <div class="panel-header">
          <h2>跟标杆比</h2>
          <span>${escapeHtml(appState.benchmark.benchmarkName)}</span>
        </div>
        ${renderBenchmarkTable(analysis)}
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <h2>异常预警</h2>
        <span>${analysis.redWarningCount} 红灯 · ${analysis.yellowWarningCount} 黄灯</span>
      </div>
      ${renderWarnings(analysis.warnings)}
    </section>
    <section class="two-column">
      <div class="panel">
        <div class="panel-header">
          <h2>经营排查建议</h2>
          <span>规则模板</span>
        </div>
        ${renderSuggestionList(analysis.suggestions)}
      </div>
      <div class="panel">
        <div class="panel-header">
          <h2>AI 增值解读</h2>
          <span>接口预留</span>
        </div>
        ${renderAiPanel()}
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <h2>公式与计算快照</h2>
        <button class="secondary-button" data-action="download-snapshot">
          <i data-lucide="download"></i>
          导出快照
        </button>
      </div>
      ${renderFormulaList()}
    </section>
  `;
}

function renderComparisonTable(analysis) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>指标</th>
            <th>上月值</th>
            <th>本月值</th>
            <th>变化值</th>
            <th>变化方向</th>
            <th>系统判断</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.comparisons
            .map((row) => `
              <tr>
                <td>${row.label}</td>
                <td>${analysis.previous ? formatValue(row.previousValue, row.unit) : "无"}</td>
                <td>${formatValue(row.currentValue, row.unit)}</td>
                <td>${row.changeDisplay}</td>
                <td>${row.direction}</td>
                <td><span class="status-pill ${row.judgment === "需要关注" ? "yellow" : row.judgment === "改善" ? "green" : ""}">${row.judgment}</span></td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTargetTable(analysis) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>目标项</th>
            <th>实际值</th>
            <th>目标值</th>
            <th>偏差</th>
            <th>完成率</th>
            <th>判断</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.targetGaps
            .map((row) => `
              <tr>
                <td>${row.label}</td>
                <td>${formatValue(row.actualValue, row.unit)}</td>
                <td>${formatValue(row.targetValue, row.unit)}</td>
                <td>${row.unit === "rate" ? formatPoints(row.gapValue) : formatFullMoney(row.gapValue)}</td>
                <td>${row.completion === null ? "-" : formatRate(row.completion)}</td>
                <td><span class="status-pill ${row.judgment.includes("低于") || row.judgment.includes("高于目标") ? "yellow" : "green"}">${row.judgment}</span></td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderBenchmarkTable(analysis) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>指标</th>
            <th>当前值</th>
            <th>标杆值</th>
            <th>差距</th>
            <th>判断</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.benchmarkGaps
            .map((row) => `
              <tr>
                <td>${row.label}</td>
                <td>${formatValue(row.actualValue, row.unit)}</td>
                <td>${formatValue(row.benchmarkValue, row.unit)}</td>
                <td>${formatPoints(row.gapValue)}</td>
                <td><span class="status-pill ${row.judgment.includes("弱于") ? "yellow" : "green"}">${row.judgment}</span></td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderWarnings(warnings) {
  if (!warnings.length) {
    return `<div class="empty-inline"><i data-lucide="circle-check"></i><span>本月无红黄灯预警</span></div>`;
  }
  return `
    <div class="warning-list">
      ${warnings
        .map((warning) => `
          <article class="warning-item ${warning.level}">
            <div class="warning-level">${warning.levelText}</div>
            <div>
              <h3>${escapeHtml(warning.ruleName)}</h3>
              <dl>
                <div><dt>预警指标</dt><dd>${escapeHtml(warning.metricLabel)}</dd></div>
                <div><dt>当前值</dt><dd>${warning.currentDisplay}</dd></div>
                <div><dt>对比值</dt><dd>${warning.compareDisplay}</dd></div>
                <div><dt>偏差值</dt><dd>${warning.deviationDisplay}</dd></div>
              </dl>
              <p>${escapeHtml(warning.suggestion)}</p>
            </div>
          </article>
        `)
        .join("")}
    </div>
  `;
}

function renderSuggestionList(suggestions) {
  if (!suggestions.length) {
    return `<div class="empty-inline"><i data-lucide="circle-check"></i><span>当前无重点排查建议</span></div>`;
  }
  return `
    <ol class="suggestion-list">
      ${suggestions
        .map((item) => `
          <li class="${item.level}">
            <strong>${escapeHtml(item.ruleName)}</strong>
            <span>${escapeHtml(item.text)}</span>
          </li>
        `)
        .join("")}
    </ol>
  `;
}

function renderAiPanel() {
  return `
    <div class="ai-panel">
      <p>AI 解读仅基于上方系统计算结果生成，供参考，不影响原始分析数据。</p>
      <div class="button-row">
        <button class="secondary-button" data-action="ai-placeholder" data-ai-type="老板版经营复盘">
          <i data-lucide="briefcase-business"></i>
          老板版经营复盘
        </button>
        <button class="secondary-button" data-action="ai-placeholder" data-ai-type="团队会议版整改建议">
          <i data-lucide="users"></i>
          团队会议版整改建议
        </button>
        <button class="secondary-button" data-action="ai-placeholder" data-ai-type="下月利润改善重点">
          <i data-lucide="calendar-check"></i>
          下月利润改善重点
        </button>
      </div>
      ${viewState.aiDraft ? `<div class="ai-draft">${escapeHtml(viewState.aiDraft)}</div>` : ""}
    </div>
  `;
}

function renderFormulaList() {
  const keys = ["grossProfit", "grossMargin", "totalExpense", "netProfit", "netMargin", "adCostRate", "refundRate", "laborCostRate"];
  return `
    <div class="formula-grid">
      ${keys
        .map((key) => `
          <div>
            <strong>${METRIC_META[key].label}</strong>
            <span>${METRIC_META[key].formula}</span>
          </div>
        `)
        .join("")}
    </div>
  `;
}

function renderReportPage(analysis) {
  const report = generateMonthlyReport(analysis, appState.benchmark);
  return `
    <section class="panel report-toolbar">
      <div class="panel-header">
        <h2>${analysis.current.periodMonth} 一页式复盘</h2>
        <div class="button-row">
          <button class="secondary-button" data-action="copy-report">
            <i data-lucide="copy"></i>
            复制文本
          </button>
          <button class="secondary-button" data-action="download-report">
            <i data-lucide="download"></i>
            导出文本
          </button>
          <button class="secondary-button" data-action="print-report">
            <i data-lucide="printer"></i>
            打印
          </button>
        </div>
      </div>
    </section>
    <article class="report-page" id="report-page">
      ${report
        .split("\n")
        .map((line) => {
          if (!line) return `<br />`;
          if (line.startsWith("《")) return `<h2>${escapeHtml(line)}</h2>`;
          if (/^[一二三四五六七八九十]、/.test(line)) return `<h3>${escapeHtml(line)}</h3>`;
          return `<p>${escapeHtml(line)}</p>`;
        })
        .join("")}
    </article>
  `;
}

function renderTrendChart(statements) {
  const items = statements.slice(-8);
  const width = 720;
  const height = 240;
  const padding = 28;
  const maxRevenue = Math.max(...items.map((item) => item.salesRevenue), 1);
  const maxProfit = Math.max(...items.map((item) => Math.abs(item.netProfit)), 1);
  const xStep = items.length > 1 ? (width - padding * 2) / (items.length - 1) : 1;

  const revenuePoints = items
    .map((item, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (item.salesRevenue / maxRevenue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const profitPoints = items
    .map((item, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (Math.max(item.netProfit, 0) / maxProfit) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="收入与利润趋势">
        <g class="grid-lines">
          <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
          <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}"></line>
          <line x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}"></line>
        </g>
        <polyline class="line revenue" points="${revenuePoints}"></polyline>
        <polyline class="line profit" points="${profitPoints}"></polyline>
        ${items
          .map((item, index) => {
            const x = padding + index * xStep;
            return `<text x="${x}" y="${height - 6}" text-anchor="middle">${item.periodMonth.slice(5)}</text>`;
          })
          .join("")}
      </svg>
      <div class="chart-legend">
        <span><i class="legend-dot revenue"></i>销售收入</span>
        <span><i class="legend-dot profit"></i>净利润</span>
      </div>
    </div>
  `;
}

function progressRow(label, value, timeProgress) {
  const capped = Math.max(0, Math.min(value, 1.2));
  const isBehind = value < timeProgress;
  return `
    <div class="progress-row">
      <div>
        <span>${label}</span>
        <strong>${formatRate(value)}</strong>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${isBehind ? "behind" : ""}" style="width:${Math.min(capped * 100, 100)}%"></div>
        <i style="left:${Math.min(timeProgress * 100, 100)}%"></i>
      </div>
    </div>
  `;
}

function bindEvents() {
  root.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      viewState.activeTab = button.dataset.tab;
      render();
    });
  });

  root.querySelector('[data-action="select-month"]')?.addEventListener("change", (event) => {
    viewState.selectedMonth = event.target.value;
    viewState.aiDraft = "";
    persistWithSnapshot();
    render();
  });

  root.querySelector("#excel-file")?.addEventListener("change", handleFileUpload);

  root.querySelectorAll("[data-map-key]").forEach((select) => {
    select.addEventListener("change", () => {
      viewState.fieldMap[select.dataset.mapKey] = select.value;
    });
  });

  root.querySelectorAll("[data-record-field]").forEach((input) => {
    input.addEventListener("change", handleRecordChange);
  });

  root.querySelectorAll("[data-target-key]").forEach((input) => {
    input.addEventListener("change", handleTargetChange);
  });

  root.querySelectorAll("[data-benchmark-key]").forEach((input) => {
    input.addEventListener("change", handleBenchmarkChange);
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", handleAction);
  });
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "save-upload") return saveUploadedRows();
  if (action === "clear-upload") return clearUpload();
  if (action === "add-record") return addRecord();
  if (action === "delete-record") return deleteRecord(event.currentTarget.dataset.recordId);
  if (action === "save-rule") return saveRule(event.currentTarget.dataset.ruleId);
  if (action === "restore-rule") return restoreRule(event.currentTarget.dataset.ruleId);
  if (action === "restore-all-rules") return restoreAllRules();
  if (action === "apply-template") return applyTemplate(event.currentTarget.dataset.template);
  if (action === "add-custom-rule") return addCustomRule();
  if (action === "copy-report") return copyReport();
  if (action === "download-report") return downloadReport();
  if (action === "print-report") return window.print();
  if (action === "download-snapshot") return downloadSnapshot();
  if (action === "ai-placeholder") return aiPlaceholder(event.currentTarget.dataset.aiType);
  if (action === "reset-demo") return resetDemoData();
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  viewState.uploadError = "";
  viewState.uploadFileName = file.name;

  try {
    if (!globalThis.XLSX) {
      throw new Error("Excel 解析库未加载，请确认当前浏览器可以访问 CDN。");
    }
    const buffer = await file.arrayBuffer();
    const workbook = globalThis.XLSX.read(buffer, { type: "array", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = globalThis.XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
    if (!rows.length) throw new Error("未识别到表格数据。");
    const headers = Object.keys(rows[0]);
    viewState.uploadRows = rows;
    viewState.uploadHeaders = headers;
    viewState.fieldMap = autoMapFields(headers);
    notify(`已读取 ${rows.length} 行数据`);
    render();
  } catch (error) {
    viewState.uploadRows = [];
    viewState.uploadHeaders = [];
    viewState.fieldMap = {};
    viewState.uploadError = error.message || "文件解析失败";
    render();
  }
}

function autoMapFields(headers) {
  const normalizedHeaders = headers.map((header) => ({
    raw: header,
    normalized: String(header).toLowerCase().replace(/\s|_/g, ""),
  }));
  const mapping = {};
  FIELD_DEFINITIONS.forEach((field) => {
    const match = normalizedHeaders.find((header) => {
      return field.synonyms.some((synonym) => {
        const normalizedSynonym = String(synonym).toLowerCase().replace(/\s|_/g, "");
        return header.normalized === normalizedSynonym || header.normalized.includes(normalizedSynonym);
      });
    });
    mapping[field.key] = match?.raw || "";
  });
  return mapping;
}

function saveUploadedRows() {
  const monthHeader = viewState.fieldMap.periodMonth;
  const revenueHeader = viewState.fieldMap.salesRevenue;
  if (!monthHeader || !revenueHeader) {
    viewState.uploadError = "月份和销售收入必须完成字段映射。";
    render();
    return;
  }

  const imported = viewState.uploadRows
    .map((row) => {
      const record = {
        id: uid("record"),
        periodMonth: normalizeMonth(row[monthHeader]),
      };
      MONEY_INPUT_KEYS.forEach((key) => {
        record[key] = parseNumber(row[viewState.fieldMap[key]]);
      });
      if (viewState.fieldMap.uploadedGrossProfit) {
        record.uploadedGrossProfit = parseNumber(row[viewState.fieldMap.uploadedGrossProfit]);
      }
      return record;
    })
    .filter((record) => record.periodMonth && record.salesRevenue);

  if (!imported.length) {
    viewState.uploadError = "映射后没有可保存的数据行。";
    render();
    return;
  }

  const merged = [...appState.records];
  imported.forEach((record) => {
    const index = merged.findIndex((item) => item.periodMonth === record.periodMonth);
    if (index >= 0) merged[index] = { ...merged[index], ...record, id: merged[index].id };
    else merged.push(record);
  });

  appState.records = merged;
  viewState.selectedMonth = imported.at(-1).periodMonth;
  clearUpload(false);
  persistWithSnapshot();
  notify(`已保存 ${imported.length} 个利润表月份`);
  render();
}

function clearUpload(shouldRender = true) {
  viewState.uploadRows = [];
  viewState.uploadHeaders = [];
  viewState.fieldMap = {};
  viewState.uploadFileName = "";
  viewState.uploadError = "";
  if (shouldRender) render();
}

function addRecord() {
  const latestMonth = viewState.selectedMonth || `${appState.targets.year}-01`;
  const [year, month] = latestMonth.split("-").map(Number);
  const nextDate = new Date(year, month, 1);
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  appState.records.push({
    id: uid("record"),
    periodMonth: nextMonth,
    salesRevenue: 0,
    productCost: 0,
    platformFee: 0,
    adCost: 0,
    refundAmount: 0,
    afterSalesCost: 0,
    logisticsCost: 0,
    warehouseCost: 0,
    laborCost: 0,
    managementCost: 0,
    otherCost: 0,
  });
  viewState.selectedMonth = nextMonth;
  persistWithSnapshot();
  render();
}

function deleteRecord(recordId) {
  if (!confirm("确认删除该月份利润表？")) return;
  appState.records = appState.records.filter((record) => record.id !== recordId);
  persistWithSnapshot();
  notify("已删除该月份");
  render();
}

function handleRecordChange(event) {
  const row = event.target.closest("[data-record-id]");
  const recordId = row?.dataset.recordId;
  const field = event.target.dataset.recordField;
  const record = appState.records.find((item) => item.id === recordId);
  if (!record) return;
  record[field] = field === "periodMonth" ? normalizeMonth(event.target.value) : parseNumber(event.target.value);
  viewState.selectedMonth = field === "periodMonth" ? record.periodMonth : viewState.selectedMonth;
  persistWithSnapshot();
  render();
}

function handleTargetChange(event) {
  const key = event.target.dataset.targetKey;
  const valueType = event.target.dataset.valueType;
  appState.targets[key] = valueType === "percent" ? parseNumber(event.target.value) / 100 : parseNumber(event.target.value);
  persistWithSnapshot();
  render();
}

function handleBenchmarkChange(event) {
  const key = event.target.dataset.benchmarkKey;
  const valueType = event.target.dataset.valueType;
  appState.benchmark[key] = valueType === "percent" ? parseNumber(event.target.value) / 100 : event.target.value;
  persistWithSnapshot();
  render();
}

function saveRule(ruleId) {
  const card = root.querySelector(`[data-rule-id="${CSS.escape(ruleId)}"]`);
  const rule = appState.rules.find((item) => item.id === ruleId);
  if (!card || !rule) return;
  if (!confirm("规则修改后，将影响后续分析结果。是否重新计算当前月份分析？")) return;

  const enabledInput = card.querySelector('[data-rule-field="isEnabled"]');
  const yellowInput = card.querySelector('[data-rule-field="currentYellowThreshold"]');
  const redInput = card.querySelector('[data-rule-field="currentRedThreshold"]');
  const suggestionInput = card.querySelector('[data-rule-field="suggestionText"]');

  rule.isEnabled = Boolean(enabledInput?.checked);
  if (!rule.redOnly) {
    rule.currentYellowThreshold = parseNumber(yellowInput?.value) / 100;
    rule.currentRedThreshold = parseNumber(redInput?.value) / 100;
  }
  rule.suggestionText = suggestionInput?.value || rule.suggestionText;
  persistWithSnapshot();
  notify("规则已保存并重新计算");
  render();
}

function restoreRule(ruleId) {
  const defaultRule = DEFAULT_RULES.find((rule) => rule.id === ruleId);
  const rule = appState.rules.find((item) => item.id === ruleId);
  if (!defaultRule || !rule) return;
  Object.assign(rule, clone(defaultRule));
  persistWithSnapshot();
  notify("已恢复默认规则");
  render();
}

function restoreAllRules() {
  if (!confirm("确认恢复全部系统默认规则？自定义规则会保留。")) return;
  const customRules = appState.rules.filter((rule) => !rule.isSystemRule);
  appState.rules = [...clone(DEFAULT_RULES), ...customRules];
  persistWithSnapshot();
  render();
}

function applyTemplate(template) {
  if (!confirm("规则模板会调整当前系统规则阈值，是否继续？")) return;
  const factors =
    template === "steady"
      ? { ad: 0.8, refund: 0.8, labor: 0.85, management: 0.85, annual: 0.8 }
      : { ad: 1.25, refund: 1, labor: 1.1, management: 1.1, annual: 1.1 };

  appState.rules = appState.rules.map((rule) => {
    const next = { ...rule };
    if (rule.id === "ad-rate-mom") {
      next.currentYellowThreshold = rule.defaultYellowThreshold * factors.ad;
      next.currentRedThreshold = rule.defaultRedThreshold * factors.ad;
    }
    if (rule.id === "refund-rate-mom") {
      next.currentYellowThreshold = rule.defaultYellowThreshold * factors.refund;
      next.currentRedThreshold = rule.defaultRedThreshold * factors.refund;
    }
    if (rule.id === "labor-rate-mom") {
      next.currentYellowThreshold = rule.defaultYellowThreshold * factors.labor;
      next.currentRedThreshold = rule.defaultRedThreshold * factors.labor;
    }
    if (rule.id === "management-rate-mom") {
      next.currentYellowThreshold = rule.defaultYellowThreshold * factors.management;
      next.currentRedThreshold = rule.defaultRedThreshold * factors.management;
    }
    if (rule.id === "annual-profit-progress") {
      next.currentYellowThreshold = rule.defaultYellowThreshold * factors.annual;
      next.currentRedThreshold = rule.defaultRedThreshold * factors.annual;
    }
    return next;
  });
  persistWithSnapshot();
  notify(template === "steady" ? "已应用稳健利润型模板" : "已应用增长放大型模板");
  render();
}

function addCustomRule() {
  const name = root.querySelector('[data-custom-rule="name"]')?.value.trim();
  const metricKey = root.querySelector('[data-custom-rule="metricKey"]')?.value;
  const compareType = root.querySelector('[data-custom-rule="compareType"]')?.value;
  const yellow = parseNumber(root.querySelector('[data-custom-rule="yellow"]')?.value) / 100;
  const red = parseNumber(root.querySelector('[data-custom-rule="red"]')?.value) / 100;
  const suggestion = root.querySelector('[data-custom-rule="suggestion"]')?.value.trim();

  if (!name || !metricKey || !compareType || red < yellow) {
    notify("请检查自定义规则名称、指标和阈值");
    return;
  }
  if (compareType === "custom-target-gap" && !TARGET_FIELDS[metricKey]) {
    notify("该指标暂未设置目标字段");
    return;
  }
  if (compareType === "custom-benchmark-gap" && !BENCHMARK_FIELDS[metricKey]) {
    notify("该指标暂未设置标杆字段");
    return;
  }

  const label = METRIC_META[metricKey].label;
  appState.rules.push({
    id: uid("custom-rule"),
    ruleName: name,
    ruleDescription: `用户自定义规则：${label}`,
    metricKey,
    compareType,
    defaultYellowThreshold: yellow,
    defaultRedThreshold: red,
    currentYellowThreshold: yellow,
    currentRedThreshold: red,
    isEnabled: true,
    suggestionText: suggestion || "建议进一步拆解该指标的结构、负责人和预算变化。",
    defaultSuggestionText: suggestion || "建议进一步拆解该指标的结构、负责人和预算变化。",
    isSystemRule: false,
  });
  persistWithSnapshot();
  notify("已新增自定义规则");
  render();
}

function copyReport() {
  const analysis = analyze(appState.records, viewState.selectedMonth, appState.targets, appState.benchmark, appState.rules);
  const report = generateMonthlyReport(analysis, appState.benchmark);
  navigator.clipboard?.writeText(report);
  notify("报告文本已复制");
}

function downloadReport() {
  const analysis = analyze(appState.records, viewState.selectedMonth, appState.targets, appState.benchmark, appState.rules);
  const report = generateMonthlyReport(analysis, appState.benchmark);
  downloadText(`${analysis.current.periodMonth}-利润经营复盘.txt`, report);
}

function downloadSnapshot() {
  const analysis = analyze(appState.records, viewState.selectedMonth, appState.targets, appState.benchmark, appState.rules);
  const snapshot = buildSnapshot(analysis, appState.rules);
  downloadText(`${analysis.current.periodMonth}-计算快照.json`, JSON.stringify(snapshot, null, 2));
}

function aiPlaceholder(type) {
  viewState.aiDraft = `${type}接口已预留。接入后将只读取当前计算快照、触发规则和系统建议，不参与原始指标计算，也不会修改系统结果。`;
  render();
}

function resetDemoData() {
  if (!confirm("确认重置为演示数据？当前本地录入会被覆盖。")) return;
  appState = resetState();
  viewState = {
    ...viewState,
    selectedMonth: getLatestMonth(appState.records),
    uploadRows: [],
    uploadHeaders: [],
    fieldMap: {},
    uploadFileName: "",
    uploadError: "",
    aiDraft: "",
  };
  persistWithSnapshot();
  render();
}

function persistWithSnapshot() {
  const analysis = analyze(appState.records, viewState.selectedMonth, appState.targets, appState.benchmark, appState.rules);
  if (analysis) {
    appState.snapshots = {
      ...(appState.snapshots || {}),
      [analysis.current.periodMonth]: buildSnapshot(analysis, appState.rules),
    };
  }
  saveState(appState);
}

function notify(message) {
  viewState.toast = message;
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => {
    if (viewState.toast === message) {
      viewState.toast = "";
      render();
    }
  }, 2400);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

persistWithSnapshot();
render();
