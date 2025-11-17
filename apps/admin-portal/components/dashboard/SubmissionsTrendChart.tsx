"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { CalendarDays } from "lucide-react";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function SubmissionsTrendChart() {
  const { data } = useSWR("/api/dashboard/submissions-trend", fetcher, { refreshInterval: 60_000 });

  // Transform data to match chart expectations
  const chartData = (data?.data ?? []).map((item: any) => ({
    hour: item.hour || item.date || '',
    count: item.count || 0,
    today: item.count || 0,
    yesterday: 0 // Can be enhanced later
  }));
  const totals = data?.totals ?? { last24Hours: 0, today: 0, yesterday: 0 };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Real-time data</span>
          </div>
        </div>
        <div className="mb-2 text-sm text-muted-foreground">
          Last 24 Hours: <span className="font-medium">{totals.last24Hours ?? totals.today ?? 0}</span>
          {totals.yesterday !== undefined && ` · Yesterday: ${totals.yesterday}`}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="submissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            <ResponsiveContainer width="100%" height={320} data-testid="submissions-chart">
              <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                <defs>
                  <linearGradient id="fillToday" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fillYesterday" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false}/>
                <YAxis allowDecimals={false} tickLine={false} axisLine={false}/>
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2563eb" fill="url(#fillToday)" name="Submissions"/>
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
