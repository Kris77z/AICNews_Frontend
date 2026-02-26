"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Copy, Check, Twitter as TwitterIcon } from "lucide-react";
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 动态导入避免 Next.js 服务端渲染 (SSR) 时发生依赖问题
const MarkdownPreview = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false });

// API 配置
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Article {
    timestamp: string;
    title: string;
    summary: string;
    project?: string;
    twitter_materials?: {
        short_tweet?: string;
        long_tweet?: string;
    };
}

interface ArticlesResponse {
    success: boolean;
    total: number;
    offset: number;
    limit: number;
    articles: Article[];
    error?: string;
}

export default function TwitterMaterialsPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/articles?limit=100`);
            const data: ArticlesResponse = await response.json();

            if (data.success) {
                const validArticles = (data.articles || []).filter(
                    (a) => a.twitter_materials && (a.twitter_materials.short_tweet || a.twitter_materials.long_tweet)
                );
                setArticles(validArticles);
                setTotal(validArticles.length);
            } else {
                throw new Error(data.error || "获取推文素材失败");
            }
        } catch (err: any) {
            console.error("Fetch error:", err);
            setError(err.message || "网络错误");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 初始加载
    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    // 复制功能
    const handleCopy = async (text: string, key: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates((prev) => ({ ...prev, [key]: true }));
            setTimeout(() => {
                setCopiedStates((prev) => ({ ...prev, [key]: false }));
            }, 2000);
        } catch (err) {
            console.error("复制失败:", err);
        }
    };

    return (
        <div className="px-4 py-6 sm:container sm:mx-auto sm:py-8 max-w-4xl space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">推文素材</h1>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchArticles}
                    disabled={isLoading}
                    className="shrink-0"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    刷新数据
                </Button>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="py-4">
                        <p className="text-destructive text-sm">❌ {error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {isLoading && articles.length === 0 && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Articles List */}
            <div className="space-y-6">
                {articles.map((article, index) => (
                    <ArticleCard
                        key={`${article.timestamp}-${index}`}
                        article={article}
                        index={index}
                        handleCopy={handleCopy}
                        copiedStates={copiedStates}
                    />
                ))}
            </div>

            {/* Empty State */}
            {!isLoading && articles.length === 0 && !error && (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">暂无推文素材</p>
                </div>
            )}
        </div>
    );
}

function ArticleCard({
    article,
    index,
    handleCopy,
    copiedStates
}: {
    article: Article;
    index: number;
    handleCopy: (text: string, key: string) => void;
    copiedStates: { [key: string]: boolean };
}) {
    const mats = article.twitter_materials;
    const hasShort = Boolean(mats?.short_tweet);
    const hasLong = Boolean(mats?.long_tweet);
    const defaultTab = hasShort ? "short" : "long";
    const [activeTab, setActiveTab] = useState(defaultTab);

    const currentText = activeTab === "short" ? mats?.short_tweet : mats?.long_tweet;
    const copyKey = `${activeTab}-${index}`;

    return (
        <Card className="overflow-hidden py-0 gap-0">
            <CardContent className="p-4">
                <h3 className="font-medium text-base leading-snug">
                    {article.title}
                </h3>
                <span className="text-xs text-muted-foreground mt-1 block">
                    {new Date(article.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                </span>

                <div className="mt-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex items-center justify-between mb-3">
                            <TabsList>
                                {hasShort && <TabsTrigger value="short">短推文</TabsTrigger>}
                                {hasLong && <TabsTrigger value="long">长推文</TabsTrigger>}
                            </TabsList>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleCopy(currentText!, copyKey)}
                            >
                                {copiedStates[copyKey] ? (
                                    <><Check className="w-3 h-3 mr-1" /> 已复制</>
                                ) : (
                                    <><Copy className="w-3 h-3 mr-1" /> 复制</>
                                )}
                            </Button>
                        </div>

                        {hasShort && (
                            <TabsContent value="short" className="mt-0" data-color-mode="light">
                                <MarkdownPreview
                                    source={mats!.short_tweet}
                                    style={{ background: 'transparent', fontSize: '14px' }}
                                    wrapperElement={{ "data-color-mode": "light" }}
                                />
                            </TabsContent>
                        )}

                        {hasLong && (
                            <TabsContent value="long" className="mt-0" data-color-mode="light">
                                <MarkdownPreview
                                    source={mats!.long_tweet}
                                    style={{ background: 'transparent', fontSize: '14px' }}
                                    wrapperElement={{ "data-color-mode": "light" }}
                                />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
}
