"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Copy, Check, ChevronDown, ChevronUp, FileText } from "lucide-react";
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCopy } from "@/hooks/use-copy";

const MarkdownPreview = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false });

// API 配置
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Article {
    timestamp: string;
    title: string;
    summary: string;
    project?: string;
    score?: number | null;
    cost?: number | null;
    twitter_cost?: number | null;
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
    const { copiedStates, handleCopy } = useCopy();
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const toggleExpand = (index: number) => {
        setExpandedCards((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

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

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    return (
        <div className="px-4 py-6 sm:container sm:mx-auto sm:py-8 max-w-4xl space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">推文素材</h1>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchArticles}
                    disabled={isLoading}
                    className="shrink-0 h-10 w-10"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {error && (
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="py-4">
                        <p className="text-destructive text-sm">❌ {error}</p>
                    </CardContent>
                </Card>
            )}

            {isLoading && articles.length === 0 && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            <div className="space-y-4">
                {articles.map((article, index) => (
                    <ArticleCard
                        key={`${article.timestamp}-${index}`}
                        article={article}
                        index={index}
                        handleCopy={handleCopy}
                        copiedStates={copiedStates}
                        isExpanded={expandedCards.has(index)}
                        onToggleExpand={() => toggleExpand(index)}
                    />
                ))}
            </div>

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
    copiedStates,
    isExpanded,
    onToggleExpand,
}: {
    article: Article;
    index: number;
    handleCopy: (text: string, key: string, mode: "markdown" | "rich") => void;
    copiedStates: { [key: string]: boolean };
    isExpanded: boolean;
    onToggleExpand: () => void;
}) {
    const mats = article.twitter_materials;
    const hasShort = Boolean(mats?.short_tweet);
    const hasLong = Boolean(mats?.long_tweet);
    const defaultTab = hasShort ? "short" : "long";
    const [activeTab, setActiveTab] = useState(defaultTab);

    const currentText = activeTab === "short" ? mats?.short_tweet || "" : mats?.long_tweet || "";
    const mdKey = `${activeTab}-md-${index}`;
    const richKey = `${activeTab}-rich-${index}`;

    return (
        <Card className="overflow-hidden py-0 gap-0">
            <CardContent className="p-4">
                {/* 标题行 + 展开按钮 */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-base leading-snug">
                        {article.title}
                    </h3>
                    <button
                        onClick={onToggleExpand}
                        className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5 mt-0.5"
                    >
                        {isExpanded ? (
                            <><ChevronUp className="h-3.5 w-3.5" />收起</>
                        ) : (
                            <><ChevronDown className="h-3.5 w-3.5" />展开</>
                        )}
                    </button>
                </div>

                {/* 摘要（收起时显示） */}
                {!isExpanded && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.summary}
                    </p>
                )}

                {/* 推文内容区（展开时显示） */}
                {isExpanded && (
                    <div className="mb-3">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex items-center justify-between mb-3">
                                <TabsList>
                                    {hasShort && <TabsTrigger value="short">短推文</TabsTrigger>}
                                    {hasLong && <TabsTrigger value="long">长推文</TabsTrigger>}
                                </TabsList>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => handleCopy(currentText, mdKey, "markdown")}
                                        disabled={!currentText}
                                    >
                                        {copiedStates[mdKey] ? (
                                            <><Check className="w-3 h-3 mr-1" /> 已复制</>
                                        ) : (
                                            <><Copy className="w-3 h-3 mr-1" /> Markdown</>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => handleCopy(currentText, richKey, "rich")}
                                        disabled={!currentText}
                                    >
                                        {copiedStates[richKey] ? (
                                            <><Check className="w-3 h-3 mr-1" /> 已复制</>
                                        ) : (
                                            <><FileText className="w-3 h-3 mr-1" /> 富文本</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {hasShort && (
                                <TabsContent value="short" className="mt-0" data-color-mode="light">
                                    <MarkdownPreview
                                        source={mats!.short_tweet!}
                                        style={{ background: 'transparent', fontSize: '14px' }}
                                        wrapperElement={{ "data-color-mode": "light" }}
                                    />
                                </TabsContent>
                            )}

                            {hasLong && (
                                <TabsContent value="long" className="mt-0" data-color-mode="light">
                                    <MarkdownPreview
                                        source={mats!.long_tweet!}
                                        style={{ background: 'transparent', fontSize: '14px' }}
                                        wrapperElement={{ "data-color-mode": "light" }}
                                    />
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>
                )}

                {/* 底部信息栏 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        {article.twitter_cost != null && article.twitter_cost > 0 && (
                            <span>成本 ${article.twitter_cost.toFixed(3)}</span>
                        )}
                    </div>
                    <span>
                        {new Date(article.timestamp).toLocaleString('zh-CN', {
                            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
