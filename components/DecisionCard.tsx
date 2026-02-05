'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Decision, Cluster } from '@/lib/types';
import { ClusterCard } from './ClusterCard';

interface DecisionCardProps {
  decision: Decision;
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const triggered = decision.trigger;
  const confidence = decision.decision?.confidence || decision.confidence || 0;

  return (
    <Card className={triggered ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-gray-300'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {triggered ? '✅ 已触发要闻生成' : '❌ 未触发要闻生成'}
          </CardTitle>
          <Badge
            className={triggered ? 'bg-green-500' : 'bg-gray-400'}
            variant={triggered ? 'default' : 'secondary'}
          >
            {triggered ? '通过' : '未通过'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">决策原因:</div>
          <p className="text-sm text-muted-foreground">
            {decision.decision?.reason || decision.reason || '无'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">置信度</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${triggered ? 'bg-green-500' : 'bg-gray-400'}`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">事件簇统计</div>
            <div className="text-sm">
              总计: {decision.all_clusters || 0} 个簇
              {decision.triggered_clusters !== undefined && (
                <span className="ml-2">
                  (触发: {decision.triggered_clusters} 个)
                </span>
              )}
            </div>
          </div>
        </div>

        {triggered && decision.best_cluster && (
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-3">最佳事件簇:</div>
            <ClusterCard cluster={decision.best_cluster} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

