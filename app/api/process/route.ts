import { NextRequest, NextResponse } from 'next/server';
import { processManager } from '@/lib/process-manager';

export async function GET() {
    const processes = processManager.getAllProcesses();
    return NextResponse.json(processes);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
        }

        if (action === 'start') {
            const processInfo = processManager.startProcess(id);
            return NextResponse.json(processInfo);
        } else if (action === 'stop') {
            const processInfo = processManager.stopProcess(id);
            return NextResponse.json(processInfo);
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
