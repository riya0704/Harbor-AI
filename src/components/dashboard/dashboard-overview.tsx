'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';

interface DashboardOverviewProps {
  refreshTrigger?: number;
}

interface OverviewStats {
  totalScheduled: number;
  pendingPosts: number;
  publishedPosts: number;
  failedPosts: number;
  successRate: number;
  connectedAccounts: number;
  upcomingPosts: number;
}

export function DashboardOverview({ refreshTrigger }: DashboardOverviewProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOverviewStats = async () => {
    try {
      // Fetch scheduling stats
      const [schedulingResponse, accountsResponse] = await Promise.all([
        fetch('/api/posts/stats?days=30', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        }),
        fetch('/api/social/accounts', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
      ]);

      const [schedulingData, accountsData] = await Promise.all([
        schedulingResponse.json(),
        accountsResponse.json()
      ]);

      if (schedulingResponse.ok && accountsResponse.ok) {
        const schedulingStats = schedulingData.userStats;

        setStats({
          totalScheduled: schedulingStats.overview.totalScheduled,
          pendingPosts: schedulingStats.overview.pendingPosts,
          publishedPosts: schedulingStats.overview.publishedPosts,
          failedPosts: schedulingStats.overview.failedPosts,
          successRate: schedulingStats.overview.successRate,
          connectedAccounts: accountsData.accounts.length,
          upcomingPosts: schedulingStats.upcoming.length
        });
      } else {
        throw new Error('Failed to fetch overview stats');
      }
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      toast({
        title: 'Error',
        description: 'Could not load dashboard overview',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewStats();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const overviewCards = [
    {
      title: 'Total Posts',
      value: stats.totalScheduled,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'All time scheduled posts'
    },
    {
      title: 'Pending',
      value: stats.pendingPosts,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Awaiting publication'
    },
    {
      title: 'Published',
      value: stats.publishedPosts,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Successfully published'
    },
    {
      title: 'Connected Accounts',
      value: stats.connectedAccounts,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Social media accounts'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Rate & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Publishing Success</span>
              <Badge variant={stats.successRate >= 90 ? 'default' : stats.successRate >= 70 ? 'secondary' : 'destructive'}>
                {stats.successRate}%
              </Badge>
            </div>
            <Progress value={stats.successRate} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {stats.publishedPosts} successful out of {stats.totalScheduled} total posts
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Post Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Published</span>
                </div>
                <span className="text-sm font-medium">{stats.publishedPosts}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="text-sm font-medium">{stats.pendingPosts}</span>
              </div>

              {stats.failedPosts > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Failed</span>
                  </div>
                  <span className="text-sm font-medium">{stats.failedPosts}</span>
                </div>
              )}
            </div>

            {stats.upcomingPosts > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{stats.upcomingPosts} posts scheduled for next 7 days</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Notifications */}
      {(stats.failedPosts > 0 || stats.connectedAccounts === 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.connectedAccounts === 0 && (
              <div className="text-sm text-orange-700">
                • No social media accounts connected. Connect accounts to start posting.
              </div>
            )}
            {stats.failedPosts > 0 && (
              <div className="text-sm text-orange-700">
                • {stats.failedPosts} posts failed to publish. Check your account connections.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}