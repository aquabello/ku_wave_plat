import { FileQuestion } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
      <div className="rounded-full bg-muted/30 p-6 mb-6">
        <FileQuestion className="h-16 w-16 text-muted-foreground/40" />
      </div>
      <h3 className="text-xl font-semibold mb-2">플레이리스트를 선택하세요</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        좌측 목록에서 플레이리스트를 선택하면 해당 콘텐츠가 여기에 표시됩니다
      </p>
    </div>
  );
}
