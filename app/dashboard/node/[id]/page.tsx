import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Terminal, FileText, Activity, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Map URL ID to API Key and Display Name
const NODE_MAP: Record<string, { key: string; name: string; isHub?: boolean; subNodes?: string[] }> = {
    'l1': { key: 'l1_fetcher', name: 'L1 - 消息采集' },
    'l2': { key: 'l2_extract', name: 'L2 - 事件抽取' },
    'l3': { key: 'l3_aggregate', name: 'L3 - 事件聚合' },
    'l4': { key: 'l4_decision', name: 'L4 - 决策判断' },
    'l5': {
        key: 'l5_hub',
        name: 'L5 - 内容生成 (聚合)',
        isHub: true,
        subNodes: ['l5.1', 'l5.2', 'l5.3']
    },
    'l5.1': { key: 'l5_synthesizer', name: 'L5.1 - 证据整合' },
    'l5.2': { key: 'l5_writer', name: 'L5.2 - 文章生成' },
    'l5.3': { key: 'l5_editor', name: 'L5.3 - 文章审校' },
    'l6': { key: 'l6_visual', name: 'L6 - 视觉设计' },
};

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

function PromptViewer({ content, title }: { content: string; title?: string }) {
    if (!content) return null;

    // Simple highlighting for {{variables}} and {variables}
    const parts = content.split(/(\{[^{}]+\})/g);

    return (
        <div className="mt-4">
            {title && <div className="text-xs font-semibold mb-1 text-muted-foreground">{title}</div>}
            <div className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono max-h-[600px] border">
                {parts.map((part, i) => {
                    if (part.match(/^\{[^{}]+\}$/)) {
                        return <span key={i} className="text-blue-600 dark:text-blue-400 font-bold">{part}</span>;
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>
        </div>
    );
}

export default async function NodeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const normalizedId = id.toLowerCase();
    const nodeConfig = NODE_MAP[normalizedId];
    const prompts = await getPrompts();

    if (!nodeConfig) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">未找到节点: {id}</p>
                        <Link href="/dashboard">
                            <Button variant="outline" className="mt-4">
                                返回仪表盘
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Handle L5 Hub View
    if (nodeConfig.isHub && nodeConfig.subNodes) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{nodeConfig.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            包含 {nodeConfig.subNodes.length} 个子 Agent
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {nodeConfig.subNodes.map(subId => {
                        const subConfig = NODE_MAP[subId];
                        const subPrompt = prompts[subConfig.key];
                        return (
                            <Link key={subId} href={`/dashboard/node/${subId}`} className="block h-full">
                                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{subConfig.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {subPrompt?.description || "暂无描述"}
                                        </p>
                                        <Button variant="secondary" className="mt-4 w-full">查看详情</Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    }

    const promptInfo = prompts[nodeConfig.key];

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={normalizedId.startsWith('l5.') ? "/dashboard/node/l5" : "/dashboard"}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{nodeConfig.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Agent ID: {nodeConfig.key}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Agent Definition */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Agent 定义
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">职责描述</h3>
                                    <div className="p-4 bg-muted rounded-lg text-sm border-l-4 border-primary">
                                        {promptInfo?.description || "暂无描述"}
                                    </div>
                                </div>

                                <Tabs defaultValue="system" className="w-full">
                                    <TabsList>
                                        <TabsTrigger value="system">System Prompt</TabsTrigger>
                                        <TabsTrigger value="user">User Template</TabsTrigger>
                                        {promptInfo?.planning_template && <TabsTrigger value="planning">Planning Template</TabsTrigger>}
                                        {promptInfo?.content_template && <TabsTrigger value="content">Content Template</TabsTrigger>}
                                    </TabsList>

                                    <TabsContent value="system">
                                        <PromptViewer content={promptInfo?.system || "无 System Prompt"} />
                                    </TabsContent>

                                    <TabsContent value="user">
                                        <PromptViewer content={promptInfo?.user || "无 User Template"} />
                                    </TabsContent>

                                    {promptInfo?.planning_template && (
                                        <TabsContent value="planning">
                                            <PromptViewer content={promptInfo.planning_template} />
                                        </TabsContent>
                                    )}

                                    {promptInfo?.content_template && (
                                        <TabsContent value="content">
                                            <PromptViewer content={promptInfo.content_template} />
                                        </TabsContent>
                                    )}
                                </Tabs>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Stats & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                节点信息
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">节点类型</div>
                                <div className="text-lg font-mono mt-1">{normalizedId.toUpperCase()}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">实现方式</div>
                                <div className="mt-1">
                                    {promptInfo?.system === "无 (纯代码逻辑)" ? (
                                        <Badge variant="secondary">Code Logic</Badge>
                                    ) : (
                                        <Badge>LLM Agent</Badge>
                                    )}
                                </div>
                            </div>
                            {promptInfo?.model && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">模型配置</div>
                                    <div className="text-sm font-mono mt-1 bg-muted p-2 rounded break-all">
                                        {promptInfo.model}
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">相关文件</div>
                                <div className="text-xs font-mono mt-1 bg-muted p-2 rounded break-all">
                                    langgraph_pipeline/nodes/{nodeConfig.key}.py
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
