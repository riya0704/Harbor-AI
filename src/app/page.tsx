"use client";

import AccountManager from "@/components/dashboard/account-manager";
import AiAssistant from "@/components/dashboard/ai-assistant";
import ContentCalendar from "@/components/dashboard/content-calendar";
import Header from "@/components/layout/header";
import withAuth from "@/components/layout/with-auth";
import SidebarNav from "@/components/layout/sidebar-nav";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar className="h-full border-r">
          <SidebarNav />
        </Sidebar>
        <SidebarInset className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-3">
              <div className="grid gap-8 lg:col-span-2">
                <ContentCalendar />
              </div>
              <div className="grid gap-8">
                <AccountManager />
                <AiAssistant />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default withAuth(DashboardPage);