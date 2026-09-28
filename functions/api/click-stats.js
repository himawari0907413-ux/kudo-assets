/**
 * クリック数の集計を返す（レポート用）。GET /api/click-stats?days=30
 * 返すのは宿番号・ボタン位置ごとの回数だけ。
 */
export async function onRequestGet({ request, env }) {
  if (!env.CLICKS) return new Response('KV not bound', { status: 503 });
  const days = Math.min(400, Math.max(1, parseInt(new URL(request.url).searchParams.get('days') || '30', 10)));
  const since = new Date(Date.now() + 9 * 3600e3 - days * 86400e3).toISOString().slice(0, 10);
  const totals = {};
  let cursor;
  do {
    const list = await env.CLICKS.list({ prefix: 'c:', cursor });
    for (const k of list.keys) {
      const [, day, h, pos] = k.name.split(':');
      if (day < since) continue;
      const n = parseInt((await env.CLICKS.get(k.name)) || '0', 10);
      totals[h] ??= { total: 0, byPos: {} };
      totals[h].total += n;
      totals[h].byPos[pos] = (totals[h].byPos[pos] || 0) + n;
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return new Response(JSON.stringify({ since, totals }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
