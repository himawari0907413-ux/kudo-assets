/**
 * 予約ボタンのクリックを数える（Cloudflare Pages Functions）
 * ボタン自体は楽天へ直接飛ぶ。押した瞬間にページのスクリプトが navigator.sendBeacon でここへ送る（読者の待ち時間ゼロ）。
 * 記録するのは「日付・宿番号・ボタンの位置」の回数だけ（個人情報は保存しない）。
 * KV バインディング名: CLICKS
 */
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview/i;

export async function onRequestPost({ request, env }) {
  if (!env.CLICKS) return new Response('KV not bound', { status: 503 });
  if (BOT.test(request.headers.get('user-agent') || '')) return new Response(null, { status: 204 });
  let body;
  try { body = JSON.parse(await request.text()); } catch { return new Response('bad request', { status: 400 }); }
  const h = String(body.h || '').replace(/[^0-9a-z-]/gi, '').slice(0, 20);
  const pos = String(body.pos || 'none').replace(/[^0-9a-z-]/gi, '').slice(0, 20);
  if (!h) return new Response('bad request', { status: 400 });
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const key = `c:${day}:${h}:${pos}`;
  const n = parseInt((await env.CLICKS.get(key)) || '0', 10) + 1;
  await env.CLICKS.put(key, String(n), { expirationTtl: 60 * 60 * 24 * 400 });
  return new Response(null, { status: 204 });
}
