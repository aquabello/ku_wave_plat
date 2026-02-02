'use client';

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
  AlertTriangle,
  BookOpen,
  ScanLine,
  MonitorPlay,
  UserCheck,
} from 'lucide-react';
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

const summaryCards = [
  {
    title: '컨트롤러',
    value: '24대',
    sub: '온라인 18 · 오프라인 6',
    icon: Zap,
  },
  {
    title: 'RFID 태그',
    value: '1,240개',
    sub: '오늘 인식 328건',
    icon: Radio,
  },
  {
    title: '디스플레이',
    value: '36대',
    sub: '재생 중 28 · 대기 8',
    icon: TvMinimalPlay,
  },
  {
    title: '등록 회원',
    value: '482명',
    sub: '활성 회원 395명',
    icon: Users,
  },
];

const controllerStatusData = [
  { name: '온라인', value: 18, color: '#16a34a' },
  { name: '오프라인', value: 4, color: '#9ca3af' },
  { name: '에러', value: 2, color: '#ef4444' },
];

const aiSummaryData = [
  { day: '월', 건수: 12 },
  { day: '화', 건수: 8 },
  { day: '수', 건수: 15 },
  { day: '목', 건수: 10 },
  { day: '금', 건수: 22 },
  { day: '토', 건수: 5 },
  { day: '일', 건수: 18 },
];

const activityLog = [
  {
    icon: ScanLine,
    text: 'RFID 태그 #1234 인식 - 공학관 2층',
    time: '3분 전',
  },
  {
    icon: MonitorPlay,
    text: '디스플레이 D-12 콘텐츠 변경 - 학생회관 1층',
    time: '8분 전',
  },
  {
    icon: AlertTriangle,
    text: '컨트롤러 C-05 연결 끊김 - 경영관 3층',
    time: '15분 전',
  },
  {
    icon: UserCheck,
    text: '신규 회원 가입: 홍길동 (2024xxxx)',
    time: '22분 전',
  },
  {
    icon: BookOpen,
    text: 'AI 강의요약 생성 완료 - 데이터구조론 3주차',
    time: '35분 전',
  },
  {
    icon: ScanLine,
    text: 'RFID 태그 #0987 인식 - 과학관 B1',
    time: '42분 전',
  },
  {
    icon: MonitorPlay,
    text: '디스플레이 D-03 재생 시작 - 도서관 로비',
    time: '1시간 전',
  },
];

const displayContents = [
  {
    name: '2025학년도 수강신청 안내',
    status: '재생중',
    location: '학생회관 1층',
    color: 'bg-green-100 text-green-700',
  },
  {
    name: '동아리 박람회 포스터',
    status: '재생중',
    location: '공학관 로비',
    color: 'bg-green-100 text-green-700',
  },
  {
    name: '도서관 이용 안내',
    status: '대기',
    location: '도서관 로비',
    color: 'bg-gray-100 text-gray-600',
  },
  {
    name: '캠퍼스 안전 수칙',
    status: '만료예정',
    location: '경영관 3층',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    name: 'WAVE AI 서비스 소개',
    status: '재생중',
    location: '과학관 1층',
    color: 'bg-green-100 text-green-700',
  },
];

// --- 컴포넌트 ---

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          WAVE 플랫폼 전체 현황을 한눈에 확인하세요
        </p>
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
            <CardDescription>전체 24대 운영 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={controllerStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, value }) => `${name} ${value}`}
                  >
                    {controllerStatusData.map((entry) => (
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

        {/* AI 강의요약 처리 현황 (바 차트) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>AI 강의요약 처리 현황</CardTitle>
            <CardDescription>최근 7일간 처리 건수</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={aiSummaryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
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
              {activityLog.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-muted p-1.5">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm leading-snug">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
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
              {displayContents.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-snug">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.location}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${item.color}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
