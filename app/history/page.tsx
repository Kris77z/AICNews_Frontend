import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, formatCost } from '@/lib/utils';
import type { PipelineListItem } from '@/lib/types';

async function getPipelineList(): Promise<PipelineListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/pipeline/list`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.pipelines || [];
  } catch (error) {
    console.error('Error fetching pipeline list:', error);
    return [];
  }
}

async function getCostReport(pipelineId: string): Promise<number | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/cost/${pipelineId}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.summary?.total_cost || null;
  } catch (error) {
    return null;
  }
}

async function getPipelineDecision(pipelineId: string): Promise<{ triggered: boolean } | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/pipeline/${pipelineId}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return { triggered: data.decision?.trigger || false };
  } catch (error) {
    return null;
  }
}

export default async function HistoryPage() {
  const pipelines = await getPipelineList();

  // 获取每个 Pipeline 的额外信息（并行）
  const pipelinesWithInfo = await Promise.all(
    pipelines.map(async (pipeline) => {
      const [cost, decision] = await Promise.all([
        getCostReport(pipeline.id),
        getPipelineDecision(pipeline.id),
      ]);

      return {
        ...pipeline,
        cost,
        triggered: decision?.triggered || false,
      };
    })
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">历史记录</h1>
        <Link href="/">
          <Button variant="outline">返回首页</Button>
        </Link>
      </div>

      {pipelinesWithInfo.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">暂无执行记录</p>
            <p className="text-sm text-muted-foreground mt-2">
              请先运行 Pipeline 生成执行记录
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pipelinesWithInfo.map((pipeline) => (
            <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        Pipeline {pipeline.id}
                      </CardTitle>
                      <Badge
                        variant={pipeline.triggered ? 'default' : 'secondary'}
                        className={pipeline.triggered ? 'bg-green-500' : ''}
                      >
                        {pipeline.triggered ? '已触发' : '未触发'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>执行时间: {formatDate(pipeline.createdAt)}</div>
                      <div>文件大小: {(pipeline.size / 1024).toFixed(2)} KB</div>
                      {pipeline.cost !== null && (
                        <div>成本: {formatCost(pipeline.cost)}</div>
                      )}
                    </div>
                  </div>
                  <Link href={`/pipeline/${pipeline.id}`}>
                    <Button>查看详情</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        共 {pipelinesWithInfo.length} 条记录
      </div>
    </div>
  );
}

