import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">
          시스템 설정을 관리합니다
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>일반 설정</CardTitle>
            <CardDescription>
              시스템의 기본 설정을 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">사이트 이름</Label>
              <Input id="siteName" placeholder="KU Console" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">사이트 URL</Label>
              <Input id="siteUrl" placeholder="https://console.ku.com" />
            </div>
            <Button>저장</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>
              알림 관련 설정을 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              알림 설정 (추후 구현)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
