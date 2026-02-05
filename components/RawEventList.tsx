'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RawEvent } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

interface RawEventListProps {
  events: RawEvent[];
}

export function RawEventList({ events }: RawEventListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">暂无原始消息</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => {
        const isExpanded = expandedIndex === index;
        const displayText = isExpanded
          ? event.text
          : event.text.length > 200
          ? event.text.substring(0, 200) + '...'
          : event.text;

        return (
          <Card key={event.message_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{event.channel}</Badge>
                    {event.media_type && (
                      <Badge variant="secondary" className="text-xs">
                        {event.media_type}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  {event.raw_data && (
                    <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                      {event.raw_data.views !== undefined && (
                        <span>👁️ {event.raw_data.views}</span>
                      )}
                      {event.raw_data.forwards !== undefined && (
                        <span>↪️ {event.raw_data.forwards}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap wrap-break-word">
                {displayText}
              </div>
              {event.text.length > 200 && (
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  {isExpanded ? '收起' : '展开全文'}
                </button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

