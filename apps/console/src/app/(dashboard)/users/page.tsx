import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
          <p className="text-muted-foreground">
            시스템 사용자를 관리합니다
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          사용자 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>
            전체 사용자 목록을 확인하고 관리할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            사용자 테이블 (추후 구현)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
