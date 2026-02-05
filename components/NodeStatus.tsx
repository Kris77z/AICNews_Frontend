'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusText, NODE_CONFIG } from '@/lib/pipeline-utils';
import type { NodeStatus as NodeStatusType, PipelineState } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NodeStatusProps {
  nodeId: string;
  status: NodeStatusType;
  state: PipelineState;
}

export function NodeStatus({ nodeId, status, state }: NodeStatusProps) {
  const node = NODE_CONFIG.find(n => n.id === nodeId);
  if (!node) return null;

  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  // 获取节点数据统计
  const getNodeStats = () => {
    switch (nodeId) {
      case 'l1':
        return `${state.raw_events.length} 条消息`;
      case 'l2':
        return `${state.structured_events.length} 个事件`;
      case 'l3':
        return `${state.clusters.length} 个簇`;
      case 'l4':
        return state.decision?.trigger ? '已触发' : '未触发';
      case 'l5_1':
        return state.evidence_bundle ? `${state.evidence_bundle.length} 条证据` : '-';
      case 'l5_2':
        return state.article ? '已生成' : '-';
      case 'l5_3':
        return state.article_validation?.article_validated ? '通过' : state.article_validation ? '未通过' : '-';
      case 'l5_4':
        return state.format_validation?.format_validated ? '通过' : state.format_validation ? '未通过' : '-';
      case 'l6':
        return state.article?.cover_image_url ? '已生成' : '-';
      default:
        return '';
    }
  };

  return (
    <Card className={cn(
      "min-w-[180px] transition-all",
      status === 'completed' && "border-green-500",
      status === 'running' && "border-blue-500 animate-pulse",
      status === 'failed' && "border-red-500",
      status === 'skipped' && "border-gray-300 opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{node.icon}</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">{node.name}</div>
            <div className="text-xs text-muted-foreground">{node.description}</div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <Badge 
            variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
            className={cn(
              "text-xs",
              status === 'completed' && "bg-green-500",
              status === 'running' && "bg-blue-500",
              status === 'failed' && "bg-red-500"
            )}
          >
            {statusText}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {getNodeStats()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

