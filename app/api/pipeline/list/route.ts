import { NextResponse } from 'next/server';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import type { PipelineListItem } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const currentDir = process.cwd();
    const projectRoot = join(currentDir, '..');
    const resultsDir = join(projectRoot, 'data', 'pipeline_results');
    const costDir = join(projectRoot, 'data', 'cost_reports');

    let files: string[] = [];
    try {
      files = await readdir(resultsDir);
    } catch (error) {
      console.error('Error reading results directory:', resultsDir, error);
      return NextResponse.json({ pipelines: [], total: 0 });
    }

    // Filter json files and sort by name descending (timestamp)
    const allJsonFiles = files
      .filter(f => f.endsWith('.json') && f.startsWith('result_'))
      .sort()
      .reverse();

    const total = allJsonFiles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = allJsonFiles.slice(startIndex, endIndex);

    const pipelines = await Promise.all(
      paginatedFiles.map(async (file) => {
        try {
          const filePath = join(resultsDir, file);
          const fileContent = await readFile(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          const stats = await stat(filePath);

          // Extract ID from filename: result_20251126_084853.json -> 20251126_084853
          const match = file.match(/result_(\d{8}_\d{6})\.json/);
          const id = match ? match[1] : file.replace('result_', '').replace('.json', '');

          // Try to read cost report
          let totalCost = 0;
          try {
            const costFile = join(costDir, `cost_report_${id}.json`);
            const costContent = await readFile(costFile, 'utf-8');
            const costData = JSON.parse(costContent);
            totalCost = costData.summary?.total_cost || costData.total_cost || 0;
          } catch (e) {
            // Cost report might not exist
          }

          return {
            id,
            timestamp: data.timestamp || stats.birthtime.toISOString(),
            title: data.article?.title,
            triggered: data.decision?.trigger || false,
            processed_count: data.raw_events?.length || 0,
            extracted_count: data.structured_events?.length || 0,
            cluster_count: data.clusters?.length || 0,
            total_cost: totalCost,
            filename: file,
          };
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
          return null;
        }
      })
    );

    return NextResponse.json({
      pipelines: pipelines.filter(Boolean),
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error reading pipeline list:', error);
    return NextResponse.json(
      { error: 'Failed to read pipeline list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

