const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatPriceDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${weekday})`;
}

export function formatRefreshedAt(dateTimeStr) {
  if (!dateTimeStr) return "";
  const [datePart, timePart = ""] = dateTimeStr.split("T");
  const [, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":");
  return `${m}/${d} ${hh}:${mm}`;
}