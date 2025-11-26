const hits = new Map<string, { count: number; ts: number }>()

export function limit(ip: string, max = 5, windowMs = 10_000) {
  const now = Date.now()
  const rec = hits.get(ip) ?? { count: 0, ts: now }
  if (now - rec.ts > windowMs) {
    rec.count = 0
    rec.ts = now
  }
  rec.count += 1
  hits.set(ip, rec)
  return rec.count <= max
}

