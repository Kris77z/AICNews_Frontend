import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDate, formatCost } from '@/lib/utils';
import type { CostReportListItem } from '@/lib/types';

async function getCostReports(): Promise<CostReportListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/cost/list`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.reports || [];
  } catch (error) {
    console.error('Error fetching cost reports:', error);
    return [];
  }
}

export default async function CostAnalysisPage() {
  const reports = await getCostReports();

  // 计算总成本
  const totalCost = reports.reduce((sum, report) => sum + (report.total_cost || 0), 0);
  const avgCost = reports.length > 0 ? totalCost / reports.length : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">成本分析</h1>
        <Link href="/">
          <Button variant="outline">返回首页</Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">总报告数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">累计成本</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">平均成本</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(avgCost)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 成本报告列表 */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">暂无成本报告</p>
            <p className="text-sm text-muted-foreground mt-2">
              请先运行 Pipeline 生成成本报告
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>成本报告列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">成本报告 {report.id}</div>
                      <div className="text-sm text-muted-foreground">
                        生成时间: {formatDate(report.createdAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        文件大小: {(report.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.total_cost !== undefined && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">总成本</div>
                          <div className="text-lg font-bold">{formatCost(report.total_cost)}</div>
                        </div>
                      )}
                      <Link href={`/cost/${report.id}`}>
                        <Button>查看详情</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

