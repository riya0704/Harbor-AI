'use client';

import { useState } from 'react';
import withAuth from '@/components/layout/with-auth';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { PageHeader } from '@/components/layout/page-header';
import { SchedulingAnalytics } from '@/components/dashboard/scheduling-analytics';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { RefreshCw, Download, Calendar, TrendingUp } from 'lucide-react';

function AnalyticsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Analytics Refreshed',
      description: 'Your analytics data has been updated.',
    });
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your analytics report is being generated.',
    });
    // TODO: Implement export functionality
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
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Page Header */}
              <PageHeader
                title="Analytics & Insights"
                description="Track your social media performance and engagement metrics across all platforms"
                showHomeButton={true}
              >
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </PageHeader>

              {/* Analytics Content */}
              <div className="space-y-6">
                <SchedulingAnalytics refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default withAuth(AnalyticsPage);