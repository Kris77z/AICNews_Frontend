import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import type { CostReport } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentDir = process.cwd();
    const projectRoot = join(currentDir, '..');
    const reportsDir = join(projectRoot, 'data', 'cost_reports');
    const filePath = join(reportsDir, `cost_report_${id}.json`);

    // 检查文件是否存在
    try {
      await access(filePath);
    } catch (accessError) {
      console.error('File not found:', filePath);
      return NextResponse.json(
        { error: 'Cost report not found', filePath, id },
        { status: 404 }
      );
    }

    const fileContent = await readFile(filePath, 'utf-8');
    const data: CostReport = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading cost report:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Failed to read cost report',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

