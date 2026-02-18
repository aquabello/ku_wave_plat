import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock } from 'lucide-react';

interface ContentListProps {
  playlistName: string;
}

export function ContentList({ playlistName }: ContentListProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{playlistName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 0개의 콘텐츠
          </p>
        </div>
      </div>

      {/* Content List - Currently Empty */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            콘텐츠 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="rounded-full bg-muted/30 p-4 inline-flex mb-4">
              <Clock className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              콘텐츠 관리 기능은 곧 추가될 예정입니다
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
