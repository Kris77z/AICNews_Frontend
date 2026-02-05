'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">出错了</h2>
          <p className="text-muted-foreground">{error.message}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">错误代码: {error.digest}</p>
          )}
          <div className="flex gap-4 justify-center">
            <Button onClick={reset}>重试</Button>
            <Link href="/">
              <Button variant="outline">返回首页</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

