"use client";

import { useState, useCallback, useRef } from "react";
import { marked } from "marked";

/**
 * 复制文本到剪贴板的底层工具
 * 支持两种模式：Markdown 纯文本 和 富文本 (HTML)
 */

/** 纯文本复制（Markdown 原文） */
async function copyPlainText(text: string): Promise<void> {
    if (navigator?.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand("copy");
        } finally {
            textArea.remove();
        }
    }
}

/** 富文本复制（渲染后的 HTML） */
async function copyRichText(markdown: string): Promise<void> {
    // 将 Markdown 转为 HTML
    const html = await marked.parse(markdown);

    // 优先使用 Clipboard API（支持 ClipboardItem 的现代浏览器）
    if (navigator?.clipboard?.write && window.isSecureContext) {
        const blob = new Blob([html], { type: "text/html" });
        const plainBlob = new Blob([markdown], { type: "text/plain" });
        const item = new ClipboardItem({
            "text/html": blob,
            "text/plain": plainBlob,
        });
        await navigator.clipboard.write([item]);
    } else {
        // Fallback：利用 contenteditable div + execCommand
        const container = document.createElement("div");
        container.innerHTML = html;
        container.style.position = "absolute";
        container.style.left = "-999999px";
        container.setAttribute("contenteditable", "true");
        document.body.appendChild(container);

        const range = document.createRange();
        range.selectNodeContents(container);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        try {
            document.execCommand("copy");
        } finally {
            selection?.removeAllRanges();
            container.remove();
        }
    }
}

export type CopyMode = "markdown" | "rich";

interface UseCopyReturn {
    copiedStates: { [key: string]: boolean };
    handleCopy: (text: string, key: string, mode: CopyMode) => Promise<void>;
}

/**
 * 通用复制 Hook
 * 提供 Markdown 复制和富文本复制两种模式，附带状态管理
 */
export function useCopy(): UseCopyReturn {
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
    const timers = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const handleCopy = useCallback(async (text: string, key: string, mode: CopyMode) => {
        if (!text) return;
        try {
            if (mode === "rich") {
                await copyRichText(text);
            } else {
                await copyPlainText(text);
            }
            setCopiedStates((prev) => ({ ...prev, [key]: true }));
            // 清除上一次的计时器
            if (timers.current[key]) clearTimeout(timers.current[key]);
            timers.current[key] = setTimeout(() => {
                setCopiedStates((prev) => ({ ...prev, [key]: false }));
            }, 2000);
        } catch (err) {
            console.error("复制失败:", err);
            alert("复制失败，请手动选取复制");
        }
    }, []);

    return { copiedStates, handleCopy };
}
