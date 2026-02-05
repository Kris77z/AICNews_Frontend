'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StructuredEvent } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

interface EventCardProps {
  event: StructuredEvent;
}

export function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);

  const eventTypeColors: Record<string, string> = {
    listing: 'bg-blue-500',
    exploit: 'bg-red-500',
    downtime: 'bg-orange-500',
    upgrade: 'bg-green-500',
    regulation: 'bg-purple-500',
    price_movement: 'bg-yellow-500',
    whale_movement: 'bg-pink-500',
    data_report: 'bg-cyan-500',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-2">
              {event.project || '未知项目'}
              {event.chain && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({event.chain})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                className={eventTypeColors[event.event_type] || 'bg-gray-500'}
              >
                {event.event_type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                置信度: {isNaN(event.confidence) ? '未知' : (event.confidence * 100).toFixed(0) + '%'}
              </Badge>
              {event.impact && (
                <div className="flex gap-1">
                  {typeof event.impact === 'string' ? (
                    <Badge variant="secondary" className="text-xs">{event.impact}</Badge>
                  ) : (
                    <>
                      {event.impact.amount && <Badge variant="secondary" className="text-xs">{event.impact.amount}</Badge>}
                      {event.impact.change && <Badge variant="secondary" className="text-xs">{event.impact.change}</Badge>}
                      {event.impact.scope && <Badge variant="secondary" className="text-xs">{event.impact.scope}</Badge>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground leading-relaxed">
          {event.summary}
        </p>

        {expanded && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <div>时间: {formatDate(event.timestamp)}</div>
              <div>来源: {event.source_channel}</div>
              {event.keywords.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">关键词: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {event.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline"
        >
          {expanded ? '收起' : '展开详情'}
        </button>
      </CardContent>
    </Card>
  );
}

