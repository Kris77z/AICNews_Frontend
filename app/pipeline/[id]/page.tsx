import { PipelineNodes, type NodeStatus } from '@/components/PipelineNodes';
import { StatsCards } from '@/components/StatsCards';
import { DecisionCard } from '@/components/DecisionCard';
import { EventCard } from '@/components/EventCard';
import { ClusterCard } from '@/components/ClusterCard';
import { RawEventList } from '@/components/RawEventList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { PipelineState, CostReport } from '@/lib/types';

async function getPipeline(id: string): Promise<{ data: PipelineState | null; costReport: CostReport | null; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/pipeline/${id}`, {
      cache: 'no-store',

    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        data: null,
        costReport: null,
        error: errorData.error || `HTTP ${res.status}: ${res.statusText} `
      };
    }

    const json = await res.json();
    // 兼容旧 API 返回结构 (直接返回 PipelineState) 和新 API (返回 { pipeline, cost_report })
    if (json.pipeline) {
      return { data: json.pipeline, costReport: json.cost_report };
    } else {
      return { data: json, costReport: null };
    }
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return {
      data: null,
      costReport: null,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

async function getPrompts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/prompts`, {
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.prompts || {};
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return {};
  }
}

function buildPipelineNodes(pipeline: PipelineState, costReport: CostReport | null): NodeStatus[] {
  const getNodeCost = (nodeName: string) => {
    if (!costReport?.summary?.llm_breakdown) return undefined;
    const breakdown = costReport.summary.llm_breakdown;

    // 映射表: UI名称 -> cost_report key
    const map: Record<string, string> = {
      'L1': 'l1_fetcher',
      'L2': 'l2_extract', // Fixed
      'L3': 'l3_aggregate', // Fixed
      'L4': 'l4_decision',
      'L5.1': 'l5_synthesizer',
      'L5.2': 'l5_writer',
      'L5.3': 'l5_editor',
      'L6': 'l6_visual',
    };

    // 尝试直接查找或通过映射查找
    for (const key in breakdown) {
      // 1. Exact match via map
      if (map[nodeName] === key) return breakdown[key].cost;

      // 2. Fuzzy match (fallback)
      if (key.includes(nodeName.split(' ')[0].toLowerCase().replace('.', '_'))) {
        return breakdown[key].cost;
      }
    }
    return undefined;
  };

  return [
    {
      name: 'L1 - 消息采集',
      status: (pipeline.raw_events.length > 0 ? 'completed' : 'pending') as NodeStatus['status'],
      data: { count: pipeline.raw_events.length, cost: getNodeCost('L1') },
      nodeKey: 'l1_fetcher'
    },
    {
      name: 'L2 - 事件抽取',
      status: (pipeline.structured_events.length > 0 ? 'completed' : 'pending') as NodeStatus['status'],
      data: { count: pipeline.structured_events.length, cost: getNodeCost('L2') },
      nodeKey: 'l2_extract'
    },
    {
      name: 'L3 - 事件聚合',
      status: (pipeline.clusters.length > 0 ? 'completed' : 'pending') as NodeStatus['status'],
      data: { count: pipeline.clusters.length, cost: getNodeCost('L3') },
      nodeKey: 'l3_aggregate'
    },
    {
      name: 'L4 - 决策判断',
      status: (pipeline.decision ? 'completed' : 'pending') as NodeStatus['status'],
      data: { triggered: pipeline.decision?.trigger || false, cost: getNodeCost('L4') },
      nodeKey: 'l4_decision'
    },
    {
      name: 'L5.1 - 证据整合',
      status: (pipeline.evidence_bundle ? 'completed' : pipeline.decision?.trigger ? 'pending' : 'skipped') as NodeStatus['status'],
      data: pipeline.evidence_bundle ? { count: pipeline.evidence_bundle.length, cost: getNodeCost('L5.1') } : undefined,
      nodeKey: 'l5_synthesizer'
    },
    {
      name: 'L5.2 - 文章生成',
      status: (pipeline.article ? 'completed' : pipeline.decision?.trigger ? 'pending' : 'skipped') as NodeStatus['status'],
      data: pipeline.article ? { title: pipeline.article.title.substring(0, 30) + '...', cost: getNodeCost('L5.2') } : undefined,
      nodeKey: 'l5_writer'
    },
    {
      name: 'L5.3 - 文章审校',
      status: (pipeline.article_validation ? 'completed' : pipeline.article ? 'pending' : 'skipped') as NodeStatus['status'],
      data: pipeline.article_validation ? { validated: pipeline.article_validation.article_validated, cost: getNodeCost('L5.3') } : undefined,
      nodeKey: 'l5_editor'
    },
    {
      name: 'L6 - 视觉设计',
      status: (pipeline.article?.cover_image_url ? 'completed' : pipeline.article ? 'pending' : 'skipped') as NodeStatus['status'],
      data: { cost: getNodeCost('L6') },
      nodeKey: 'l6_visual'
    },
    {
      name: '通知发送',
      status: (pipeline.notification_sent ? 'completed' : 'skipped') as NodeStatus['status'],
      nodeKey: 'notification'
    },
  ];
}

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: pipeline, costReport, error } = await getPipeline(id);
  const prompts = await getPrompts();

  if (!pipeline) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">Pipeline 未找到</p>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
                错误: {error}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Pipeline ID: {id}
            </div>
            <Link href="/">
              <Button variant="outline" className="mt-4">
                返回首页
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nodes = buildPipelineNodes(pipeline, costReport);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline 详情</h1>
          <p className="text-sm text-muted-foreground mt-1">
            执行时间: {formatDate(pipeline.metadata?.created_at || new Date().toISOString())}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">返回首页</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">项目状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipeline.article ? '✅ 已发布' : pipeline.decision?.trigger ? '⚠️ 生成中/失败' : '⚪ 未触发'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pipeline.decision?.reason ? pipeline.decision.reason.substring(0, 30) + '...' : '等待决策'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">核心产出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipeline.article ? '1 篇文章' : '无产出'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pipeline.article?.title ? pipeline.article.title.substring(0, 20) + '...' : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总成本</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costReport?.summary?.total_cost?.toFixed(4) || '0.0000'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              LLM: ${costReport?.summary?.llm_cost?.toFixed(4) || '0.00'} | API: ${costReport?.summary?.external_api_cost?.toFixed(4) || '0.00'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">处理耗时</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costReport?.summary?.execution_time ? `${costReport.summary.execution_time.toFixed(1)}s` : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(pipeline.metadata?.created_at).toLocaleTimeString()} 开始
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={pipeline.article ? "article" : "overview"} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="article" disabled={!pipeline.article}>文章预览</TabsTrigger>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="decision">决策结果</TabsTrigger>
          <TabsTrigger value="evidence" disabled={!pipeline.evidence_bundle}>证据包</TabsTrigger>
          <TabsTrigger value="clusters">事件聚合</TabsTrigger>
          <TabsTrigger value="events">结构化事件</TabsTrigger>
          <TabsTrigger value="raw">原始消息</TabsTrigger>
          <TabsTrigger value="validation" disabled={!pipeline.article_validation}>审校结果</TabsTrigger>
          <TabsTrigger value="format" disabled={!pipeline.format_validation}>格式验证</TabsTrigger>
        </TabsList>

        <TabsContent value="article">
          {pipeline.article ? (
            <Card>
              <CardHeader>
                <CardTitle>{pipeline.article.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipeline.article.cover_image_url && (
                  <img
                    src={pipeline.article.cover_image_url}
                    alt="封面图"
                    className="w-full rounded-lg max-h-[400px] object-cover"
                  />
                )}
                <div>
                  <div className="text-sm font-medium mb-2">导语:</div>
                  <p className="text-sm bg-muted p-4 rounded-lg italic">{pipeline.article.lead}</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">正文:</div>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert border p-6 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: pipeline.article.body_html }}
                  />
                </div>
                {pipeline.article.tags && pipeline.article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pipeline.article.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">暂无文章生成</div>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>执行统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">处理消息数</div>
                  <div className="text-2xl font-bold">
                    {pipeline.metadata?.processed_count || pipeline.raw_events.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">抽取事件数</div>
                  <div className="text-2xl font-bold">
                    {pipeline.metadata?.extracted_count || pipeline.structured_events.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">事件簇数</div>
                  <div className="text-2xl font-bold">
                    {pipeline.metadata?.cluster_count || pipeline.clusters.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">触发状态</div>
                  <div className="text-2xl font-bold">
                    {pipeline.decision?.trigger ? '✅ 已触发' : '❌ 未触发'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {pipeline.decision && (
            <DecisionCard decision={pipeline.decision} />
          )}
        </TabsContent>

        <TabsContent value="raw">
          <RawEventList events={pipeline.raw_events} />
        </TabsContent>

        <TabsContent value="events">
          {pipeline.structured_events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无结构化事件</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pipeline.structured_events.map((event, index) => (
                <EventCard key={index} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clusters">
          {pipeline.clusters.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无事件簇</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pipeline.clusters.map((cluster, index) => (
                <ClusterCard key={index} cluster={cluster} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="decision">
          {pipeline.decision ? (
            <DecisionCard decision={pipeline.decision} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无决策结果</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {pipeline.evidence_bundle && (
          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <CardTitle>证据包 ({pipeline.evidence_bundle.length} 条)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipeline.synth_summary && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">整合总结:</div>
                    <p className="text-sm">{pipeline.synth_summary}</p>
                  </div>
                )}
                {pipeline.disputed_points && pipeline.disputed_points.length > 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <div className="text-sm font-medium mb-2">争议点:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {pipeline.disputed_points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="space-y-3">
                  {pipeline.evidence_bundle.map((evidence, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline">{evidence.source}</Badge>
                          <Badge
                            variant={
                              evidence.source_type === 'media'
                                ? 'default'
                                : evidence.source_type === 'search'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {evidence.source_type}
                          </Badge>
                        </div>
                        <p className="text-sm mt-2">{evidence.text}</p>
                        {evidence.url && (
                          <a
                            href={evidence.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-2 block"
                          >
                            {evidence.url}
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {pipeline.article_validation && (
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle>
                  审校结果: {pipeline.article_validation.article_validated ? '✅ 通过' : '❌ 未通过'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipeline.article_validation.issues.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">问题列表:</div>
                    <div className="space-y-2">
                      {pipeline.article_validation.issues.map((issue, idx) => (
                        <Card key={idx} className={issue.severity === 'critical' ? 'border-red-500' : ''}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}
                                  >
                                    {issue.severity}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{issue.location}</span>
                                </div>
                                <p className="text-sm">{issue.description}</p>
                                {issue.suggestion && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    建议: {issue.suggestion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {pipeline.article_validation.edits && pipeline.article_validation.edits.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">建议修改:</div>
                    <div className="space-y-2">
                      {pipeline.article_validation.edits.map((edit, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-3">
                            <div className="text-xs text-muted-foreground mb-1">{edit.loc}</div>
                            <p className="text-sm">{edit.suggest}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {pipeline.format_validation && (
          <TabsContent value="format">
            <Card>
              <CardHeader>
                <CardTitle>
                  格式验证: {pipeline.format_validation.format_validated ? '✅ 通过' : '❌ 未通过'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(pipeline.format_validation.checks, null, 2)}
                </pre>
                {pipeline.format_validation.overall_score !== undefined && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">总体评分:</div>
                    <div className="text-2xl font-bold">
                      {(pipeline.format_validation.overall_score * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Agent 执行流程</CardTitle>
        </CardHeader>
        <CardContent>
          <CardContent>
            <PipelineNodes nodes={nodes} prompts={prompts} />
          </CardContent>
        </CardContent>
      </Card>
    </div>
  );
}

