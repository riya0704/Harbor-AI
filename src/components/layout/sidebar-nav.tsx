
"use client";

import { Bot, Home, Link as LinkIcon, Settings } from "lucide-react";
import Link from 'next/link';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
    { href: "#", label: "Connections", icon: LinkIcon },
    { href: "#", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
          <Logo className="h-7 w-7" />
          <span className="text-xl font-semibold font-headline">Harbor AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                as={Link}
                href={item.href}
              >
                <span>
                  <item.icon />
                  {item.label}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Card className="m-2 bg-muted/50">
          <CardHeader className="p-4">
            <CardTitle className="text-sm">API Usage</CardTitle>
            <CardDescription className="text-xs">
              You've used 80% of your credits.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Progress value={80} aria-label="80% of API credits used" />
            <Button size="sm" className="mt-4 w-full">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      </SidebarFooter>
    </>
  );
}
