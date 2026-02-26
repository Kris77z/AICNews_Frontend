"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";

// API 配置（与 feed 页面保持一致）
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function ManualInputPage() {
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [result, setResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [step, setStep] = useState(0);

    // 模拟处理步骤文字
    const steps = [
        "正在解析输入内容...",
        "从 Web 获取相关上下文...",
        "分析事件关联性...",
        "生成文章初稿...",
        "正在最终润色..."
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            setStep(0);
            interval = setInterval(() => {
                setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
            }, 5000); // 每一阶段每 5 秒切换一次
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleSubmit = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        setStatus("processing");
        setResult(null);
        setErrorMsg("");

        try {
            // 1. 提交任务
            const triggerResponse = await fetch(`${API_BASE}/api/trigger`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: inputText,
                    user_id: "web_operator",
                }),
            });

            const triggerData = await triggerResponse.json();

            if (!triggerResponse.ok) throw new Error(triggerData.error || "提交失败");

            const taskId = triggerData.task_id;
            if (!taskId) throw new Error("未获取到任务ID");

            // 2. 轮询状态
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`${API_BASE}/api/tasks/${taskId}`);
                    const statusData = await statusRes.json();

                    if (statusData.status === "success") {
                        clearInterval(pollInterval);
                        setStatus("success");
                        setResult(statusData.result.article);
                        setInputText("");
                        setIsLoading(false);
                    } else if (statusData.status === "failed") {
                        clearInterval(pollInterval);
                        throw new Error(statusData.error || "任务执行失败");
                    }
                    // status === "processing", 继续轮询
                } catch (err: any) {
                    clearInterval(pollInterval);
                    setStatus("error");
                    setErrorMsg(err.message || "轮询出错");
                    setIsLoading(false);
                }
            }, 2000); // 每2秒查询一次

        } catch (err: any) {
            console.error("操作失败:", err);
            setStatus("error");
            setErrorMsg(err.message || "未知错误");
            setIsLoading(false);
        }
    };

    return (
        <div className="px-4 py-6 sm:container sm:mx-auto sm:py-10 max-w-2xl space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">手动录入</h1>
            </div>

            {/* 极简输入区 */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Textarea
                    placeholder="在此输入新闻快讯..."
                    className="min-h-[240px] w-full border-0 focus-visible:ring-0 resize-none p-4 sm:p-6 text-base sm:text-lg leading-relaxed bg-transparent"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading}
                />

                {/* 底部工具栏 */}
                <div className="bg-muted/30 border-t px-4 py-3 flex items-center justify-end gap-4">
                    <span className="text-xs text-muted-foreground hidden sm:inline-block mr-auto">
                        支持 URL / 纯文本 / 代码片段
                    </span>
                    <Button
                        onClick={handleSubmit}
                        disabled={!inputText.trim() || isLoading}
                        size="sm"
                        className={!inputText.trim() ? "opacity-50" : ""}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                处理中
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                开始处理
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* 正在处理状态反馈 */}
            {isLoading && (
                <div className="bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 rounded-lg p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">AI 正在努力工作中...</p>
                        <p className="text-xs opacity-70 transition-all duration-500">
                            {steps[step]}
                        </p>
                    </div>
                </div>
            )}

            {/* 状态反馈 */}
            {status === "success" && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">{result?.title || "生成成功"}</p>
                        <p className="text-sm opacity-80 mt-1">已推送到 Webhook</p>
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <p className="text-sm">{errorMsg}</p>
                </div>
            )}
        </div>
    );
}
