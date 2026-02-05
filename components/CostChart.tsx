'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CostReport } from '@/lib/types';
import { formatCost } from '@/lib/utils';

interface CostChartProps {
  report: CostReport;
}

const COLORS = ['#4caf50', '#388e3c', '#2e7d32', '#1b5e20', '#0a1f0c'];

export function CostChart({ report }: CostChartProps) {
  const { summary } = report;

  // LLM vs API 成本对比
  const llmVsApi = [
    { name: 'LLM 成本', value: summary.llm_cost },
    { name: '外部 API 成本', value: summary.external_api_cost },
  ];

  // 节点成本分布（LLM）
  const nodeCosts = Object.entries(summary.llm_breakdown || {})
    .map(([node, cost]) => ({
      node: node.replace('l', 'L').replace('_', '.').replace('_', '.'),
      cost: (cost as any).cost,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10); // 只显示前 10 个

  // API 成本分布
  const apiCosts = Object.entries(summary.api_breakdown || {})
    .map(([node, cost]) => ({
      node: node.replace('l', 'L').replace('_', '.').replace('_', '.'),
      cost: (cost as any).cost,
    }))
    .sort((a, b) => b.cost - a.cost);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LLM vs API 成本对比 */}
      <Card>
        <CardHeader>
          <CardTitle>成本分布</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={llmVsApi}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string, percent?: number }) => `${name || '未命名'}: ${((percent || 0) * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {llmVsApi.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCost(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>LLM 成本:</span>
              <span className="font-medium">{formatCost(summary.llm_cost)}</span>
            </div>
            <div className="flex justify-between">
              <span>外部 API 成本:</span>
              <span className="font-medium">{formatCost(summary.external_api_cost)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold">
              <span>总成本:</span>
              <span>{formatCost(summary.total_cost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 节点成本分布 */}
      <Card>
        <CardHeader>
          <CardTitle>节点成本分布（LLM）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nodeCosts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="node" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCost(value)} />
              <Legend />
              <Bar dataKey="cost" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* API 成本分布 */}
      {apiCosts.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>外部 API 成本分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={apiCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="node" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCost(value)} />
                <Legend />
                <Bar dataKey="cost" fill="#388e3c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

