import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">분석</h1>
        <p className="text-muted-foreground">
          데이터 분석 및 통계를 확인합니다
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>매출 분석</CardTitle>
            <CardDescription>
              기간별 매출 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              매출 차트 (추후 구현)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사용자 활동</CardTitle>
            <CardDescription>
              사용자 활동 통계
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              활동 차트 (추후 구현)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
