'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Cluster } from '@/lib/types';
import { useState } from 'react';
import { EventCard } from './EventCard';

interface ClusterCardProps {
  cluster: Cluster;
}

export function ClusterCard({ cluster }: ClusterCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-2">
              {cluster.project || '未知项目'}
              {cluster.chain && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({cluster.chain})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary">
                {cluster.support_count} 家媒体
              </Badge>
              <Badge variant="outline" className="text-xs">
                置信度: {isNaN(cluster.confidence) ? '未知' : (cluster.confidence * 100).toFixed(0) + '%'}
              </Badge>
              {cluster.event_type && (
                <Badge variant="secondary" className="text-xs">
                  {cluster.event_type}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground leading-relaxed">
          {cluster.aggregated_summary}
        </p>

        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-1">媒体来源:</div>
          <div className="flex flex-wrap gap-1">
            {cluster.media_sources.map((source, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {source}
              </Badge>
            ))}
          </div>
        </div>

        {expanded && cluster.events.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <div className="text-sm font-medium">包含的事件 ({cluster.events.length}):</div>
            <div className="space-y-2">
              {cluster.events.map((event, idx) => (
                <EventCard key={idx} event={event} />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? '收起' : `展开事件 (${cluster.events.length})`}
        </button>
      </CardContent>
    </Card>
  );
}

