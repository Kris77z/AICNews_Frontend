import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

async function getPipelineList(page: number = 1, limit: number = 10) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/pipeline/list?page=${page}&limit=${limit}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            return { pipelines: [], total: 0 };
        }

        const data = await res.json();
        return {
            pipelines: data.pipelines || [],
            total: data.total || 0
        };
    } catch (error) {
        console.error('Error fetching pipeline list:', error);
        return { pipelines: [], total: 0 };
    }
}

function getStatusIcon(triggered: boolean) {
    if (triggered) {
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-gray-400" />;
}

function getStatusBadge(triggered: boolean) {
    if (triggered) {
        return <Badge className="bg-green-500 hover:bg-green-600">已触发</Badge>;
    }
    return <Badge variant="outline" className="text-gray-500">未触发</Badge>;
}

export default async function DashboardPage(props: {
    searchParams: Promise<{ page?: string }>;
}) {
    const searchParams = await props.searchParams;
    const page = parseInt(searchParams.page || '1');
    const limit = 10;
    const { pipelines, total } = await getPipelineList(page, limit);
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Telegram 新闻生成流水线监控面板</p>
                </div>
                <div className="flex gap-2">

                    <Link href="/history">
                        <Button variant="outline">历史记录</Button>
                    </Link>
                    <Link href="/cost">
                        <Button variant="outline">成本分析</Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="outline">配置管理</Button>
                    </Link>
                </div>
            </div>

            {/* Pipeline Executions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>最近执行记录</CardTitle>
                </CardHeader>
                <CardContent>
                    {pipelines.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium text-sm w-[30%]">任务名称</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">执行时间</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">状态</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">数据统计</th>
                                            <th className="text-right py-3 px-4 font-medium text-sm">成本</th>
                                            <th className="text-right py-3 px-4 font-medium text-sm">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pipelines.map((pipeline: any) => (
                                            <tr key={pipeline.id} className="border-b hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium">
                                                    <Link href={`/pipeline/${pipeline.id}`} className="hover:underline block">
                                                        <div className="text-base font-semibold">
                                                            {pipeline.title || (
                                                                <span className="text-muted-foreground italic font-normal">
                                                                    {pipeline.triggered ? '未生成标题' : '未触发生成'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-mono mt-1">
                                                            ID: {pipeline.id}
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{formatDate(pipeline.timestamp)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={pipeline.triggered ? 'default' : 'secondary'}>
                                                        {pipeline.triggered ? '已触发' : '未触发'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                        <span>消息: {pipeline.processed_count || 0}</span>
                                                        <span>事件: {pipeline.extracted_count || 0}</span>
                                                        <span>聚合: {pipeline.cluster_count || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    {pipeline.total_cost ? (
                                                        <span className="font-mono font-medium">
                                                            ${pipeline.total_cost.toFixed(4)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Link href={`/pipeline/${pipeline.id}`}>
                                                        <Button variant="ghost" size="sm">查看详情</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    显示 {(page - 1) * limit + 1} 到 {Math.min(page * limit, total)} 共 {total} 条
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/dashboard?page=${page - 1}`} className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
                                        <Button variant="outline" size="sm" disabled={page <= 1}>上一页</Button>
                                    </Link>
                                    <Link href={`/dashboard?page=${page + 1}`} className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}>
                                        <Button variant="outline" size="sm" disabled={page >= totalPages}>下一页</Button>
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">暂无执行记录</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                请先运行 Pipeline 生成执行记录
                            </p>
                            <Link href="/manual">
                                <Button className="mt-4">前往手动录入</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats (Note: These trigger stats are based on current page only, Total Count is accurate) */}
            {total > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">总执行次数</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">本页触发次数</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {pipelines.filter((p: any) => p.triggered).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">本页处理消息</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {pipelines.reduce((sum: number, p: any) => sum + (p.processed_count || 0), 0)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">本页累计成本</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${pipelines.reduce((sum: number, p: any) => sum + (p.total_cost || 0), 0).toFixed(4)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
