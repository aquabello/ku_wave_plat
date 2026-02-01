import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">상품 관리</h1>
          <p className="text-muted-foreground">
            상품을 등록하고 관리합니다
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          상품 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>상품 목록</CardTitle>
          <CardDescription>
            전체 상품 목록을 확인하고 관리할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            상품 테이블 (추후 구현)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
