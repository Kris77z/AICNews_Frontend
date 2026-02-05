"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Square, FileText, RefreshCw } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"

interface ProcessInfo {
    id: string;
    name: string;
    command: string;
    args: string[];
    status: 'running' | 'stopped' | 'error' | 'completed';
    pid?: number;
    startTime?: string;
}

export default function ProcessesPage() {
    const [processes, setProcesses] = useState<ProcessInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedLogProcess, setSelectedLogProcess] = useState<string | null>(null)
    const [logs, setLogs] = useState("")
    const logEndRef = useRef<HTMLDivElement>(null)

    const fetchProcesses = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/process')
            const data = await res.json()
            setProcesses(data)
        } catch (error) {
            console.error("Failed to fetch processes", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProcesses()
        const interval = setInterval(fetchProcesses, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleStart = async (id: string) => {
        try {
            await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', id })
            })
            fetchProcesses()
        } catch (error) {
            console.error("Failed to start process", error)
        }
    }

    const handleStop = async (id: string) => {
        try {
            await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop', id })
            })
            fetchProcesses()
        } catch (error) {
            console.error("Failed to stop process", error)
        }
    }

    const fetchLogs = async (id: string) => {
        try {
            const res = await fetch(`/api/process/logs?id=${id}`)
            const data = await res.json()
            setLogs(data.logs || "No logs available.")
        } catch (error) {
            console.error("Failed to fetch logs", error)
            setLogs("Failed to fetch logs.")
        }
    }

    useEffect(() => {
        if (selectedLogProcess) {
            fetchLogs(selectedLogProcess)
            const interval = setInterval(() => fetchLogs(selectedLogProcess), 2000)
            return () => clearInterval(interval)
        }
    }, [selectedLogProcess])

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [logs])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-green-500 hover:bg-green-600'
            case 'stopped': return 'bg-gray-500 hover:bg-gray-600'
            case 'error': return 'bg-red-500 hover:bg-red-600'
            case 'completed': return 'bg-blue-500 hover:bg-blue-600'
            default: return 'bg-gray-500'
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">进程监控中心</h1>
                    <p className="text-muted-foreground mt-2">管理和监控后台进程与脚本。</p>
                </div>
                <Button variant="outline" onClick={fetchProcesses} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    刷新
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {processes.map((proc) => (
                    <Card key={proc.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{proc.name}</CardTitle>
                                <Badge className={getStatusColor(proc.status)}>
                                    {proc.status === 'running' ? '运行中' :
                                        proc.status === 'stopped' ? '已停止' :
                                            proc.status === 'error' ? '错误' :
                                                proc.status === 'completed' ? '已完成' : proc.status}
                                </Badge>
                            </div>
                            <CardDescription className="font-mono text-xs mt-2 bg-muted p-2 rounded">
                                {proc.command} {proc.args.join(' ')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                    <span>PID:</span>
                                    <span className="font-mono">{proc.pid || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>启动时间:</span>
                                    <span>{proc.startTime ? new Date(proc.startTime).toLocaleTimeString() : '-'}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 justify-end">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedLogProcess(proc.id)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        日志
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-[800px] sm:w-[540px] flex flex-col h-full">
                                    <SheetHeader>
                                        <SheetTitle>{proc.name} 日志</SheetTitle>
                                        <SheetDescription>该进程的实时输出。</SheetDescription>
                                    </SheetHeader>
                                    <div className="flex-1 mt-4 bg-black text-green-400 p-4 rounded-md font-mono text-xs overflow-auto whitespace-pre-wrap">
                                        {logs}
                                        <div ref={logEndRef} />
                                    </div>
                                </SheetContent>
                            </Sheet>

                            {proc.status === 'running' ? (
                                <Button variant="destructive" size="sm" onClick={() => handleStop(proc.id)}>
                                    <Square className="mr-2 h-4 w-4" />
                                    停止
                                </Button>
                            ) : (
                                <Button variant="default" size="sm" onClick={() => handleStart(proc.id)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    启动
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
