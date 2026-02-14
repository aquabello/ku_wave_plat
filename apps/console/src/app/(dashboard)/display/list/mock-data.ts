export type Orientation = 'vertical' | 'horizontal';
export type ScreenLayout = '1x1' | '2x2' | '3x3';
export type PlayOrder = 'sequential' | 'random';

export interface MockPlaylist {
  id: string;
  name: string;
  orientation: Orientation;
  screenLayout: ScreenLayout;
  playOrder: PlayOrder;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const mockPlaylists: MockPlaylist[] = [
  {
    id: '1',
    name: '법학관-컨텐츠-리스트',
    orientation: 'horizontal',
    screenLayout: '1x1',
    playOrder: 'random',
    isActive: true,
    description: '법학관 디스플레이용 랜덤 재생 리스트',
    createdAt: new Date('2025-11-20'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: '2',
    name: '공학관-리스트',
    orientation: 'vertical',
    screenLayout: '1x1',
    playOrder: 'sequential',
    isActive: true,
    description: '공학관 디스플레이용 순차 재생',
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2026-02-10'),
  },
  {
    id: '3',
    name: '상허도서관',
    orientation: 'vertical',
    screenLayout: '1x1',
    playOrder: 'sequential',
    isActive: false,
    description: '상허도서관 안내 콘텐츠',
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-12-20'),
  },
  {
    id: '4',
    name: '학생회관-멀티스크린',
    orientation: 'horizontal',
    screenLayout: '2x2',
    playOrder: 'random',
    isActive: true,
    description: '학생회관 2x2 멀티스크린 구성',
    createdAt: new Date('2025-09-10'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: '5',
    name: '체육관-세로형',
    orientation: 'vertical',
    screenLayout: '3x3',
    playOrder: 'sequential',
    isActive: true,
    description: '체육관 3x3 대형 스크린',
    createdAt: new Date('2025-08-05'),
    updatedAt: new Date('2026-01-20'),
  },
];

export const orientationLabels: Record<Orientation, string> = {
  vertical: '세로',
  horizontal: '가로',
};

export const screenLayoutLabels: Record<ScreenLayout, string> = {
  '1x1': '1x1',
  '2x2': '2x2',
  '3x3': '3x3',
};

export const playOrderLabels: Record<PlayOrder, string> = {
  sequential: '순차',
  random: '랜덤',
};
