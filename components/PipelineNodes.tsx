"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, XCircle, Clock, Loader2, ChevronDown, ChevronRight, Terminal, FileText, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface NodeStatus {
    name: string
    status: 'completed' | 'running' | 'pending' | 'skipped' | 'failed'
    data?: any
    duration?: number
    nodeKey?: string
}

interface PipelineNodesProps {
    nodes: NodeStatus[]
    prompts?: Record<string, any>
}

// Helper to get status icon
function getStatusIcon(status: NodeStatus['status']) {
    switch (status) {
        case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />
        case 'running': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        case 'failed': return <XCircle className="h-5 w-5 text-red-500" />
        case 'skipped': return <Circle className="h-5 w-5 text-gray-300" />
        default: return <Circle className="h-5 w-5 text-gray-300" />
    }
}

// Helper to get status badge
function getStatusBadge(status: NodeStatus['status']) {
    switch (status) {
        case 'completed': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">已完成</Badge>
        case 'running': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">运行中</Badge>
        case 'failed': return <Badge variant="destructive">失败</Badge>
        case 'skipped': return <Badge variant="secondary">已跳过</Badge>
        default: return <Badge variant="secondary">等待中</Badge>
    }
}

function getNodeData(node: NodeStatus) {
    const dataItems: { label: string; value: string | number }[] = []

    if (node.data) {
        if ('count' in node.data) dataItems.push({ label: '数量', value: node.data.count })
        if ('total' in node.data) dataItems.push({ label: '总数', value: node.data.total })
        if ('triggered' in node.data) dataItems.push({ label: '触发', value: node.data.triggered ? '是' : '否' })
        if ('cost' in node.data && node.data.cost !== undefined) dataItems.push({ label: '成本', value: `$${Number(node.data.cost).toFixed(4)}` })
        if ('validated' in node.data) dataItems.push({ label: '验证', value: node.data.validated ? '通过' : '未通过' })
    }

    return dataItems
}

import Link from "next/link"
import { ExternalLink } from "lucide-react"

// ... (imports)

function getNodeUrlId(nodeKey?: string): string | null {
    if (!nodeKey) return null;
    const map: Record<string, string> = {
        'l1_fetcher': 'l1',
        'l2_extract': 'l2',
        'l3_aggregate': 'l3',
        'l4_decision': 'l4',
        'l5_synthesizer': 'l5.1',
        'l5_writer': 'l5.2',
        'l5_editor': 'l5.3',
        'l6_visual': 'l6',
    };
    return map[nodeKey] || null;
}

function AgentNodeCard({ node, promptInfo, isLast }: { node: NodeStatus, promptInfo: any, isLast: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const dataItems = getNodeData(node)
    if (promptInfo?.model) {
        dataItems.push({ label: '模型', value: promptInfo.model })
    }
    const urlId = getNodeUrlId(node.nodeKey)

    return (
        <div className="relative">
            {/* Connector Line */}
            {!isLast && (
                <div className="absolute left-[18px] top-[40px] w-0.5 h-[calc(100%+12px)] bg-border" />
            )}

            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
                <div className={cn(
                    "relative flex items-start gap-4 p-4 rounded-lg border bg-card transition-all",
                    node.status === 'completed' && "border-green-200 bg-green-50/50 dark:bg-green-900/20",
                    node.status === 'running' && "border-blue-200 bg-blue-50/50 dark:bg-blue-900/20",
                    node.status === 'failed' && "border-red-200 bg-red-50/50 dark:bg-red-900/20",
                )}>
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(node.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">
                                    {urlId ? (
                                        <Link href={`/dashboard/node/${urlId}`} className="hover:underline flex items-center gap-1 group">
                                            {node.name}
                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    ) : (
                                        node.name
                                    )}
                                </h3>
                                {promptInfo?.description && (
                                    <span className="text-xs text-muted-foreground hidden md:inline-block">
                                        - {promptInfo.description}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {node.duration && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {node.duration.toFixed(2)}s
                                    </span>
                                )}
                                {getStatusBadge(node.status)}
                                <CollapsibleTrigger asChild>
                                    <button className="p-1 hover:bg-muted rounded-full transition-colors">
                                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                </CollapsibleTrigger>
                            </div>
                        </div>

                        {/* Basic Data Items (Always Visible) */}
                        {dataItems && dataItems.length > 0 && (
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                                {dataItems.map((item, i) => (
                                    <div key={i} className="flex items-center gap-1">
                                        <span className="font-medium">{item.label}:</span>
                                        <span className="font-mono">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Agent Description (Mobile/Always visible if short) */}
                        {promptInfo?.description && (
                            <div className="text-xs text-muted-foreground md:hidden mb-2">
                                {promptInfo.description}
                            </div>
                        )}
                    </div>
                </div>

                <CollapsibleContent>
                    <Card className="ml-10 border-dashed">
                        <CardContent className="p-4">
                            <Tabs defaultValue="prompt" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-8">
                                    <TabsTrigger value="prompt" className="text-xs">
                                        <Terminal className="h-3 w-3 mr-2" />
                                        提示词 (Prompt)
                                    </TabsTrigger>
                                    <TabsTrigger value="actions" className="text-xs">
                                        <Activity className="h-3 w-3 mr-2" />
                                        执行详情 (Actions)
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="prompt" className="mt-4">
                                    {promptInfo ? (
                                        <div className="space-y-4">
                                            {promptInfo.system && (
                                                <div>
                                                    <div className="text-xs font-semibold mb-1 text-muted-foreground">System Prompt</div>
                                                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono max-h-[300px]">
                                                        {promptInfo.system}
                                                    </pre>
                                                </div>
                                            )}
                                            {promptInfo.user && (
                                                <div>
                                                    <div className="text-xs font-semibold mb-1 text-muted-foreground">User Template</div>
                                                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono max-h-[300px]">
                                                        {promptInfo.user}
                                                    </pre>
                                                </div>
                                            )}
                                            {/* Special case for L5 Writer */}
                                            {promptInfo.planning_template && (
                                                <div>
                                                    <div className="text-xs font-semibold mb-1 text-muted-foreground">Planning Template</div>
                                                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono max-h-[300px]">
                                                        {promptInfo.planning_template}
                                                    </pre>
                                                </div>
                                            )}
                                            {promptInfo.content_template && (
                                                <div>
                                                    <div className="text-xs font-semibold mb-1 text-muted-foreground">Content Template</div>
                                                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono max-h-[300px]">
                                                        {promptInfo.content_template}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground text-center py-4">
                                            暂无提示词信息
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="actions" className="mt-4">
                                    <div className="space-y-2">
                                        <div className="text-xs text-muted-foreground">
                                            当前状态: <span className="font-medium text-foreground">{node.status}</span>
                                        </div>
                                        {node.data && (
                                            <div className="text-xs">
                                                <div className="font-semibold mb-1 text-muted-foreground">节点数据:</div>
                                                <pre className="bg-muted p-3 rounded-md overflow-x-auto font-mono">
                                                    {JSON.stringify(node.data, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}

export function PipelineNodes({ nodes, prompts }: PipelineNodesProps) {
    return (
        <div className="space-y-3">
            {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1
                const promptInfo = node.nodeKey && prompts ? prompts[node.nodeKey] : null

                return (
                    <AgentNodeCard
                        key={index}
                        node={node}
                        promptInfo={promptInfo}
                        isLast={isLast}
                    />
                )
            })}
        </div>
    )
}
