import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

async function getConfig(): Promise<Record<string, string>> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/config`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return {};
    }

    const data = await res.json();
    return data.config || {};
  } catch (error) {
    console.error('Error fetching config:', error);
    return {};
  }
}

export default async function SettingsPage() {
  const config = await getConfig();

  // 分组配置
  const llmConfig: Record<string, string> = {};
  const pipelineConfig: Record<string, string> = {};
  const otherConfig: Record<string, string> = {};

  Object.entries(config).forEach(([key, value]) => {
    if (key.includes('LLM') || key.includes('MODEL') || key.includes('TEMPERATURE') || key.includes('PROVIDER')) {
      llmConfig[key] = value;
    } else if (key.includes('MESSAGES_DIR') || key.includes('HOURS_BACK') || key.includes('LIMIT') || key.includes('SUPPORT') || key.includes('THRESHOLD')) {
      pipelineConfig[key] = value;
    } else {
      otherConfig[key] = value;
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">配置管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            当前 Pipeline 配置信息（只读）
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">返回首页</Button>
        </Link>
      </div>

      {Object.keys(config).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">无法读取配置</p>
            <p className="text-sm text-muted-foreground mt-2">
              请确保 .env 文件存在于项目根目录
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* LLM 配置 */}
          {Object.keys(llmConfig).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>LLM 配置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(llmConfig).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{key}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {value || <span className="text-muted-foreground italic">未设置</span>}
                        </div>
                      </div>
                      {value && (
                        <Badge variant="outline">已配置</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pipeline 配置 */}
          {Object.keys(pipelineConfig).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pipeline 配置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(pipelineConfig).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{key}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {value || <span className="text-muted-foreground italic">未设置</span>}
                        </div>
                      </div>
                      {value && (
                        <Badge variant="outline">已配置</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 其他配置 */}
          {Object.keys(otherConfig).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>其他配置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(otherConfig).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{key}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {value || <span className="text-muted-foreground italic">未设置</span>}
                        </div>
                      </div>
                      {value && (
                        <Badge variant="outline">已配置</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>提示:</strong> 配置修改需要直接编辑项目根目录下的 <code>.env</code> 文件。
                修改后需要重启 Pipeline 服务才能生效。
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

