export function uid(prefix = "id") {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value)
    .replace(/,/g, "")
    .replace(/¥/g, "")
    .replace(/￥/g, "")
    .replace(/\s/g, "")
    .trim();
  if (!text) return 0;
  const isPercent = text.endsWith("%");
  const normalized = text.replace(/%$/, "");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return 0;
  return isPercent ? number / 100 : number;
}

export function normalizeMonth(value) {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  const excelSerial = Number(text);
  if (Number.isFinite(excelSerial) && excelSerial > 20000 && excelSerial < 60000) {
    const date = new Date(Math.round((excelSerial - 25569) * 86400 * 1000));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  const match = text.match(/(\d{4})\D?(\d{1,2})/);
  if (match) {
    return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}`;
  }
  return text;
}

export function monthNumber(month) {
  const [, monthPart] = String(month).split("-");
  return Number(monthPart || 0);
}

export function monthYear(month) {
  return Number(String(month).slice(0, 4));
}

export function formatMoney(value) {
  const number = Number(value || 0);
  const abs = Math.abs(number);
  if (abs >= 100000000) return `${(number / 100000000).toFixed(2)} 亿`;
  if (abs >= 10000) return `${(number / 10000).toFixed(1)} 万`;
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(number);
}

export function formatFullMoney(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatRate(value, digits = 1) {
  return `${(Number(value || 0) * 100).toFixed(digits)}%`;
}

export function formatPoints(value, digits = 1) {
  const sign = Number(value || 0) > 0 ? "+" : "";
  return `${sign}${(Number(value || 0) * 100).toFixed(digits)} 个百分点`;
}

export function formatValue(value, unit) {
  if (unit === "rate") return formatRate(value);
  if (unit === "money") return formatFullMoney(value);
  if (unit === "points") return formatPoints(value);
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

export function rate(numerator, denominator) {
  const base = Number(denominator || 0);
  if (!base) return 0;
  return Number(numerator || 0) / base;
}

export function growthRate(current, previous) {
  const prev = Number(previous || 0);
  const cur = Number(current || 0);
  if (!prev) return cur > 0 ? 1 : 0;
  return (cur - prev) / Math.abs(prev);
}

export function levelRank(level) {
  if (level === "red") return 3;
  if (level === "yellow") return 2;
  return 1;
}

export function levelText(level) {
  if (level === "red") return "红灯";
  if (level === "yellow") return "黄灯";
  return "绿灯";
}

export function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
