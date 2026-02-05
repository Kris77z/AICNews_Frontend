import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import type { PipelineState } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 获取项目根目录（frontend 的父目录）
    const currentDir = process.cwd();
    const projectRoot = join(currentDir, '..');
    const resultsDir = join(projectRoot, 'data', 'pipeline_results');
    const filePath = join(resultsDir, `result_${id}.json`);

    // 检查文件是否存在
    try {
      await access(filePath);
    } catch (accessError) {
      console.error('File not found:', filePath);
      return NextResponse.json(
        { error: 'Pipeline not found', filePath, id },
        { status: 404 }
      );
    }

    // 读取 Pipeline 结果
    const fileContent = await readFile(filePath, 'utf-8');
    const pipelineData: PipelineState = JSON.parse(fileContent);

    // 尝试读取对应的成本报告
    let costReport = null;
    try {
      const costReportPath = join(projectRoot, 'data', 'cost_reports', `cost_report_${id}.json`);
      await access(costReportPath);
      const costContent = await readFile(costReportPath, 'utf-8');
      costReport = JSON.parse(costContent);
    } catch (e) {
      // 成本报告不存在，忽略错误
      // console.log('Cost report not found for', id);
    }

    return NextResponse.json({
      pipeline: pipelineData,
      cost_report: costReport
    });
  } catch (error) {
    console.error('Error reading pipeline:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Failed to read pipeline',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

