"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Star, DollarSign } from "lucide-react";

// API 配置
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Article {
    timestamp: string;
    title: string;
    summary: string;
    project?: string;
    score?: number | null;
    cost?: number | null;
    is_featured?: boolean;
}

interface ArticlesResponse {
    success: boolean;
    total: number;
    offset: number;
    limit: number;
    articles: Article[];
    error?: string;
}

export default function FeedPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/articles?limit=50`);
            const data: ArticlesResponse = await response.json();

            if (data.success) {
                setArticles(data.articles);
                setTotal(data.total);
                setLastUpdated(new Date());
            } else {
                throw new Error(data.error || "获取文章失败");
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

    // 自动刷新 (每 60 秒)
    useEffect(() => {
        const interval = setInterval(fetchArticles, 60000);
        return () => clearInterval(interval);
    }, [fetchArticles]);

    // 格式化时间
    const formatTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 60) {
                return `${diffMins} 分钟前`;
            } else if (diffHours < 24) {
                return `${diffHours} 小时前`;
            } else if (diffDays < 7) {
                return `${diffDays} 天前`;
            } else {
                return date.toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                });
            }
        } catch {
            return timestamp;
        }
    };

    return (
        <div className="px-4 py-6 sm:container sm:mx-auto sm:py-8 max-w-4xl space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">文章记录</h1>
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
            <div className="space-y-4">
                {articles.map((article, index) => (
                    <Card
                        key={index}
                        className={`overflow-hidden py-0 gap-0 ${article.is_featured ? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10" : ""}`}
                    >
                        <CardContent className="p-4">
                            {/* 标题行 */}
                            <h3 className="font-medium text-base leading-snug mb-2">
                                {article.is_featured && <Star className="inline h-3.5 w-3.5 mr-1 text-amber-500 fill-amber-500" />}
                                {article.title}
                            </h3>

                            {/* 摘要 */}
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {article.summary}
                            </p>

                            {/* 底部信息栏 */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                {/* 左侧：评分 | 成本 */}
                                <div className="flex items-center gap-3">
                                    {article.score != null && (
                                        <span className="flex items-center gap-0.5">
                                            <Star className="h-3 w-3" />
                                            {article.score}
                                        </span>
                                    )}

                                    {article.cost != null && (
                                        <span className="flex items-center gap-0.5">
                                            <DollarSign className="h-3 w-3" />
                                            {article.cost.toFixed(3)}
                                        </span>
                                    )}
                                </div>

                                {/* 右侧：时间 */}
                                <span>
                                    {new Date(article.timestamp).toLocaleString('zh-CN', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {!isLoading && articles.length === 0 && !error && (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">暂无文章</p>
                </div>
            )}
        </div>
    );
}
