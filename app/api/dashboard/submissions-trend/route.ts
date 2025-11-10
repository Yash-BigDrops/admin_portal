import { NextResponse } from "next/server";
import { getPool } from "@/lib/database/db";
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const H = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

  const startTime = Date.now();
  try {
    console.log('📈 Submissions trend query started');
    const pool = getPool();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * H);
    const yStart = new Date(todayStart.getTime() - 24 * H);
    const yEnd = todayStart;

    const q = `
      SELECT date_trunc('hour', created_at) AS hr, COUNT(*)::int AS c
      FROM publisher_requests
      WHERE created_at >= $1 AND created_at < $2
      GROUP BY 1
      ORDER BY 1
    `;

    const [t, y] = await Promise.all([
      pool.query(q, [todayStart.toISOString(), todayEnd.toISOString()]),
      pool.query(q, [yStart.toISOString(), yEnd.toISOString()])
    ]);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const toMap = (rows: any[]) =>
      Object.fromEntries(rows.map(r => [new Date(r.hr).getHours(), Number(r.c)]));

    const todayMap = toMap(t.rows);
    const yMap = toMap(y.rows);

    const data = hours.map(h => ({
      hour: `${h.toString().padStart(2, "0")}:00`,
      today: todayMap[h] ?? 0,
      yesterday: yMap[h] ?? 0,
    }));

    const totals = {
      today: data.reduce((s, d) => s + d.today, 0),
      yesterday: data.reduce((s, d) => s + d.yesterday, 0),
    };

    const duration = Date.now() - startTime;
    console.log(`📈 Submissions trend query completed in ${duration}ms`);
    return NextResponse.json({ data, totals });
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`📈 Submissions trend query failed after ${duration}ms:`, e);
    return NextResponse.json({ error: "Failed to load submissions trend" }, { status: 500 });
  }
}
