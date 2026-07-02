import { METRIC_META } from "./data.js";
import { formatFullMoney, formatPoints, formatRate, formatValue } from "./utils.js";

export function generateMonthlyReport(analysis, benchmark) {
  if (!analysis) return "";

  const current = analysis.current;
  const previous = analysis.previous;
  const topWarnings = analysis.warnings.slice(0, 5);
  const issueLines = topWarnings.length
    ? topWarnings.map((warning, index) => `${index + 1}. ${warning.ruleName}：${warning.basis}。`).join("\n")
    : "本月未触发红黄灯预警。";
  const suggestionLines = analysis.suggestions.length
    ? analysis.suggestions.map((item, index) => `${index + 1}. ${item.text}`).join("\n")
    : "保持当前费用率和利润率监控，继续跟踪收入增长质量。";
  const focusMetrics = topWarnings.length
    ? topWarnings.map((warning) => warning.metricLabel).join("、")
    : "销售收入、毛利率、净利率、推广费率";

  const momSummary = previous
    ? [
        `销售收入较上月变化 ${formatFullMoney(current.salesRevenue - previous.salesRevenue)}，环比 ${formatRate((current.salesRevenue - previous.salesRevenue) / Math.abs(previous.salesRevenue || 1))}。`,
        `净利润较上月变化 ${formatFullMoney(current.netProfit - previous.netProfit)}，净利率变化 ${formatPoints(current.netMargin - previous.netMargin)}。`,
        `推广费率变化 ${formatPoints(current.adCostRate - previous.adCostRate)}，退款率变化 ${formatPoints(current.refundRate - previous.refundRate)}。`,
      ].join("\n")
    : "缺少上月数据，暂不生成环比判断。";

  const targetSummary = [
    `年度销售收入目标完成率：${formatRate(analysis.annualSalesCompletion)}，时间进度：${formatRate(analysis.timeProgress)}。`,
    `年度净利润目标完成率：${formatRate(analysis.annualProfitCompletion)}，累计净利润：${formatFullMoney(analysis.cumulativeProfit)}。`,
    `目标净利率：${formatRate(analysis.targetGaps.find((row) => row.label === "净利率")?.targetValue || 0)}，本月净利率：${formatRate(current.netMargin)}。`,
  ].join("\n");

  const benchmarkSummary = [
    `当前使用标杆：${benchmark.benchmarkName}。`,
    `毛利率与标杆差距：${formatPoints(current.grossMargin - benchmark.grossMargin)}。`,
    `净利率与标杆差距：${formatPoints(current.netMargin - benchmark.netMargin)}。`,
    `推广费率与标杆差距：${formatPoints(current.adCostRate - benchmark.adCostRate)}。`,
  ].join("\n");

  return [
    `《${current.periodMonth} 月度利润经营复盘》`,
    "",
    "一、本月核心数据",
    `销售收入：${formatFullMoney(current.salesRevenue)}`,
    `毛利：${formatFullMoney(current.grossProfit)}，毛利率：${formatRate(current.grossMargin)}`,
    `总费用：${formatFullMoney(current.totalExpense)}`,
    `净利润：${formatFullMoney(current.netProfit)}，净利率：${formatRate(current.netMargin)}`,
    "",
    "二、本月与上月对比",
    momSummary,
    "",
    "三、本月与目标对比",
    targetSummary,
    "",
    "四、本月与标杆对比",
    benchmarkSummary,
    "",
    "五、本月触发的异常预警",
    topWarnings.length
      ? topWarnings
          .map((warning) => `${warning.levelText}｜${warning.ruleName}｜${warning.currentDisplay}｜${warning.basis}`)
          .join("\n")
      : "无红黄灯预警。",
    "",
    "六、本月主要问题",
    issueLines,
    "",
    "七、本月建议排查方向",
    suggestionLines,
    "",
    "八、下月重点关注指标",
    focusMetrics,
    "",
    "系统口径说明",
    Object.values(METRIC_META)
      .filter((meta) => ["毛利", "毛利率", "总费用", "净利润", "净利率"].includes(meta.label))
      .map((meta) => `${meta.label}：${meta.formula}`)
      .join("\n"),
  ].join("\n");
}

export function compactMetricLine(label, value, unit) {
  return `${label}：${formatValue(value, unit)}`;
}
