'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Plus,
  Bot,
  Zap
} from 'lucide-react';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { SchedulingAnalytics } from '@/components/dashboard/scheduling-analytics';
import { SocialAccountsWidget } from '@/components/dashboard/social-accounts-widget';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AIInsights } from '@/components/ai/ai-insights';
import withAuth from '@/components/layout/with-auth';

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Dashboard Refreshed',
      description: 'All data has been updated',
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your social media management activities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => router.push('/calendar')}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Bot className="h-4 w-4" />
            <span>AI Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <DashboardOverview refreshTrigger={refreshTrigger} />
              <RecentActivity refreshTrigger={refreshTrigger} />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <SocialAccountsWidget refreshTrigger={refreshTrigger} />
              <QuickActions />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SchedulingAnalytics refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SocialAccountsWidget refreshTrigger={refreshTrigger} detailed />
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage your connected social media accounts, verify connections, and add new platforms.
                </p>
                <Button className="w-full" onClick={() => router.push('/connections')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect New Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights refreshTrigger={refreshTrigger} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Business Context Setup</h4>
                      <p className="text-sm text-muted-foreground">Configure AI for personalized content</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => router.push('/ai-assistant')}>
                      Setup
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Content Generator</h4>
                      <p className="text-sm text-muted-foreground">AI-powered content creation</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => router.push('/ai-assistant?tab=generate')}>
                      Generate
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Quick Actions</h4>
                      <p className="text-sm text-muted-foreground">Fast content templates</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => router.push('/ai-assistant?tab=quick')}>
                      Use
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(DashboardPage);