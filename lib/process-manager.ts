import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

// Define the root directory of the project (parent of frontend)
const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export type ProcessStatus = 'running' | 'stopped' | 'error' | 'completed';

export interface ProcessInfo {
    id: string;
    name: string;
    command: string;
    args: string[];
    status: ProcessStatus;
    pid?: number;
    startTime?: string;
    logFile: string;
}

// File to store process state
const STATE_FILE = path.join(PROJECT_ROOT, '.process_state.json');

class ProcessManager {
    private processes: Map<string, ProcessInfo> = new Map();
    private childProcesses: Map<string, ChildProcess> = new Map();

    constructor() {
        // Initialize with known scripts
        this.registerProcess('pipeline', '主流水线 (手动触发)', 'python', ['run_pipeline.py']);
        this.registerProcess('batch_pipeline', '批处理流水线 (守护进程)', 'python', ['run_batch_pipeline.py']);
        this.registerProcess('tg_history', 'Telegram 历史消息采集', 'python', ['-m', 'telegram_fetcher.main', 'history']);
        this.registerProcess('tg_realtime', 'Telegram 实时消息采集', 'python', ['-m', 'telegram_fetcher.main', 'realtime']);
        this.registerProcess('tests', '运行所有测试', 'pytest', []);
        this.registerProcess('editorial_pipeline', '深度编辑流水线 (周报)', 'python', ['scripts/run_report.py', '--type', 'weekly', '--write-article']);
        this.registerProcess('curator', '双轨制选题官 (守护进程)', 'python', ['scripts/run_curator.py']);

        this.loadState();
    }

    private registerProcess(id: string, name: string, command: string, args: string[]) {
        this.processes.set(id, {
            id,
            name,
            command,
            args,
            status: 'stopped',
            logFile: path.join(LOGS_DIR, `process_${id}.log`),
        });
    }

    private saveState() {
        const state: Record<string, ProcessInfo> = {};
        for (const [id, info] of this.processes.entries()) {
            state[id] = info;
        }
        try {
            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        } catch (e) {
            console.error("Failed to save process state", e);
        }
    }

    private loadState() {
        if (!fs.existsSync(STATE_FILE)) return;
        try {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
            for (const id in state) {
                if (this.processes.has(id)) {
                    const savedInfo = state[id];
                    const currentInfo = this.processes.get(id)!;

                    // Check if process is still running
                    if (savedInfo.pid && savedInfo.status === 'running') {
                        try {
                            process.kill(savedInfo.pid, 0); // Check if process exists
                            currentInfo.pid = savedInfo.pid;
                            currentInfo.status = 'running';
                            currentInfo.startTime = savedInfo.startTime;
                        } catch (e) {
                            // Process not found
                            currentInfo.status = 'stopped'; // Or 'error' / 'terminated'
                            currentInfo.pid = undefined;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load process state", e);
        }
    }

    public getAllProcesses(): ProcessInfo[] {
        return Array.from(this.processes.values());
    }

    public getProcess(id: string): ProcessInfo | undefined {
        return this.processes.get(id);
    }

    public startProcess(id: string): ProcessInfo {
        const processInfo = this.processes.get(id);
        if (!processInfo) {
            throw new Error(`Process ${id} not found`);
        }

        if (processInfo.status === 'running') {
            // Double check if it's really running
            if (processInfo.pid) {
                try {
                    process.kill(processInfo.pid, 0);
                    return processInfo; // Really running
                } catch (e) {
                    processInfo.status = 'stopped'; // Was dead
                }
            }
        }

        // Reset log file
        fs.writeFileSync(processInfo.logFile, '');

        const logStream = fs.createWriteStream(processInfo.logFile, { flags: 'a' });

        console.log(`Starting process ${id}: ${processInfo.command} ${processInfo.args.join(' ')}`);

        const child = spawn(processInfo.command, processInfo.args, {
            cwd: PROJECT_ROOT,
            shell: true,
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
        });

        if (!child.pid) {
            throw new Error("Failed to spawn process");
        }

        processInfo.status = 'running';
        processInfo.pid = child.pid;
        processInfo.startTime = new Date().toISOString();

        this.childProcesses.set(id, child);
        this.saveState();

        child.stdout?.on('data', (data) => {
            logStream.write(data);
        });

        child.stderr?.on('data', (data) => {
            logStream.write(data);
        });

        child.on('close', (code) => {
            console.log(`Process ${id} exited with code ${code}`);
            processInfo.status = code === 0 ? 'completed' : 'error';
            processInfo.pid = undefined;
            this.childProcesses.delete(id);
            logStream.end();
            this.saveState();
        });

        child.on('error', (err) => {
            console.error(`Process ${id} error:`, err);
            processInfo.status = 'error';
            logStream.write(`\nError: ${err.message}\n`);
            logStream.end();
            this.saveState();
        });

        return processInfo;
    }

    public stopProcess(id: string): ProcessInfo {
        const processInfo = this.processes.get(id);
        if (!processInfo) {
            throw new Error(`Process ${id} not found`);
        }

        // Try to find child process in memory first
        let child = this.childProcesses.get(id);

        // If not in memory but we have a PID (from restored state)
        if (!child && processInfo.pid) {
            try {
                process.kill(processInfo.pid, 'SIGTERM');
                processInfo.status = 'stopped';
                processInfo.pid = undefined;
                this.saveState();
                return processInfo;
            } catch (e) {
                console.error(`Failed to kill process ${processInfo.pid}`, e);
                // Assume it's already gone
                processInfo.status = 'stopped';
                processInfo.pid = undefined;
                this.saveState();
                return processInfo;
            }
        }

        if (child) {
            child.kill('SIGTERM');
            processInfo.status = 'stopped';
            processInfo.pid = undefined;
            this.childProcesses.delete(id);
            this.saveState();
        }

        return processInfo;
    }
}

// Singleton instance
export const processManager = new ProcessManager();
