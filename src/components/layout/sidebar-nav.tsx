
"use client";

import { 
  Bot, 
  Home, 
  Link as LinkIcon, 
  Settings, 
  Calendar,
  BarChart3,
  Users,
  Sparkles,
  Crown,
  TrendingUp
} from "lucide-react";
import Link from 'next/link';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export default function SidebarNav() {
  const pathname = usePathname();

  const mainNavItems = [
    { href: "/", label: "Dashboard", icon: Home, description: "Overview & insights" },
    { href: "/calendar", label: "Calendar", icon: Calendar, description: "Schedule posts" },
    { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Performance metrics" },
  ];

  const aiNavItems = [
    { href: "/ai-assistant", label: "AI Assistant", icon: Bot, description: "Content generation", badge: "New" },
    { href: "/ai-assistant?tab=generate", label: "Quick Generate", icon: Sparkles, description: "Fast content creation" },
  ];

  const settingsNavItems = [
    { href: "/connections", label: "Social Accounts", icon: Users, description: "Connect platforms" },
    { href: "/settings", label: "Settings", icon: Settings, description: "App preferences" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <SidebarHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-center gap-3 p-4">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Logo className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Harbor AI
            </span>
            <p className="text-xs text-muted-foreground">Social Media Manager</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      className="w-full justify-start h-12 px-3 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`p-2 rounded-md transition-colors ${
                          isActive(item.href) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted group-hover:bg-accent'
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Features */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            AI Features
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {aiNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      className="w-full justify-start h-12 px-3 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`p-2 rounded-md transition-colors ${
                          isActive(item.href) 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                            : 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 group-hover:from-purple-200 group-hover:to-pink-200'
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      className="w-full justify-start h-12 px-3 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`p-2 rounded-md transition-colors ${
                          isActive(item.href) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted group-hover:bg-accent'
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm text-amber-900 dark:text-amber-100">API Usage</CardTitle>
            </div>
            <CardDescription className="text-xs text-amber-700 dark:text-amber-300">
              You've used 80% of your monthly credits
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700 dark:text-amber-300">8,000 / 10,000</span>
                <span className="text-amber-600 font-medium">80%</span>
              </div>
              <Progress 
                value={80} 
                className="h-2 bg-amber-100 dark:bg-amber-900" 
                aria-label="80% of API credits used" 
              />
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </SidebarFooter>
    </>
  );
}
