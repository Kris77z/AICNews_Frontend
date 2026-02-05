import { NextRequest, NextResponse } from 'next/server';
import { processManager } from '@/lib/process-manager';
import fs from 'fs';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Process ID is required' }, { status: 400 });
    }

    const processInfo = processManager.getProcess(id);
    if (!processInfo) {
        return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    try {
        if (fs.existsSync(processInfo.logFile)) {
            const content = fs.readFileSync(processInfo.logFile, 'utf-8');
            return NextResponse.json({ logs: content });
        } else {
            return NextResponse.json({ logs: '' });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
