/* UI 层：localStorage 存储 + 视图渲染 + hash 路由。逻辑全部复用 window.OADR（engine.js）。 */
(function () {
  'use strict';
  const E = window.OADR;
  const { money, pctStr } = E.helpers;

  // ---------------- 存储（localStorage） ----------------
  const K = { dataset: 'oadr_dataset', imports: 'oadr_imports', reports: 'oadr_reports' };
  const EMPTY_DS = { sales: [], ads: [], inventory: [], refunds: [], competitor: [] };
  const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const getDataset = () => read(K.dataset, EMPTY_DS);
  const saveDataset = (d) => write(K.dataset, d);
  const getImports = () => read(K.imports, []);
  const addImport = (r) => { const l = getImports(); l.unshift(r); write(K.imports, l.slice(0, 100)); };
  const getReports = () => read(K.reports, []).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const getReport = (id) => read(K.reports, []).find((r) => r.id === id) || null;
  const saveReport = (r) => { const l = read(K.reports, []); const i = l.findIndex((x) => x.id === r.id); if (i >= 0) l[i] = r; else l.push(r); write(K.reports, l); };
  const newId = (p) => p + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const nowISO = () => new Date().toISOString();

  // ---------------- 标签与样式映射 ----------------
  const RISK_LABEL = { high: '高', medium: '中', low: '低' };
  const RISK_CLASS = { high: 'badge-high', medium: 'badge-mid', low: 'badge-low' };
  const STATUS_LABEL = { draft: 'AI 草稿', reviewed: '已审核', approved: '已确认', exported: '已导出', pushed: '已推送' };
  const STATUS_CLASS = { draft: 's-draft', reviewed: 's-reviewed', approved: 's-approved', exported: 's-exported', pushed: 's-pushed' };
  const CATEGORY_LABEL = { sales: '销售', ads: '广告', inventory: '库存', refund: '售后' };
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pctRaw = (n) => (n * 100).toFixed(2) + '%';
  const deltaHtml = (d, invert) => {
    if (!d || d.pct === null) return '<span class="delta flat">环比 N/A</span>';
    const positive = invert ? d.value < 0 : d.value > 0;
    const negative = invert ? d.value > 0 : d.value < 0;
    const cls = positive ? 'up' : negative ? 'down' : 'flat';
    return `<span class="delta ${cls}">环比 ${pctStr(d.pct)}</span>`;
  };

  // ---------------- 业务动作 ----------------
  function hasData(ds) { return E.latestDate(ds) !== ''; }

  function loadSample() {
    const S = window.SAMPLE_CSV || {};
    const ds = {
      sales: E.validateCsv('sales', S.sales || '').rows,
      ads: E.validateCsv('ads', S.ads || '').rows,
      inventory: E.validateCsv('inventory', S.inventory || '').rows,
      refunds: E.validateCsv('refunds', S.refunds || '').rows,
      competitor: S.competitor ? E.validateCsv('competitor', S.competitor).rows : [],
    };
    saveDataset(ds);
    const t = nowISO();
    ['sales', 'ads', 'inventory', 'refunds', 'competitor'].forEach((k) => {
      if (ds[k].length) addImport({ type: k, fileName: 'sample-data/' + k + '.csv', rowCount: ds[k].length, validRows: ds[k].length, errors: [], importedAt: t });
    });
  }

  function generateReport(targetDate) {
    const ds = getDataset();
    const date = targetDate || E.latestDate(ds);
    if (!date) throw new Error('数据集为空，请先导入或加载示例数据。');
    const metrics = E.computeMetrics(ds, date);
    const anomalies = E.runAnomalyEngine(ds, metrics);
    const draft = E.buildFallbackDraft(date, metrics, anomalies);
    const t = nowISO();
    const report = { id: newId('rpt'), date, status: 'draft', reviewer: null, source: 'fallback',
      aiWarning: '当前为纯静态部署，AI 草稿由规则引擎兜底生成（离线、无成本）。如需接入真实大模型，可后续挂接 n8n / DeepSeek webhook。',
      metrics, anomalies, aiRaw: draft, aiDraft: JSON.parse(JSON.stringify(draft)), bossReportMarkdown: '', createdAt: t, updatedAt: t };
    saveReport(report);
    return report;
  }

  // ---------------- 视图 ----------------
  const app = () => document.getElementById('view');
  const NAV = [['#dashboard', '仪表盘'], ['#imports', '数据导入'], ['#anomalies', '异常列表'], ['#reports', '历史报告']];

  function renderNav(active) {
    document.getElementById('nav').innerHTML = NAV.map(([h, l]) =>
      `<a href="${h}" class="${active === h ? 'active' : ''}">${l}</a>`).join('');
  }

  function metricCard(label, value, deltaObj, invert, hint) {
    const sub = deltaObj ? deltaHtml(deltaObj, invert) : hint ? `<span class="delta flat">${esc(hint)}</span>` : '<span class="delta flat">&nbsp;</span>';
    return `<div class="card metric"><div class="m-label">${esc(label)}</div><div class="m-value">${esc(value)}</div>${sub}</div>`;
  }

  function anomalyTable(anomalies, showInReport, inReportSet) {
    if (!anomalies.length) return `<div class="empty">未识别到异常</div>`;
    const rows = anomalies.map((a) => `
      <tr>
        <td><div class="a-type">${esc(a.type)}</div><div class="a-desc">${esc(a.description)}</div></td>
        <td>${CATEGORY_LABEL[a.category] || a.category}</td>
        <td>${esc(a.relatedSku || a.relatedCampaign || '—')}</td>
        <td><span class="badge ${RISK_CLASS[a.level]}">${RISK_LABEL[a.level]}</span></td>
        <td><ul class="ev">${a.evidence.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></td>
        ${showInReport ? `<td>${inReportSet && inReportSet.has(a.id) ? '<span class="yes">是</span>' : '<span class="no">否</span>'}</td>` : ''}
      </tr>`).join('');
    return `<div class="table-wrap"><table>
      <thead><tr><th>异常类型</th><th>分类</th><th>关联</th><th>风险</th><th>数据依据</th>${showInReport ? '<th>已进日报</th>' : ''}</tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }

  function viewDashboard() {
    renderNav('#dashboard');
    const ds = getDataset();
    if (!hasData(ds)) {
      app().innerHTML = `<div class="hero card">
        <h1>还没有经营数据</h1>
        <p>先加载内置示例数据即可一键跑通整个流程，或到「数据导入」上传自己的 CSV。</p>
        <div class="row">
          <button class="btn primary" data-act="loadSample">一键加载示例数据</button>
          <a class="btn ghost" href="#imports">去导入 CSV</a>
        </div></div>`;
      return;
    }
    const date = E.latestDate(ds);
    const m = E.computeMetrics(ds, date);
    const anomalies = E.runAnomalyEngine(ds, m);
    const reports = getReports();
    const latest = reports[0] || null;
    const riskCount = m.inventory.stockoutRiskCount + m.inventory.overstockRiskCount;

    app().innerHTML = `
      <div class="page-head">
        <div><h1>经营仪表盘</h1><p class="muted">经营日期：${date}</p></div>
        <button class="btn primary" data-act="generate">生成今日 AI 日报草稿</button>
      </div>
      <div class="metric-grid">
        ${metricCard('销售额', money(m.sales.salesAmount), m.sales.salesAmountMoM)}
        ${metricCard('订单量', String(m.sales.orders), m.sales.ordersMoM)}
        ${metricCard('访客数', String(m.sales.visitors), m.sales.visitorsMoM)}
        ${metricCard('转化率', pctRaw(m.sales.conversionRate), m.sales.conversionRateMoM)}
        ${metricCard('广告 ROI', m.ads.roi.toFixed(2), m.ads.roiMoM)}
        ${metricCard('广告消耗', money(m.ads.spend), m.ads.spendMoM, true)}
        ${metricCard('退款率', pctRaw(m.refunds.shopRefundRate), null, false, '退款 ' + m.refunds.totalRefundOrders + ' 单')}
        ${metricCard('库存风险 / 异常数', riskCount + ' / ' + anomalies.length, null, false, '断货 ' + m.inventory.stockoutRiskCount + '·滞销 ' + m.inventory.overstockRiskCount)}
      </div>
      <div class="two-col">
        <div class="card">
          <div class="card-head"><h2>今日异常（${anomalies.length}）</h2><a href="#anomalies" class="link">查看全部 →</a></div>
          <ul class="anom-list">
            ${anomalies.slice(0, 5).map((a) => `<li><span class="badge ${RISK_CLASS[a.level]}">${RISK_LABEL[a.level]}</span><span><b>${esc(a.type)}</b>${a.relatedSku ? '（' + esc(a.relatedSku) + '）' : ''}：${esc(a.description)}</span></li>`).join('') || '<li class="muted">未识别到异常</li>'}
          </ul>
        </div>
        <div class="card">
          <h2>最新日报</h2>
          ${latest ? `<div class="kv"><span>经营日期</span><b>${latest.date}</b></div>
            <div class="kv"><span>状态</span><span class="badge ${STATUS_CLASS[latest.status]}">${STATUS_LABEL[latest.status]}</span></div>
            <a class="link" href="#report/${latest.id}">进入审核 →</a>` : '<p class="muted">尚未生成日报，点击右上角「生成今日 AI 日报草稿」。</p>'}
        </div>
      </div>`;
  }

  function viewImports() {
    renderNav('#imports');
    const imports = getImports();
    const ds = getDataset();
    const counts = { sales: ds.sales.length, ads: ds.ads.length, inventory: ds.inventory.length, refunds: ds.refunds.length, competitor: ds.competitor.length };
    const TYPES = [['sales', '销售数据 sales.csv'], ['ads', '广告数据 ads.csv'], ['inventory', '库存数据 inventory.csv'], ['refunds', '退款/售后 refunds.csv'], ['competitor', '竞品数据 competitor.csv（可选）']];
    const lastOf = (t) => { const r = imports.find((x) => x.type === t); return r ? new Date(r.importedAt).toLocaleString('zh-CN') : '未导入'; };
    app().innerHTML = `
      <div class="page-head"><h1>数据导入</h1></div>
      <div class="card">
        <div class="import-row">
          <label>数据类型
            <select id="impType">${TYPES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
          </label>
          <label>选择 CSV<input id="impFile" type="file" accept=".csv,text/csv" /></label>
          <button class="btn primary" data-act="upload">上传导入</button>
          <button class="btn ghost" data-act="loadSample">一键加载示例数据</button>
        </div>
        <div id="impMsg"></div>
      </div>
      <div class="mini-grid">
        ${TYPES.map(([v, l]) => `<div class="card mini"><div class="mini-head"><b>${l}</b><span class="muted">${counts[v] || 0} 行</span></div><div class="muted">最近导入：${lastOf(v)}</div></div>`).join('')}
      </div>
      <div class="card">
        <div class="card-head"><h2>导入历史</h2></div>
        ${imports.length ? `<div class="table-wrap"><table><thead><tr><th>时间</th><th>类型</th><th>文件</th><th>有效/总行</th><th>校验</th></tr></thead>
          <tbody>${imports.map((r) => `<tr><td>${new Date(r.importedAt).toLocaleString('zh-CN')}</td><td>${r.type}</td><td>${esc(r.fileName)}</td><td>${r.validRows}/${r.rowCount}</td><td>${r.errors.length ? '<span class="warn">' + r.errors.length + ' 条问题</span>' : '<span class="yes">通过</span>'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">暂无导入记录</div>'}
      </div>`;
  }

  function handleUpload() {
    const type = document.getElementById('impType').value;
    const file = document.getElementById('impFile').files[0];
    const msg = document.getElementById('impMsg');
    if (!file) { msg.innerHTML = `<div class="alert err">请先选择 CSV 文件</div>`; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const res = E.validateCsv(type, String(reader.result));
      const t = nowISO();
      if (res.missingColumns.length) {
        addImport({ type, fileName: file.name, rowCount: res.totalRows, validRows: 0, errors: res.errors, importedAt: t });
        msg.innerHTML = `<div class="alert err">字段校验未通过：${esc(res.errors[0])}</div>`;
      } else {
        const ds = getDataset(); ds[type] = res.rows; saveDataset(ds);
        addImport({ type, fileName: file.name, rowCount: res.totalRows, validRows: res.validRows, errors: res.errors, importedAt: t });
        const errHtml = res.errors.length ? `<ul class="ev">${res.errors.slice(0, 8).map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : '';
        msg.innerHTML = `<div class="alert ok">导入成功：${res.validRows}/${res.totalRows} 行有效${errHtml}</div>`;
      }
      viewImports();
    };
    reader.readAsText(file, 'utf-8');
  }

  function viewAnomalies() {
    renderNav('#anomalies');
    const ds = getDataset();
    if (!hasData(ds)) { app().innerHTML = `<div class="empty">还没有数据。请先到<a class="link" href="#imports">数据导入</a>加载数据。</div>`; return; }
    const date = E.latestDate(ds);
    const m = E.computeMetrics(ds, date);
    const anomalies = E.runAnomalyEngine(ds, m);
    const latest = getReports()[0];
    const inSet = new Set((latest && latest.anomalies || []).map((a) => a.id));
    app().innerHTML = `<div class="page-head"><div><h1>异常列表</h1><p class="muted">经营日期：${date} · 由规则引擎判定（非 AI 判断），共 ${anomalies.length} 项</p></div></div>${anomalyTable(anomalies, true, inSet)}`;
  }

  function viewReports() {
    renderNav('#reports');
    const reports = getReports();
    app().innerHTML = `<div class="page-head"><h1>历史报告</h1></div>` + (reports.length ? `<div class="table-wrap"><table>
      <thead><tr><th>经营日期</th><th>状态</th><th>来源</th><th>异常数</th><th>审核人</th><th>更新时间</th><th>操作</th></tr></thead>
      <tbody>${reports.map((r) => `<tr>
        <td>${r.date}</td>
        <td><span class="badge ${STATUS_CLASS[r.status]}">${STATUS_LABEL[r.status]}</span></td>
        <td>${r.source === 'ai' ? 'AI' : '规则兜底'}</td>
        <td>${r.anomalies.length}</td>
        <td>${esc(r.reviewer || '—')}</td>
        <td>${new Date(r.updatedAt).toLocaleString('zh-CN')}</td>
        <td class="ops"><a class="link" href="#report/${r.id}">查看详情</a> <a class="link" data-act="export" data-id="${r.id}" data-fmt="md" href="javascript:void(0)">MD</a> <a class="link" data-act="export" data-id="${r.id}" data-fmt="html" href="javascript:void(0)">HTML</a></td>
      </tr>`).join('')}</tbody></table></div>` : `<div class="empty">还没有报告。到<a class="link" href="#dashboard">仪表盘</a>点击「生成今日 AI 日报草稿」。</div>`);
  }

  function viewReport(id) {
    renderNav('#reports');
    const report = getReport(id);
    if (!report) { app().innerHTML = `<div class="empty">报告不存在。<a class="link" href="#reports">返回列表</a></div>`; return; }
    const m = report.metrics;
    const d = report.aiDraft;
    const bossMd = E.buildBossMarkdown(report.date, m, d);
    const cards = [['销售额', money(m.sales.salesAmount)], ['订单量', String(m.sales.orders)], ['访客数', String(m.sales.visitors)], ['转化率', pctRaw(m.sales.conversionRate)], ['广告消耗', money(m.ads.spend)], ['ROI', m.ads.roi.toFixed(2)], ['退款率', pctRaw(m.refunds.shopRefundRate)]];

    app().innerHTML = `
      <div class="page-head">
        <div><h1>AI 日报审核 · ${report.date}</h1>
          <div class="sub"><span class="badge ${STATUS_CLASS[report.status]}">${STATUS_LABEL[report.status]}</span> <span class="muted">来源：${report.source === 'ai' ? 'AI' : '规则兜底'}</span> <a class="link" href="#reports">返回列表</a></div>
        </div>
        <div class="actions">
          <input id="reviewer" placeholder="审核人姓名" value="${esc(report.reviewer || '')}" />
          <button class="btn ghost" data-act="save" data-id="${id}">保存草稿</button>
          <button class="btn ok" data-act="approve" data-id="${id}">审核通过</button>
          <button class="btn ghost" data-act="export" data-id="${id}" data-fmt="md">导出 MD</button>
          <button class="btn ghost" data-act="export" data-id="${id}" data-fmt="html">导出 HTML</button>
        </div>
      </div>
      ${report.aiWarning ? `<div class="alert warn">⚠️ ${esc(report.aiWarning)}</div>` : ''}
      <div class="strip">${cards.map(([l, v]) => `<div class="chip"><span>${l}</span><b>${v}</b></div>`).join('')}</div>
      <div class="two-col">
        <div class="card"><h2>AI 草稿（可编辑）</h2><div id="editor"></div></div>
        <div class="stack">
          <div class="card"><h2>老板日报预览（实时）</h2><div id="preview" class="report-preview">${E.markdownToHtml(bossMd)}</div></div>
          <div class="card"><h2>规则引擎判定的异常（只读）</h2>${anomalyTable(report.anomalies, false)}</div>
        </div>
      </div>`;
    renderEditor(id);
  }

  // 受控编辑器：直接改内存中的 report.aiDraft，并刷新预览
  function renderEditor(id) {
    const report = getReport(id);
    const d = report.aiDraft;
    const box = document.getElementById('editor');
    box.innerHTML = `
      <label class="fld">今日经营总结<textarea data-f="summary" rows="3">${esc(d.summary)}</textarea></label>
      <div class="sec-title">关键异常（${d.anomalies.length}）</div>
      ${d.anomalies.map((a, i) => `
        <div class="edit-anom">
          <div class="ea-head">
            <input data-ai="${i}" data-f="type" value="${esc(a.type)}" />
            <select data-ai="${i}" data-f="level">${['high', 'medium', 'low'].map((v) => `<option value="${v}" ${a.level === v ? 'selected' : ''}>风险 ${RISK_LABEL[v]}</option>`).join('')}</select>
            <select data-ai="${i}" data-f="confidence">${['high', 'medium', 'low'].map((v) => `<option value="${v}" ${a.confidence === v ? 'selected' : ''}>置信 ${RISK_LABEL[v]}</option>`).join('')}</select>
          </div>
          <label class="fld sm">异常说明<textarea data-ai="${i}" data-f="description" rows="2">${esc(a.description)}</textarea></label>
          <div class="ro">数据依据（只读，来自程序计算）：${esc(a.evidence.join('；'))}</div>
          <label class="fld sm">可能原因（每行一条，只能写「可能」）<textarea data-ai="${i}" data-f="possible_causes" rows="2">${esc(a.possible_causes.join('\n'))}</textarea></label>
          <label class="fld sm">建议排查方向（每行一条）<textarea data-ai="${i}" data-f="recommended_checks" rows="2">${esc(a.recommended_checks.join('\n'))}</textarea></label>
          <div class="checks">
            <label><input type="checkbox" data-ai="${i}" data-f="need_human_review" ${a.need_human_review ? 'checked' : ''}/> 需人工确认</label>
            <label><input type="checkbox" data-ai="${i}" data-f="need_boss_attention" ${a.need_boss_attention ? 'checked' : ''}/> 需老板关注</label>
          </div>
        </div>`).join('') || '<div class="muted">无异常</div>'}
      <div class="sec-title">今日建议（${d.today_actions.length}）</div>
      ${d.today_actions.map((t, i) => `<div class="edit-act">
        <input data-tt="${i}" data-f="action" value="${esc(t.action)}" placeholder="建议动作" />
        <input data-tt="${i}" data-f="reason" value="${esc(t.reason)}" placeholder="依据" />
      </div>`).join('') || '<div class="muted">无建议</div>'}`;

    const commit = () => {
      const r = getReport(id);
      const dd = r.aiDraft;
      const linesArr = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
      box.querySelectorAll('[data-f]').forEach((el) => {
        const f = el.getAttribute('data-f');
        const ai = el.getAttribute('data-ai'), tt = el.getAttribute('data-tt');
        const val = el.type === 'checkbox' ? el.checked : el.value;
        if (ai !== null) {
          const a = dd.anomalies[+ai];
          if (f === 'possible_causes' || f === 'recommended_checks') a[f] = linesArr(el.value);
          else a[f] = val;
        } else if (tt !== null) { dd.today_actions[+tt][f] = val; }
        else if (f === 'summary') dd.summary = val;
      });
      r.updatedAt = nowISO();
      saveReport(r);
      document.getElementById('preview').innerHTML = E.markdownToHtml(E.buildBossMarkdown(r.date, r.metrics, dd));
    };
    box.addEventListener('input', commit);
    box.addEventListener('change', commit);
  }

  function downloadFile(name, text, mime) {
    const blob = new Blob([text], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  function exportReport(id, fmt) {
    const r = getReport(id);
    if (!r) return;
    const md = r.bossReportMarkdown || E.buildBossMarkdown(r.date, r.metrics, r.aiDraft);
    if (r.status === 'approved') { r.status = 'exported'; r.updatedAt = nowISO(); saveReport(r); }
    if (fmt === 'html') downloadFile('boss-report-' + r.date + '.html', E.buildBossHtml(r.date, md), 'text/html');
    else downloadFile('boss-report-' + r.date + '.md', md, 'text/markdown');
  }

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------------- 事件委托 ----------------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.getAttribute('data-act');
    if (act === 'loadSample') { loadSample(); toast('示例数据已加载'); route(); }
    else if (act === 'generate') { try { const r = generateReport(); location.hash = '#report/' + r.id; } catch (err) { toast(err.message); } }
    else if (act === 'upload') { handleUpload(); }
    else if (act === 'save') {
      const id = el.getAttribute('data-id'); const r = getReport(id);
      r.reviewer = document.getElementById('reviewer').value || r.reviewer;
      if (r.status === 'draft') r.status = 'reviewed';
      r.updatedAt = nowISO(); saveReport(r); toast('草稿已保存（状态：已审核）'); viewReport(id);
    } else if (act === 'approve') {
      const id = el.getAttribute('data-id'); const r = getReport(id);
      r.reviewer = document.getElementById('reviewer').value || r.reviewer;
      r.bossReportMarkdown = E.buildBossMarkdown(r.date, r.metrics, r.aiDraft);
      r.status = 'approved'; r.updatedAt = nowISO(); saveReport(r); toast('已审核通过，老板日报已生成'); viewReport(id);
    } else if (act === 'export') {
      exportReport(el.getAttribute('data-id'), el.getAttribute('data-fmt'));
    }
  });

  // ---------------- 路由 ----------------
  function route() {
    const h = location.hash || '#dashboard';
    if (h.startsWith('#report/')) return viewReport(h.slice('#report/'.length));
    if (h === '#imports') return viewImports();
    if (h === '#anomalies') return viewAnomalies();
    if (h === '#reports') return viewReports();
    return viewDashboard();
  }
  window.addEventListener('hashchange', route);
  route();
})();
