import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Avatar, AvatarFallback } from "./avatar";
import { User, LogOut, ChevronDown } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name?: string;
}

export function UserDropdown() {
  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
  });

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.name || user.email.split('@')[0];
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" disabled>
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}