'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Brain, MessageSquare, Wand2, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface AIInsightsProps {
  refreshTrigger?: number;
}

interface AIStats {
  hasBusinessContext: boolean;
  activeChatSessions: number;
  totalChatSessions: number;
  totalMessages: number;
}

export function AIInsights({ refreshTrigger }: AIInsightsProps) {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ai/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch AI statistics');
      }
    } catch (error) {
      console.error('Error fetching AI stats:', error);
      toast({
        title: 'Error',
        description: 'Could not load AI insights',
        variant: 'destructive'
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const contextCompletionPercentage = stats.hasBusinessContext ? 100 : 0;
  const engagementLevel = stats.totalMessages > 10 ? 'High' : stats.totalMessages > 5 ? 'Medium' : 'Low';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Context Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Business Context Setup</span>
            <Badge variant={stats.hasBusinessContext ? 'default' : 'secondary'} className={
              stats.hasBusinessContext ? 'bg-green-100 text-green-800' : ''
            }>
              {stats.hasBusinessContext ? 'Complete' : 'Pending'}
            </Badge>
          </div>
          <Progress value={contextCompletionPercentage} className="h-2" />
          <p className="text-xs text-gray-500">
            {stats.hasBusinessContext 
              ? 'Your business context is set up and ready for personalized content generation.'
              : 'Complete your business setup to unlock personalized AI content generation.'
            }
          </p>
        </div>

        {/* Chat Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
            Chat Activity
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalChatSessions}</div>
              <div className="text-xs text-blue-600">Total Sessions</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalMessages}</div>
              <div className="text-xs text-green-600">Messages Sent</div>
            </div>
          </div>

          {stats.activeChatSessions > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>{stats.activeChatSessions} active session{stats.activeChatSessions > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Engagement Level */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
            Engagement Level
          </h4>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">AI Interaction</span>
            <Badge variant="outline" className={
              engagementLevel === 'High' ? 'border-green-500 text-green-700' :
              engagementLevel === 'Medium' ? 'border-yellow-500 text-yellow-700' :
              'border-gray-500 text-gray-700'
            }>
              {engagementLevel}
            </Badge>
          </div>

          <div className="text-xs text-gray-500">
            {engagementLevel === 'High' && 'Great! You\'re actively using AI features.'}
            {engagementLevel === 'Medium' && 'Good engagement with AI features.'}
            {engagementLevel === 'Low' && 'Try exploring more AI features for better results.'}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium">AI Tips</h4>
          <div className="space-y-2">
            {!stats.hasBusinessContext && (
              <div className="flex items-start space-x-2 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <span>Complete your business setup for personalized content</span>
              </div>
            )}
            
            {stats.totalMessages < 5 && (
              <div className="flex items-start space-x-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Chat more with the AI to improve content quality</span>
              </div>
            )}
            
            <div className="flex items-start space-x-2 text-xs">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
              <span>Use specific prompts for better content generation</span>
            </div>
            
            <div className="flex items-start space-x-2 text-xs">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
              <span>Try different content types (text, image, video)</span>
            </div>
          </div>
        </div>

        {/* Success Indicators */}
        {stats.hasBusinessContext && stats.totalMessages > 5 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-800">AI Setup Complete!</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              You're all set to generate high-quality, personalized content.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}