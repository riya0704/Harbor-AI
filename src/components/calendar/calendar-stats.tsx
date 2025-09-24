'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface CalendarStatsProps {
  refreshTrigger?: number;
}

interface StatsData {
  overview: {
    totalScheduled: number;
    pendingPosts: number;
    publishedPosts: number;
    failedPosts: number;
    processingPosts: number;
    successRate: number;
  };
  platforms: Record<string, number>;
  upcomingPosts: Array<{
    id: string;
    scheduledTime: string;
    platforms: string[];
    content: string;
    type: string;
  }>;
}

export function CalendarStats({ refreshTrigger }: CalendarStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/posts/stats?days=30', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Ensure the data structure is what we expect
        const userStats = data.userStats || {};
        const safeStats = {
          overview: userStats.overview || {
            totalScheduled: 0,
            pendingPosts: 0,
            publishedPosts: 0,
            failedPosts: 0,
            processingPosts: 0,
            successRate: 0
          },
          platforms: userStats.platforms || {},
          upcomingPosts: userStats.upcomingPosts || []
        };
        setStats(safeStats);
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Could not load statistics',
        variant: 'destructive'
      });
      // Set empty stats to prevent undefined errors
      setStats({
        overview: {
          totalScheduled: 0,
          pendingPosts: 0,
          publishedPosts: 0,
          failedPosts: 0,
          processingPosts: 0,
          successRate: 0
        },
        platforms: {},
        upcomingPosts: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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

  if (!stats || !stats.overview) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Scheduled',
      value: stats.overview.totalScheduled || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pending Posts',
      value: stats.overview.pendingPosts || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Published',
      value: stats.overview.publishedPosts || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Success Rate',
      value: `${stats.overview.successRate || 0}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor} mr-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.platforms && Object.keys(stats.platforms).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.platforms)
                  .sort(([,a], [,b]) => b - a)
                  .map(([platform, count]) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          platform === 'Twitter' ? 'bg-blue-500' :
                          platform === 'LinkedIn' ? 'bg-blue-700' :
                          platform === 'Instagram' ? 'bg-pink-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium">{platform}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No platform data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingPosts && stats.upcomingPosts.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingPosts.map((post) => (
                  <div key={post.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(post.scheduledTime).toLocaleDateString()} at{' '}
                          {new Date(post.scheduledTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {post.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                      {post.content}
                    </p>
                    <div className="flex items-center space-x-1">
                      {post.platforms && post.platforms.map((platform, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            platform === 'Twitter' ? 'bg-blue-500' :
                            platform === 'LinkedIn' ? 'bg-blue-700' :
                            platform === 'Instagram' ? 'bg-pink-500' : 'bg-gray-500'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No upcoming posts scheduled
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {stats.overview && (stats.overview.failedPosts > 0 || stats.overview.processingPosts > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.overview && stats.overview.processingPosts > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Processing</p>
                    <p className="text-lg font-bold">{stats.overview.processingPosts}</p>
                  </div>
                </div>
              )}
              
              {stats.overview && stats.overview.failedPosts > 0 && (
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Failed</p>
                    <p className="text-lg font-bold">{stats.overview.failedPosts}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}