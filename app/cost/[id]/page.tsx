import { CostChart } from '@/components/CostChart';
import { CostBreakdown } from '@/components/CostBreakdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { CostReport } from '@/lib/types';

async function getCostReport(id: string): Promise<CostReport | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/cost/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching cost report:', error);
    return null;
  }
}

export default async function CostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getCostReport(id);

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">成本报告未找到</p>
            <Link href="/cost">
              <Button variant="outline" className="mt-4">
                返回成本分析
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">成本报告详情</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pipeline ID: {report.pipeline_id} | 
            生成时间: {formatDate(report.timestamp)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cost">
            <Button variant="outline">返回成本分析</Button>
          </Link>
          <Link href={`/pipeline/${report.pipeline_id}`}>
            <Button variant="outline">查看 Pipeline</Button>
          </Link>
        </div>
      </div>

      <CostChart report={report} />
      <CostBreakdown report={report} />
    </div>
  );
}

