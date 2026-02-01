import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">고객 관리</h1>
        <p className="text-muted-foreground">
          고객 정보를 확인하고 관리합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>고객 목록</CardTitle>
          <CardDescription>
            전체 고객 목록을 확인하고 관리할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            고객 테이블 (추후 구현)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
