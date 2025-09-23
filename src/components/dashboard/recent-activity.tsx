'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
    refreshTrigger?: number;
}

interface ActivityItem {
    id: string;
    type: 'scheduled' | 'published' | 'failed' | 'cancelled' | 'pending';
    content: string;
    platforms: string[];
    timestamp: string;
    scheduledTime?: string;
    error?: string;
}

export function RecentActivity({ refreshTrigger }: RecentActivityProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchRecentActivity = async () => {
        try {
            const response = await fetch('/api/posts/scheduled?limit=10', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Transform scheduled posts into activity items
                const activityItems: ActivityItem[] = data.scheduledPosts.map((post: any) => ({
                    id: post.id,
                    type: post.status,
                    content: post.post?.content || 'No content available',
                    platforms: post.platforms,
                    timestamp: post.createdAt,
                    scheduledTime: post.scheduledTime,
                    error: post.publishResults?.find((r: any) => !r.success)?.error
                }));

                setActivities(activityItems);
            } else {
                throw new Error(data.error || 'Failed to fetch recent activity');
            }
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            toast({
                title: 'Error',
                description: 'Could not load recent activity',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentActivity();
    }, [refreshTrigger]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'scheduled':
            case 'pending':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'published':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'cancelled':
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getActivityBadge = (type: string) => {
        switch (type) {
            case 'scheduled':
            case 'pending':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
            case 'published':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Published</Badge>;
            case 'failed':
                return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
            case 'cancelled':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    const getActivityDescription = (activity: ActivityItem) => {
        switch (activity.type) {
            case 'scheduled':
            case 'pending':
                return `Scheduled for ${activity.scheduledTime ? new Date(activity.scheduledTime).toLocaleDateString() : 'unknown date'}`;
            case 'published':
                return 'Successfully published to all platforms';
            case 'failed':
                return activity.error || 'Failed to publish';
            case 'cancelled':
                return 'Post was cancelled';
            default:
                return 'Unknown status';
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                {activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-b-0 last:pb-0">
                                <div className="flex-shrink-0 mt-1">
                                    {getActivityIcon(activity.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        {getActivityBadge(activity.type)}
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                        {activity.content}
                                    </p>

                                    <p className="text-xs text-muted-foreground mb-2">
                                        {getActivityDescription(activity)}
                                    </p>

                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-1">
                                            {activity.platforms.map((platform, index) => (
                                                <div
                                                    key={index}
                                                    className={`w-2 h-2 rounded-full ${platform === 'Twitter' ? 'bg-blue-500' :
                                                        platform === 'LinkedIn' ? 'bg-blue-700' :
                                                            platform === 'Instagram' ? 'bg-pink-500' : 'bg-gray-500'
                                                        }`}
                                                ></div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {activity.platforms.join(', ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Calendar className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 mb-1">No recent activity</p>
                        <p className="text-xs text-gray-500">
                            Your recent posts and scheduling activity will appear here
                        </p>
                    </div>
                )}

                {activities.length > 0 && (
                    <div className="pt-4 border-t">
                        <Button variant="outline" size="sm" className="w-full">
                            View All Activity
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}