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
          <div key={it.id || Math.random()} className="flex items-start justify-between">
            <div>
              <div className="font-medium">
                {it.publisher_name || it.offerName || 'Unknown'} 
                {it.offer_id && ` (#${it.offer_id})`}
                {it.offerId && ` (#${it.offerId})`}
              </div>
              <div className="text-sm text-muted-foreground">
                {it.email || it.affiliateName || 'No email'}
                {it.affiliateId && ` (#${it.affiliateId})`}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {it.created_at ? new Date(it.created_at).toLocaleString() : 
               it.createdAt ? new Date(it.createdAt).toLocaleString() : 
               'No date'}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
