'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const router = useRouter();

  const handleLogout = () => {
    // Remove access_token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }

    // Redirect to login page
    router.replace('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full transition-all duration-200 hover:scale-105 hover:ring-2 hover:ring-konkuk-green/20 hover:ring-offset-2"
        >
          <Avatar className="h-10 w-10 shadow-md ring-2 ring-background transition-all duration-200 hover:shadow-lg">
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback className="bg-gradient-to-br from-konkuk-green to-konkuk-green-light text-white font-semibold">
              KU
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 rounded-xl border-border/40 bg-card/95 p-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/90"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shadow-md ring-2 ring-konkuk-green/20">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback className="bg-gradient-to-br from-konkuk-green to-konkuk-green-light text-white font-semibold">
                KU
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">관리자</p>
              <p className="text-xs leading-none text-muted-foreground">
                admin@ku.com
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2 bg-border/40" />
        <DropdownMenuItem className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:scale-[1.02] hover:bg-accent/50 focus:bg-accent/50">
          <User className="mr-3 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          <span className="font-medium">프로필</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:scale-[1.02] hover:bg-accent/50 focus:bg-accent/50">
          <Settings className="mr-3 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          <span className="font-medium">설정</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2 bg-border/40" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="group cursor-pointer rounded-lg px-3 py-2.5 text-destructive transition-all duration-200 hover:scale-[1.02] hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-3 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          <span className="font-medium">로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
