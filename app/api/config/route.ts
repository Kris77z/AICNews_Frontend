import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // 读取 .env 文件（如果存在）
    const projectRoot = join(process.cwd(), '..');
    const envPath = join(projectRoot, '.env');
    
    let envContent = '';
    try {
      envContent = await readFile(envPath, 'utf-8');
    } catch (error) {
      // .env 文件不存在，尝试读取 .env.local
      try {
        const envLocalPath = join(projectRoot, '.env.local');
        envContent = await readFile(envLocalPath, 'utf-8');
      } catch (e) {
        // 都不存在，返回空配置
      }
    }

    // 解析环境变量（只显示配置相关的，不显示敏感信息）
    const config: Record<string, string> = {};
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          // 只显示配置相关的环境变量
          if (
            key.includes('LLM') ||
            key.includes('MODEL') ||
            key.includes('TEMPERATURE') ||
            key.includes('PROVIDER') ||
            key.includes('MESSAGES_DIR') ||
            key.includes('HOURS_BACK') ||
            key.includes('LIMIT') ||
            key.includes('MIN_SUPPORT') ||
            key.includes('THRESHOLD')
          ) {
            // 隐藏敏感信息（API Key）
            if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
              config[key] = value.substring(0, 8) + '...';
            } else {
              config[key] = value;
            }
          }
        }
      }
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error reading config:', error);
    return NextResponse.json(
      { error: 'Failed to read config', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

