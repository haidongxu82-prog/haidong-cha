import {
  BENCHMARK_FIELDS,
  FOCUS_METRICS,
  LOWER_IS_BETTER,
  METRIC_META,
  MONEY_INPUT_KEYS,
  TARGET_FIELDS,
} from "./data.js";
import {
  formatFullMoney,
  formatPoints,
  formatRate,
  formatValue,
  growthRate,
  levelRank,
  levelText,
  monthNumber,
  monthYear,
  parseNumber,
  rate,
  uid,
} from "./utils.js";

export function computeStatement(record) {
  const normalized = {
    ...record,
    periodMonth: record.periodMonth,
  };

  MONEY_INPUT_KEYS.forEach((key) => {
    normalized[key] = parseNumber(record[key]);
  });

  if (!normalized.productCost && record.uploadedGrossProfit) {
    normalized.productCost = normalized.salesRevenue - parseNumber(record.uploadedGrossProfit);
  }

  const grossProfit = normalized.salesRevenue - normalized.productCost;
  const totalExpense =
    normalized.platformFee +
    normalized.adCost +
    normalized.refundAmount +
    normalized.afterSalesCost +
    normalized.logisticsCost +
    normalized.warehouseCost +
    normalized.laborCost +
    normalized.managementCost +
    normalized.otherCost;
  const netProfit = normalized.salesRevenue - normalized.productCost - totalExpense;

  return {
    ...normalized,
    grossProfit,
    grossMargin: rate(grossProfit, normalized.salesRevenue),
    totalExpense,
    netProfit,
    netMargin: rate(netProfit, normalized.salesRevenue),
    adCostRate: rate(normalized.adCost, normalized.salesRevenue),
    platformFeeRate: rate(normalized.platformFee, normalized.salesRevenue),
    refundRate: rate(normalized.refundAmount, normalized.salesRevenue),
    afterSalesCostRate: rate(normalized.afterSalesCost, normalized.salesRevenue),
    logisticsCostRate: rate(normalized.logisticsCost, normalized.salesRevenue),
    warehouseCostRate: rate(normalized.warehouseCost, normalized.salesRevenue),
    laborCostRate: rate(normalized.laborCost, normalized.salesRevenue),
    managementCostRate: rate(normalized.managementCost, normalized.salesRevenue),
  };
}

export function getStatements(records) {
  return records
    .filter((record) => record.periodMonth)
    .map(computeStatement)
    .sort((a, b) => a.periodMonth.localeCompare(b.periodMonth));
}

export function getLatestMonth(records) {
  const statements = getStatements(records);
  return statements.at(-1)?.periodMonth || "";
}

export function analyze(records, selectedMonth, targets, benchmark, rules) {
  const statements = getStatements(records);
  const current = statements.find((record) => record.periodMonth === selectedMonth) || statements.at(-1);
  if (!current) return null;

  const currentIndex = statements.findIndex((record) => record.periodMonth === current.periodMonth);
  const previous = currentIndex > 0 ? statements[currentIndex - 1] : null;
  const yearStatements = statements.filter((record) => {
    return monthYear(record.periodMonth) === Number(targets.year) && record.periodMonth <= current.periodMonth;
  });
  const cumulativeSales = yearStatements.reduce((sum, record) => sum + record.salesRevenue, 0);
  const cumulativeProfit = yearStatements.reduce((sum, record) => sum + record.netProfit, 0);
  const annualSalesCompletion = rate(cumulativeSales, targets.annualSalesTarget);
  const annualProfitCompletion = rate(cumulativeProfit, targets.annualNetProfitTarget);
  const timeProgress = monthNumber(current.periodMonth) / 12;

  const context = {
    statements,
    current,
    previous,
    targets,
    benchmark,
    cumulativeSales,
    cumulativeProfit,
    annualSalesCompletion,
    annualProfitCompletion,
    timeProgress,
  };

  const warnings = rules
    .flatMap((rule) => evaluateRule(rule, context))
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));

  const comparisons = buildComparisons(current, previous);
  const targetGaps = buildTargetGaps(current, targets, context);
  const benchmarkGaps = buildBenchmarkGaps(current, benchmark);
  const suggestions = buildSuggestions(warnings);

  return {
    current,
    previous,
    statements,
    comparisons,
    targetGaps,
    benchmarkGaps,
    warnings,
    suggestions,
    cumulativeSales,
    cumulativeProfit,
    annualSalesCompletion,
    annualProfitCompletion,
    timeProgress,
    redWarningCount: warnings.filter((warning) => warning.level === "red").length,
    yellowWarningCount: warnings.filter((warning) => warning.level === "yellow").length,
    warningCount: warnings.length,
  };
}

function buildComparisons(current, previous) {
  return FOCUS_METRICS.map((metricKey) => {
    const meta = METRIC_META[metricKey];
    const currentValue = current[metricKey] || 0;
    const previousValue = previous ? previous[metricKey] || 0 : 0;
    const changeValue = previous ? currentValue - previousValue : 0;
    const changeRate = previous ? growthRate(currentValue, previousValue) : 0;
    const isRate = meta.unit === "rate";
    const adverse =
      LOWER_IS_BETTER.has(metricKey) ? changeValue > 0 : metricKey === "netProfit" || metricKey === "salesRevenue" ? changeValue < 0 : changeValue < 0;
    const direction = !previous ? "无上月" : changeValue > 0 ? "上升" : changeValue < 0 ? "下降" : "持平";
    let judgment = "正常";
    if (!previous) judgment = "缺少上月数据";
    else if (adverse && Math.abs(changeValue) > 0) judgment = "需要关注";
    else if (!adverse && Math.abs(changeValue) > 0) judgment = "改善";

    return {
      metricKey,
      label: meta.label,
      unit: meta.unit,
      formula: meta.formula,
      previousValue,
      currentValue,
      changeValue,
      changeRate,
      changeDisplay: isRate ? formatPoints(changeValue) : formatFullMoney(changeValue),
      direction,
      judgment,
    };
  });
}

function buildTargetGaps(current, targets, context) {
  const rows = [
    {
      label: "年度销售收入目标",
      actualValue: context.cumulativeSales,
      targetValue: targets.annualSalesTarget,
      unit: "money",
      gapValue: context.cumulativeSales - targets.annualSalesTarget * context.timeProgress,
      completion: context.annualSalesCompletion,
      judgment:
        context.annualSalesCompletion >= context.timeProgress ? "进度不低于时间进度" : "低于时间进度",
    },
    {
      label: "年度净利润目标",
      actualValue: context.cumulativeProfit,
      targetValue: targets.annualNetProfitTarget,
      unit: "money",
      gapValue: context.cumulativeProfit - targets.annualNetProfitTarget * context.timeProgress,
      completion: context.annualProfitCompletion,
      judgment:
        context.annualProfitCompletion >= context.timeProgress ? "进度不低于时间进度" : "低于时间进度",
    },
  ];

  Object.entries(TARGET_FIELDS).forEach(([metricKey, targetKey]) => {
    const targetValue = targets[targetKey];
    const actualValue = current[metricKey] || 0;
    const meta = METRIC_META[metricKey];
    const lowerBetter = LOWER_IS_BETTER.has(metricKey);
    const gapValue = lowerBetter ? targetValue - actualValue : actualValue - targetValue;
    rows.push({
      label: meta.label,
      actualValue,
      targetValue,
      unit: meta.unit,
      gapValue,
      completion: null,
      judgment: lowerBetter
        ? actualValue <= targetValue
          ? "不高于目标"
          : "高于目标"
        : actualValue >= targetValue
          ? "不低于目标"
          : "低于目标",
    });
  });

  return rows;
}

function buildBenchmarkGaps(current, benchmark) {
  return Object.entries(BENCHMARK_FIELDS).map(([metricKey, benchmarkKey]) => {
    const meta = METRIC_META[metricKey];
    const actualValue = current[metricKey] || 0;
    const benchmarkValue = benchmark[benchmarkKey] || 0;
    const lowerBetter = LOWER_IS_BETTER.has(metricKey);
    const gapValue = lowerBetter ? benchmarkValue - actualValue : actualValue - benchmarkValue;
    return {
      metricKey,
      label: meta.label,
      actualValue,
      benchmarkValue,
      unit: meta.unit,
      gapValue,
      judgment: lowerBetter
        ? actualValue <= benchmarkValue
          ? "优于或达到标杆"
          : "弱于标杆"
        : actualValue >= benchmarkValue
          ? "优于或达到标杆"
          : "弱于标杆",
    };
  });
}

function evaluateRule(rule, context) {
  if (!rule.isEnabled) return [];
  const { current, previous, targets, benchmark } = context;
  const metricMeta = METRIC_META[rule.metricKey] || { label: rule.metricKey, unit: "number" };

  if (rule.compareType === "mom-point-increase") {
    if (!previous) return [];
    const deviation = (current[rule.metricKey] || 0) - (previous[rule.metricKey] || 0);
    return thresholdWarning(rule, deviation, {
      metricLabel: metricMeta.label,
      currentValue: current[rule.metricKey] || 0,
      compareValue: previous[rule.metricKey] || 0,
      deviationValue: deviation,
      currentDisplay: formatValue(current[rule.metricKey], metricMeta.unit),
      compareDisplay: `上月 ${formatValue(previous[rule.metricKey], metricMeta.unit)}`,
      deviationDisplay: formatPoints(deviation),
      basis: `${metricMeta.label}环比${deviation >= 0 ? "上升" : "下降"} ${formatPoints(deviation).replace("+", "")}`,
    });
  }

  if (rule.compareType === "target-gap-lower") {
    const targetKey = TARGET_FIELDS[rule.metricKey];
    if (!targetKey) return [];
    const targetValue = targets[targetKey] || 0;
    const actualValue = current[rule.metricKey] || 0;
    const deviation = targetValue - actualValue;
    return thresholdWarning(rule, deviation, {
      metricLabel: metricMeta.label,
      currentValue: actualValue,
      compareValue: targetValue,
      deviationValue: deviation,
      currentDisplay: formatValue(actualValue, metricMeta.unit),
      compareDisplay: `目标 ${formatValue(targetValue, metricMeta.unit)}`,
      deviationDisplay: formatPoints(-deviation),
      basis: `${metricMeta.label}低于目标 ${formatPoints(deviation).replace("+", "")}`,
    });
  }

  if (rule.compareType === "revenue-up-profit-down") {
    if (!previous) return [];
    if (current.salesRevenue > previous.salesRevenue && current.netProfit < previous.netProfit) {
      const deviation = current.netProfit - previous.netProfit;
      return [
        makeWarning(rule, "red", {
          metricLabel: "净利润",
          currentValue: current.netProfit,
          compareValue: previous.netProfit,
          deviationValue: deviation,
          currentDisplay: formatFullMoney(current.netProfit),
          compareDisplay: `上月 ${formatFullMoney(previous.netProfit)}`,
          deviationDisplay: formatFullMoney(deviation),
          basis: `销售收入环比增长 ${formatRate(growthRate(current.salesRevenue, previous.salesRevenue))}，但净利润下降 ${formatFullMoney(Math.abs(deviation))}`,
        }),
      ];
    }
  }

  if (rule.compareType === "annual-progress-gap") {
    const deviation = context.timeProgress - context.annualProfitCompletion;
    return thresholdWarning(rule, deviation, {
      metricLabel: "年度利润目标完成率",
      currentValue: context.annualProfitCompletion,
      compareValue: context.timeProgress,
      deviationValue: deviation,
      currentDisplay: formatRate(context.annualProfitCompletion),
      compareDisplay: `时间进度 ${formatRate(context.timeProgress)}`,
      deviationDisplay: formatPoints(-deviation),
      basis: `年度利润目标完成率低于时间进度 ${formatPoints(deviation).replace("+", "")}`,
    });
  }

  if (rule.compareType === "negative-value") {
    const value = current[rule.metricKey] || 0;
    if (value < 0) {
      return [
        makeWarning(rule, "red", {
          metricLabel: metricMeta.label,
          currentValue: value,
          compareValue: 0,
          deviationValue: value,
          currentDisplay: formatValue(value, metricMeta.unit),
          compareDisplay: "亏损线 0",
          deviationDisplay: formatFullMoney(value),
          basis: `${metricMeta.label}小于 0`,
        }),
      ];
    }
  }

  if (rule.compareType === "expense-growth-faster") {
    if (!previous) return [];
    const expenseGrowth = growthRate(current.totalExpense, previous.totalExpense);
    const revenueGrowth = growthRate(current.salesRevenue, previous.salesRevenue);
    const deviation = expenseGrowth - revenueGrowth;
    return thresholdWarning(rule, deviation, {
      metricLabel: "费用增长率",
      currentValue: expenseGrowth,
      compareValue: revenueGrowth,
      deviationValue: deviation,
      currentDisplay: formatRate(expenseGrowth),
      compareDisplay: `收入增长率 ${formatRate(revenueGrowth)}`,
      deviationDisplay: formatPoints(deviation),
      basis: `费用增长率高于收入增长率 ${formatPoints(deviation).replace("+", "")}`,
    });
  }

  if (rule.compareType === "custom-mom-point-increase") {
    if (!previous) return [];
    const deviation = (current[rule.metricKey] || 0) - (previous[rule.metricKey] || 0);
    return thresholdWarning(rule, deviation, {
      metricLabel: metricMeta.label,
      currentValue: current[rule.metricKey] || 0,
      compareValue: previous[rule.metricKey] || 0,
      deviationValue: deviation,
      currentDisplay: formatValue(current[rule.metricKey], metricMeta.unit),
      compareDisplay: `上月 ${formatValue(previous[rule.metricKey], metricMeta.unit)}`,
      deviationDisplay: formatPoints(deviation),
      basis: `${metricMeta.label}环比上涨 ${formatPoints(deviation).replace("+", "")}`,
    });
  }

  if (rule.compareType === "custom-target-gap") {
    const targetKey = TARGET_FIELDS[rule.metricKey];
    if (!targetKey) return [];
    const targetValue = targets[targetKey] || 0;
    const actualValue = current[rule.metricKey] || 0;
    const lowerBetter = LOWER_IS_BETTER.has(rule.metricKey);
    const deviation = lowerBetter ? actualValue - targetValue : targetValue - actualValue;
    return thresholdWarning(rule, deviation, {
      metricLabel: metricMeta.label,
      currentValue: actualValue,
      compareValue: targetValue,
      deviationValue: deviation,
      currentDisplay: formatValue(actualValue, metricMeta.unit),
      compareDisplay: `目标 ${formatValue(targetValue, metricMeta.unit)}`,
      deviationDisplay: formatPoints(deviation),
      basis: lowerBetter
        ? `${metricMeta.label}高于目标 ${formatPoints(deviation).replace("+", "")}`
        : `${metricMeta.label}低于目标 ${formatPoints(deviation).replace("+", "")}`,
    });
  }

  if (rule.compareType === "custom-benchmark-gap") {
    const benchmarkKey = BENCHMARK_FIELDS[rule.metricKey];
    if (!benchmarkKey) return [];
    const benchmarkValue = benchmark[benchmarkKey] || 0;
    const actualValue = current[rule.metricKey] || 0;
    const lowerBetter = LOWER_IS_BETTER.has(rule.metricKey);
    const deviation = lowerBetter ? actualValue - benchmarkValue : benchmarkValue - actualValue;
    return thresholdWarning(rule, deviation, {
      metricLabel: metricMeta.label,
      currentValue: actualValue,
      compareValue: benchmarkValue,
      deviationValue: deviation,
      currentDisplay: formatValue(actualValue, metricMeta.unit),
      compareDisplay: `标杆 ${formatValue(benchmarkValue, metricMeta.unit)}`,
      deviationDisplay: formatPoints(deviation),
      basis: lowerBetter
        ? `${metricMeta.label}高于标杆 ${formatPoints(deviation).replace("+", "")}`
        : `${metricMeta.label}低于标杆 ${formatPoints(deviation).replace("+", "")}`,
    });
  }

  return [];
}

function thresholdWarning(rule, deviation, details) {
  if (deviation >= rule.currentRedThreshold) {
    return [makeWarning(rule, "red", details)];
  }
  if (deviation >= rule.currentYellowThreshold) {
    return [makeWarning(rule, "yellow", details)];
  }
  return [];
}

function makeWarning(rule, level, details) {
  return {
    id: uid("warning"),
    ruleId: rule.id,
    ruleName: rule.ruleName,
    level,
    levelText: levelText(level),
    suggestion: rule.suggestionText,
    ...details,
  };
}

function buildSuggestions(warnings) {
  const unique = [];
  const seen = new Set();
  warnings.forEach((warning) => {
    if (!seen.has(warning.suggestion)) {
      seen.add(warning.suggestion);
      unique.push({
        level: warning.level,
        ruleName: warning.ruleName,
        text: warning.suggestion,
      });
    }
  });
  return unique;
}

export function buildSnapshot(analysis, rules) {
  if (!analysis) return null;
  return {
    generatedAt: new Date().toISOString(),
    periodMonth: analysis.current.periodMonth,
    summary: {
      salesRevenue: analysis.current.salesRevenue,
      grossProfit: analysis.current.grossProfit,
      grossMargin: analysis.current.grossMargin,
      totalExpense: analysis.current.totalExpense,
      netProfit: analysis.current.netProfit,
      netMargin: analysis.current.netMargin,
      warningCount: analysis.warningCount,
      redWarningCount: analysis.redWarningCount,
      yellowWarningCount: analysis.yellowWarningCount,
    },
    comparisons: analysis.comparisons,
    targetGaps: analysis.targetGaps,
    benchmarkGaps: analysis.benchmarkGaps,
    triggeredRules: analysis.warnings,
    enabledRules: rules.filter((rule) => rule.isEnabled).map((rule) => ({
      id: rule.id,
      ruleName: rule.ruleName,
      metricKey: rule.metricKey,
      compareType: rule.compareType,
      currentYellowThreshold: rule.currentYellowThreshold,
      currentRedThreshold: rule.currentRedThreshold,
    })),
  };
}
