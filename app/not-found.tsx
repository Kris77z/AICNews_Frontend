import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <h2 className="text-2xl font-bold">404 - 页面未找到</h2>
          <p className="text-muted-foreground">抱歉，您访问的页面不存在。</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

