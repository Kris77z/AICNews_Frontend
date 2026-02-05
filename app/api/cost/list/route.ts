import { NextResponse } from 'next/server';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import type { CostReportListItem, CostReport } from '@/lib/types';

export async function GET() {
  try {
    const projectRoot = join(process.cwd(), '..');
    const reportsDir = join(projectRoot, 'data', 'cost_reports');
    
    const files = await readdir(reportsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const reports: CostReportListItem[] = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = join(reportsDir, file);
        const stats = await stat(filePath);
        
        // 从文件名提取时间戳：cost_report_20251124_165715.json
        const match = file.match(/cost_report_(\d{8}_\d{6})\.json/);
        const id = match ? match[1] : file.replace('.json', '');
        
        // 读取文件获取总成本
        let total_cost: number | undefined;
        try {
          const content = await readFile(filePath, 'utf-8');
          const data: CostReport = JSON.parse(content);
          total_cost = data.summary?.total_cost;
        } catch (e) {
          // 忽略读取错误
        }
        
        return {
          id,
          filename: file,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          size: stats.size,
          total_cost,
        };
      })
    );
    
    // 按时间倒序排列
    reports.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error reading cost reports list:', error);
    return NextResponse.json(
      { error: 'Failed to read cost reports list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

