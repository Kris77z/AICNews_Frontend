"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/prompts')
            .then(res => res.json())
            .then(data => {
                if (data.prompts) {
                    setPrompts(data.prompts);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const renderPrompt = (title: string, content: string) => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg font-mono">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{content || '未找到内容'}</pre>
                </ScrollArea>
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Prompt Engineering</h1>
                    <p className="text-muted-foreground mt-2">系统提示词可视化管理</p>
                </div>
            </div>

            <Tabs defaultValue="l2" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="l2">L2 信息抽取</TabsTrigger>
                    <TabsTrigger value="l3">L3 事件聚合</TabsTrigger>
                    <TabsTrigger value="l4">L4 决策判断</TabsTrigger>
                    <TabsTrigger value="l5">L5 深度撰写</TabsTrigger>
                    <TabsTrigger value="editorial">Editorial (Digest)</TabsTrigger>
                </TabsList>

                <TabsContent value="l2" className="space-y-4 mt-4">
                    {renderPrompt('L2 System Prompt', prompts.l2_extract?.system)}
                    {renderPrompt('L2 User Template', prompts.l2_extract?.user)}
                </TabsContent>

                <TabsContent value="l3" className="space-y-4 mt-4">
                    {renderPrompt('L3 System Prompt', prompts.l3_aggregate?.system)}
                    {renderPrompt('L3 User Template', prompts.l3_aggregate?.user)}
                </TabsContent>

                <TabsContent value="l4" className="space-y-4 mt-4">
                    {renderPrompt('L4 System Prompt', prompts.l4_decision?.system)}
                    {renderPrompt('L4 User Template', prompts.l4_decision?.user)}
                </TabsContent>

                <TabsContent value="l5" className="space-y-4 mt-4">
                    {renderPrompt('L5 Synthesizer System', prompts.l5_synthesizer?.system)}
                    {renderPrompt('L5 Writer Planning Template', prompts.l5_writer?.planning_template)}
                    {renderPrompt('L5 Writer Content Template', prompts.l5_writer?.content_template)}
                    {renderPrompt('L5 Editor System', prompts.l5_editor?.system)}
                </TabsContent>

                <TabsContent value="editorial" className="space-y-4 mt-4">
                    {renderPrompt('Weekly Digest System', prompts.weekly_digest?.system)}
                    {renderPrompt('Weekly Digest User Template', prompts.weekly_digest?.user)}
                    {renderPrompt('Monthly Digest System', prompts.monthly_digest?.system)}
                    {renderPrompt('Monthly Digest User Template', prompts.monthly_digest?.user)}
                </TabsContent>
            </Tabs>
        </div>
    );
}
