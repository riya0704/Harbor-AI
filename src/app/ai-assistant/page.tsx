'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chatbot } from '@/components/ai/chatbot';
import { ContentGenerator } from '@/components/ai/content-generator';
import { AIQuickActions } from '@/components/ai/ai-quick-actions';
import { AIInsights } from '@/components/ai/ai-insights';
import { SchedulePostDialog } from '@/components/calendar/schedule-post-dialog';
import { useToast } from '@/hooks/use-toast';
import { Bot, Wand2, MessageSquare, Sparkles, Calendar, CheckCircle } from 'lucide-react';

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [businessContext, setBusinessContext] = useState<any>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [contentToSchedule, setContentToSchedule] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const handleContextComplete = (context: any) => {
    setBusinessContext(context);
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Business Context Complete!',
      description: 'You can now generate personalized content. Switch to the Content Generator tab.',
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
    toast({
      title: 'Content Scheduled!',
      description: 'Your AI-generated content has been scheduled successfully.',
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center">
          <Bot className="h-8 w-8 mr-3 text-blue-500" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get personalized help with your social media content. Start by chatting with our AI to set up your business context, 
          then generate engaging content tailored to your brand.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Business Context</p>
                <div className="flex items-center space-x-2">
                  {businessContext ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Complete</span>
                    </>
                  ) : (
                    <>
                      <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-500">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wand2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Content Generation</p>
                <p className="text-sm text-gray-500">
                  {businessContext ? 'Ready' : 'Setup required'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Scheduling</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Business Setup</span>
                {businessContext && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Content Generator</span>
                {!businessContext && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Setup Required
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2 text-blue-500" />
                Business Context Setup
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Chat with our AI to provide information about your business. This helps generate more personalized and relevant content.
              </p>
            </CardHeader>
            <CardContent>
              <Chatbot onContextComplete={handleContextComplete} />
            </CardContent>
          </Card>

          {businessContext && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Business Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {businessContext.businessName && (
                  <div>
                    <span className="text-sm font-medium">Business Name: </span>
                    <span className="text-sm">{businessContext.businessName}</span>
                  </div>
                )}
                {businessContext.industry && (
                  <div>
                    <span className="text-sm font-medium">Industry: </span>
                    <span className="text-sm">{businessContext.industry}</span>
                  </div>
                )}
                {businessContext.targetAudience && (
                  <div>
                    <span className="text-sm font-medium">Target Audience: </span>
                    <span className="text-sm">{businessContext.targetAudience}</span>
                  </div>
                )}
                {businessContext.brandVoice && (
                  <div>
                    <span className="text-sm font-medium">Brand Voice: </span>
                    <span className="text-sm">{businessContext.brandVoice}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <Button 
                    onClick={() => setActiveTab('generate')}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Generating Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          {!businessContext ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Business Context Required</h3>
                <p className="text-muted-foreground mb-4">
                  To generate personalized content, please complete the business setup first.
                </p>
                <Button onClick={() => setActiveTab('chat')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Complete Business Setup
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ContentGenerator
              onContentGenerated={handleContentGenerated}
              onScheduleContent={handleScheduleContent}
            />
          )}
        </TabsContent>
      </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AIInsights refreshTrigger={refreshTrigger} />
          <AIQuickActions
            onContentGenerated={handleContentGenerated}
            onScheduleContent={handleScheduleContent}
          />
        </div>
      </div>

      {/* Schedule Content Dialog */}
      {showScheduleDialog && contentToSchedule && (
        <SchedulePostDialog
          isOpen={showScheduleDialog}
          onClose={() => setShowScheduleDialog(false)}
          defaultDate={new Date()}
          onScheduled={handleContentScheduled}
          // Pre-fill with generated content
          defaultContent={{
            content: contentToSchedule.content,
            image: contentToSchedule.image,
            video: contentToSchedule.video,
            platforms: [contentToSchedule.platform],
            type: contentToSchedule.type === 'text' ? 'dynamic' : 'static'
          }}
        />
      )}
    </div>
  );
}