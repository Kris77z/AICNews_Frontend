'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CostReport } from '@/lib/types';
import { formatCost } from '@/lib/utils';

interface CostBreakdownProps {
  report: CostReport;
}

export function CostBreakdown({ report }: CostBreakdownProps) {
  const { summary, token_usage_records, external_api_records } = report;

  // 计算总 token 使用量
  const totalTokens = token_usage_records.reduce(
    (acc, record) => ({
      input: acc.input + record.input_tokens,
      output: acc.output + record.output_tokens,
      cache: acc.cache + (record.cache_read_tokens || 0),
    }),
    { input: 0, output: 0, cache: 0 }
  );

  return (
    <div className="space-y-6">
      {/* 总览 */}
      <Card>
        <CardHeader>
          <CardTitle>成本总览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">LLM 成本</div>
              <div className="text-2xl font-bold">{formatCost(summary.llm_cost)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">外部 API 成本</div>
              <div className="text-2xl font-bold">{formatCost(summary.external_api_cost)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">总成本</div>
              <div className="text-2xl font-bold text-primary">{formatCost(summary.total_cost)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">执行时间</div>
              <div className="text-2xl font-bold">{summary.execution_time.toFixed(2)}s</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token 使用统计 */}
      <Card>
        <CardHeader>
          <CardTitle>Token 使用统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground">输入 Tokens</div>
              <div className="text-xl font-bold">{totalTokens.input.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">输出 Tokens</div>
              <div className="text-xl font-bold">{totalTokens.output.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">缓存 Tokens</div>
              <div className="text-xl font-bold">{totalTokens.cache.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLM 成本明细 */}
      <Card>
        <CardHeader>
          <CardTitle>LLM 成本明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(summary.llm_breakdown || {}).map(([node, cost]) => {
              const nodeCost = cost as any;
              const nodeNameMap: Record<string, string> = {
                'l1_fetcher': 'L1 - 消息采集',
                'l2_extract': 'L2 - 事件抽取',
                'l3_aggregate': 'L3 - 事件聚合',
                'l4_decision': 'L4 - 决策判断',
                'l5_synthesizer': 'L5.1 - 证据整合',
                'l5_writer': 'L5.2 - 文章生成',
                'l5_editor': 'L5.3 - 文章审校',
                'l6_visual': 'L6 - 视觉设计',
              };
              const displayName = nodeNameMap[node] || node.replace('l', 'L').replace('_', '.').replace('_', '.');

              return (
                <div key={node} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{displayName}</div>
                    <div className="text-sm text-muted-foreground">{nodeCost.model}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      输入: {nodeCost.input_tokens.toLocaleString()} |
                      输出: {nodeCost.output_tokens.toLocaleString()} |
                      缓存: {nodeCost.cache_tokens.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCost(nodeCost.cost)}</div>
                    <div className="text-xs text-muted-foreground">
                      {((nodeCost.cost / summary.llm_cost) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 外部 API 成本明细 */}
      {Object.keys(summary.api_breakdown || {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>外部 API 成本明细</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.api_breakdown || {}).map(([node, cost]) => {
                const apiCost = cost as any;
                return (
                  <div key={node} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{node.replace('l', 'L').replace('_', '.').replace('_', '.')}</div>
                      <div className="text-sm text-muted-foreground">{apiCost.api_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        请求次数: {apiCost.request_count} |
                        图片数: {apiCost.image_count || 0}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCost(apiCost.cost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {((apiCost.cost / summary.external_api_cost) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

