"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/layout/header";
import withAuth from "@/components/layout/with-auth";
import SidebarNav from "@/components/layout/sidebar-nav";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { SocialAccountsWidget } from "@/components/dashboard/social-accounts-widget";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AIInsights } from "@/components/ai/ai-insights";
import { AIQuickActions } from "@/components/ai/ai-quick-actions";
import { SchedulePostDialog } from "@/components/calendar/schedule-post-dialog";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Calendar, 
  Bot, 
  Users, 
  BarChart3, 
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";

function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [contentToSchedule, setContentToSchedule] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Dashboard Refreshed',
      description: 'All data has been updated',
    });
  };

  const handleContentGenerated = (content: any) => {
    // Content generated successfully
    console.log('Content generated:', content);
  };

  const handleScheduleContent = (content: any) => {
    setContentToSchedule(content);
    setShowScheduleDialog(true);
  };

  const handleContentScheduled = () => {
    setShowScheduleDialog(false);
    setContentToSchedule(null);
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Content Scheduled!',
      description: 'Your content has been scheduled successfully.',
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar className="h-full border-r">
          <SidebarNav />
        </Sidebar>
        <SidebarInset className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
              {/* Welcome Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Welcome to Harbor AI</h1>
                  <p className="text-muted-foreground mt-2">
                    Your AI-powered social media management platform
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={handleRefresh}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={() => router.push('/calendar')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mr-4">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Scheduled Posts</p>
                        <p className="text-2xl font-bold">12</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mr-4">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Published</p>
                        <p className="text-2xl font-bold">48</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mr-4">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Connected Accounts</p>
                        <p className="text-2xl font-bold">3</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl mr-4">
                        <Bot className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">AI Generated</p>
                        <p className="text-2xl font-bold">24</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Main Dashboard */}
                <div className="xl:col-span-2 space-y-6">
                  <DashboardOverview refreshTrigger={refreshTrigger} />
                  <RecentActivity refreshTrigger={refreshTrigger} />
                </div>
                
                {/* Right Column - Sidebar Widgets */}
                <div className="space-y-6">
                  <SocialAccountsWidget refreshTrigger={refreshTrigger} />
                  <QuickActions />
                  <AIInsights refreshTrigger={refreshTrigger} />
                </div>
              </div>

              {/* AI Features Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                      AI Content Generation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Generate engaging content with our AI assistant. Set up your business context and create personalized posts.
                    </p>
                    <div className="flex space-x-2">
                      <Button onClick={() => router.push('/ai-assistant')} className="flex-1">
                        <Bot className="h-4 w-4 mr-2" />
                        AI Assistant
                      </Button>
                      <Button variant="outline" onClick={() => router.push('/ai-assistant?tab=generate')}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                      Content Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Plan and schedule your content with our visual calendar. Manage posts across all your social media platforms.
                    </p>
                    <div className="flex space-x-2">
                      <Button onClick={() => router.push('/calendar')} className="flex-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Calendar
                      </Button>
                      <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => router.push('/connections')}
                    >
                      <Users className="h-6 w-6" />
                      <span>Connect Accounts</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => router.push('/ai-assistant')}
                    >
                      <Bot className="h-6 w-6" />
                      <span>AI Assistant</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                      onClick={() => router.push('/analytics')}
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span>View Analytics</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Quick Actions */}
              <AIQuickActions
                onContentGenerated={handleContentGenerated}
                onScheduleContent={handleScheduleContent}
              />
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Schedule Content Dialog */}
      {showScheduleDialog && (
        <SchedulePostDialog
          isOpen={showScheduleDialog}
          onClose={() => setShowScheduleDialog(false)}
          defaultDate={new Date()}
          onScheduled={handleContentScheduled}
          defaultContent={contentToSchedule ? {
            content: contentToSchedule.content,
            image: contentToSchedule.image,
            video: contentToSchedule.video,
            platforms: [contentToSchedule.platform],
            type: contentToSchedule.type === 'text' ? 'dynamic' : 'static'
          } : undefined}
        />
      )}
    </SidebarProvider>
  );
}

export default withAuth(DashboardPage);
