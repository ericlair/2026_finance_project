export async function getDataStatus() {
  const res = await fetch("/api/data-status", { credentials: "include" });
  if (!res.ok) {
    const err = new Error(`GET /api/data-status 실패: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}