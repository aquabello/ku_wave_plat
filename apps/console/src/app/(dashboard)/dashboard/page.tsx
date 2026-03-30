'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Zap,
  Radio,
  TvMinimalPlay,
  Users,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { getDashboardOverview } from '@/lib/api/dashboard';
import type { DashboardOverview } from '@/lib/api/dashboard';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// --- 정적 데이터 ---

const roomLinks = [
  { building: '경영관', room: '306', ip: '203.252.129.139' },
  { building: '공학관', room: '231', ip: '203.252.148.92' },
  { building: '공학관', room: '233', ip: '203.252.148.93' },
  { building: '공학관', room: '234', ip: '203.252.148.94' },
  { building: '공학관', room: '404', ip: '203.252.157.31' },
  { building: '교육과학관', room: '105', ip: '117.16.141.4' },
  { building: '산학협동관', room: '201', ip: '117.16.145.21' },
  { building: '산학협동관', room: '211', ip: '117.16.145.209' },
  { building: '산학협동관', room: '216', ip: '117.16.145.166' },
  { building: '산학협동관', room: '220', ip: '117.16.145.227' },
  { building: '상허연구관', room: '217', ip: '117.16.139.145' },
  { building: '생명과학관', room: '101', ip: '203.252.175.145' },
  { building: '생명과학관', room: '451', ip: '203.252.175.192' },
  { building: '예술문화관', room: '719', ip: '203.252.184.11' },
  { building: '예술문화관', room: '720', ip: '203.252.184.72' },
  { building: '예술문화관', room: '721', ip: '203.252.184.73' },
  { building: '예술문화관', room: 'B101', ip: '203.252.183.76' },
  { building: '인문학관', room: '204', ip: '203.252.145.107' },
  { building: '창의관', room: '104', ip: '113.198.103.10' },
  { building: '창의관', room: '107', ip: '113.198.103.41' },
  { building: '해봉부동산학관', room: '303', ip: '114.70.20.97' },
  { building: '수의학관', room: '514', ip: '203.252.163.34' },
];

function buildSummaryCards(data?: DashboardOverview) {
  return [
    {
      title: '컨트롤러',
      value: data ? `${data.controller.total}대` : '-',
      sub: data ? `온라인 ${data.controller.active} · 오프라인 ${data.controller.inactive}` : '로딩 중...',
      icon: Zap,
    },
    {
      title: 'NFC 카드',
      value: data ? `${data.nfc.totalCards.toLocaleString()}개` : '-',
      sub: data ? `오늘 태그 ${data.nfc.todayTagCount.toLocaleString()}건` : '로딩 중...',
      icon: Radio,
    },
    {
      title: '디스플레이',
      value: data ? `${data.display.total}대` : '-',
      sub: data ? `온라인 ${data.display.online} · 오프라인 ${data.display.offline}` : '로딩 중...',
      icon: TvMinimalPlay,
    },
    {
      title: '등록 회원',
      value: data ? `${data.users.total.toLocaleString()}명` : '-',
      sub: data ? `활성 회원 ${data.users.active.toLocaleString()}명` : '로딩 중...',
      icon: Users,
    },
  ];
}

// --- 컴포넌트 ---

export default function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: getDashboardOverview,
    refetchInterval: 30000, // 30초마다 갱신
  });
  const summaryCards = buildSummaryCards(overview);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          WAVE 플랫폼 전체 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 호실 바로가기 */}
      <div>
        <h2 className="text-lg font-semibold">호실 바로가기</h2>
        <p className="text-sm text-muted-foreground">
          클릭하면 해당 호실 페이지로 이동합니다
        </p>
        <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {roomLinks.map((room) => (
            <a
              key={`${room.building}-${room.room}`}
              href={`http://${room.ip}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative rounded-lg border bg-card p-3 cursor-pointer hover:bg-accent hover:shadow-sm transition-colors"
            >
              <ExternalLink className="absolute top-2 right-2 h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground pr-4">{room.building}</p>
              <p className="text-sm font-semibold">{room.room}</p>
            </a>
          ))}
        </div>
      </div>

      {/* 상단: 요약 카드 4개 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 중단: 차트 영역 */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* 컨트롤러 상태 현황 (도넛 차트) */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>컨트롤러 상태 현황</CardTitle>
            <CardDescription>전체 {overview?.controller.total ?? 0}대 운영 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '온라인', value: overview?.controller.active ?? 0, color: '#16a34a' },
                      { name: '오프라인', value: overview?.controller.inactive ?? 0, color: '#9ca3af' },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, value }) => `${name} ${value}`}
                  >
                    {[
                      { name: '온라인', value: overview?.controller.active ?? 0, color: '#16a34a' },
                      { name: '오프라인', value: overview?.controller.inactive ?? 0, color: '#9ca3af' },
                    ].filter(d => d.value > 0).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 녹화 강의 현황 (바 차트) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>녹화 강의 현황</CardTitle>
            <CardDescription>최근 7일간 녹화 건수</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(overview?.recordingsByDay ?? []).map(d => ({
                day: d.date.slice(5), // "MM-DD" format
                건수: d.count,
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="건수"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 하단: 활동 & 상태 */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* 최근 활동 로그 */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>실시간 시스템 활동 내역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(overview?.recentActivities ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">활동 내역이 없습니다</p>
              ) : (
                overview?.recentActivities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm leading-snug">
                        {item.actionName}
                        {item.userName && <span className="text-muted-foreground"> · {item.userName}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className={`inline-block rounded px-1 mr-1 text-[10px] font-medium ${
                          item.httpMethod === 'GET' ? 'bg-blue-100 text-blue-700' :
                          item.httpMethod === 'POST' ? 'bg-green-100 text-green-700' :
                          item.httpMethod === 'PUT' || item.httpMethod === 'PATCH' ? 'bg-yellow-100 text-yellow-700' :
                          item.httpMethod === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.httpMethod}
                        </span>
                        {new Date(item.regDate).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    {item.statusCode && (
                      <span className={`shrink-0 text-xs font-medium ${item.statusCode < 400 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.statusCode}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 디스플레이 콘텐츠 상태 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>디스플레이 콘텐츠</CardTitle>
            <CardDescription>현재 콘텐츠 배포 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(overview?.displayContents ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">등록된 콘텐츠가 없습니다</p>
              ) : (
                overview?.displayContents.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-snug">
                        {item.contentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.contentType}
                        {item.validTo && ` · ~${new Date(item.validTo).toLocaleDateString('ko-KR')}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.contentStatus === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.contentStatus === 'ACTIVE' ? '활성' : '비활성'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
