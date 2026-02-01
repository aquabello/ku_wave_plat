import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, ShoppingCart } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: '총 사용자',
      value: '2,420',
      change: '+12.5%',
      icon: Users,
    },
    {
      title: '총 주문',
      value: '1,287',
      change: '+8.2%',
      icon: ShoppingCart,
    },
    {
      title: '매출',
      value: '₩45,231,890',
      change: '+23.1%',
      icon: TrendingUp,
    },
    {
      title: '전환율',
      value: '3.24%',
      change: '+0.5%',
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          전체 시스템 현황을 한눈에 확인하세요
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last
                month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>개요</CardTitle>
            <CardDescription>
              최근 30일간의 매출 추이
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              차트 영역 (추후 구현)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>
              최근 시스템 활동 내역
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      활동 {i}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {i}분 전
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
