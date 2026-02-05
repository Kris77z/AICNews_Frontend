'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PipelineState } from '@/lib/types';

interface StatsCardsProps {
  state: PipelineState;
}

export function StatsCards({ state }: StatsCardsProps) {
  const stats = [
    {
      title: '原始消息数',
      value: state.raw_events.length,
      description: 'L1 采集的消息总数',
      icon: '📥',
    },
    {
      title: '结构化事件',
      value: state.structured_events.length,
      description: 'L2 抽取的事件总数',
      icon: '🔍',
    },
    {
      title: '事件簇数',
      value: state.clusters.length,
      description: 'L3 聚合的簇总数',
      icon: '🔗',
    },
    {
      title: '触发状态',
      value: state.decision?.trigger ? '已触发' : '未触发',
      description: state.decision?.trigger 
        ? `置信度: ${((state.decision.decision?.confidence || state.decision.confidence || 0) * 100).toFixed(1)}%`
        : '未满足触发条件',
      icon: state.decision?.trigger ? '✅' : '❌',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

