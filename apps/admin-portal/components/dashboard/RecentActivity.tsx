"use client";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui';

const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function RecentActivity() {
  const { data } = useSWR("/api/dashboard/recent-activity", fetcher, { refreshInterval: 60_000 });
  const items = data?.items ?? [];
  return (
    <Card>
      <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No synced activity yet.</p>}
        {items.map((it:any)=>(
          <div key={it.id} className="flex items-start justify-between">
            <div>
              <div className="font-medium">{it.offerName} (#{it.offerId})</div>
              <div className="text-sm text-muted-foreground">
                {it.affiliateName} (#{it.affiliateId})
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(it.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
