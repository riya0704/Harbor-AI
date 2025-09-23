'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Calendar, 
  Bot, 
  Users, 
  BarChart3, 
  Settings,
  Zap,
  MessageSquare
} from 'lucide-react';

export function QuickActions() {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Schedule Post',
      description: 'Create and schedule a new post',
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: () => router.push('/calendar')
    },
    {
      title: 'AI Assistant',
      description: 'Generate content with AI',
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: () => router.push('/ai-assistant')
    },
    {
      title: 'View Calendar',
      description: 'Manage scheduled posts',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: () => router.push('/calendar')
    },
    {
      title: 'Connect Accounts',
      description: 'Add social media accounts',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      action: () => router.push('/connections')
    }
  ];

  const secondaryActions = [
    {
      title: 'Analytics',
      icon: BarChart3,
      action: () => router.push('/dashboard?tab=analytics')
    },
    {
      title: 'Settings',
      icon: Settings,
      action: () => router.push('/settings')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start h-auto p-3"
              onClick={action.action}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Secondary Actions */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-2">
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={action.action}
              >
                <action.icon className="h-4 w-4" />
                <span>{action.title}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* AI Quick Generate */}
        <div className="pt-4 border-t">
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">AI Quick Generate</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Generate content instantly with AI templates
            </p>
            <Button size="sm" className="w-full" onClick={() => router.push('/ai-assistant')}>
              Try AI Generator
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Quick Tips</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
              <span>Schedule posts during peak engagement hours</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5"></div>
              <span>Use AI to generate platform-specific content</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
              <span>Connect multiple accounts for wider reach</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}