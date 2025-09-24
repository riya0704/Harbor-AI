'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import withAuth from '@/components/layout/with-auth';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { PageHeader } from '@/components/layout/page-header';
import { Chatbot } from '@/components/ai/chatbot';
import { ContentGenerator } from '@/components/ai/content-generator';
import { AIQuickActions } from '@/components/ai/ai-quick-actions';
import { AIInsights } from '@/components/ai/ai-insights';
import { SchedulePostDialog } from '@/components/calendar/schedule-post-dialog';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Bot, Wand2, MessageSquare, Sparkles, Calendar, CheckCircle, RefreshCw, Brain } from 'lucide-react';

function AIAssistantPage() {
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

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Refreshed',
      description: 'AI insights have been updated.',
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
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Page Header */}
              <PageHeader
                title="AI Assistant"
                description="Get personalized help with your social media content. Set up your business context and generate engaging content tailored to your brand."
                showHomeButton={true}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Powered
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </PageHeader>

              {/* Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Business Context</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {businessContext ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600 font-medium">Complete</span>
                            </>
                          ) : (
                            <>
                              <div className="h-4 w-4 border-2 border-orange-400 rounded-full animate-pulse"></div>
                              <span className="text-sm text-orange-600 font-medium">Setup Required</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                        <Wand2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Content Generation</p>
                        <p className="text-sm mt-1 font-medium">
                          {businessContext ? (
                            <span className="text-green-600">Ready to Generate</span>
                          ) : (
                            <span className="text-orange-600">Setup Required</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Scheduling</p>
                        <p className="text-sm text-green-600 font-medium mt-1">Always Available</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Interface */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="xl:col-span-3">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="overflow-x-auto">
                      <TabsList className="grid w-full grid-cols-2 min-w-[400px] lg:w-auto">
                        <TabsTrigger value="chat" className="flex items-center space-x-2 px-4 py-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="hidden sm:inline">Business Setup</span>
                          <span className="sm:hidden">Setup</span>
                          {businessContext && (
                            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
                              ✓
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="generate" className="flex items-center space-x-2 px-4 py-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">Content Generator</span>
                          <span className="sm:hidden">Generate</span>
                          {!businessContext && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Required
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="chat" className="space-y-6 mt-6">
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                          <CardTitle className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            Business Context Setup
                            <Badge variant="outline" className="ml-auto">Interactive</Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-2">
                            Chat with our AI to provide information about your business. This helps generate more personalized and relevant content.
                          </p>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Chatbot onContextComplete={handleContextComplete} />
                        </CardContent>
                      </Card>

                      {businessContext && (
                        <Card className="border-0 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                            <CardTitle className="flex items-center gap-2">
                              <div className="p-2 bg-green-500 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                              Your Business Profile
                              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">Complete</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {businessContext.businessName && (
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-semibold text-muted-foreground">Business Name</span>
                                  <p className="text-sm font-medium mt-1">{businessContext.businessName}</p>
                                </div>
                              )}
                              {businessContext.industry && (
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-semibold text-muted-foreground">Industry</span>
                                  <p className="text-sm font-medium mt-1">{businessContext.industry}</p>
                                </div>
                              )}
                              {businessContext.targetAudience && (
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-semibold text-muted-foreground">Target Audience</span>
                                  <p className="text-sm font-medium mt-1">{businessContext.targetAudience}</p>
                                </div>
                              )}
                              {businessContext.brandVoice && (
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <span className="text-sm font-semibold text-muted-foreground">Brand Voice</span>
                                  <p className="text-sm font-medium mt-1">{businessContext.brandVoice}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="pt-4 border-t">
                              <Button 
                                onClick={() => setActiveTab('generate')}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                size="lg"
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Start Generating Content
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="generate" className="space-y-6 mt-6">
                      {!businessContext ? (
                        <Card className="border-0 shadow-lg">
                          <CardContent className="p-12 text-center">
                            <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full w-20 h-20 mx-auto mb-6">
                              <Bot className="h-12 w-12 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Business Context Required</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                              To generate personalized content that matches your brand voice and audience, please complete the business setup first.
                            </p>
                            <Button 
                              onClick={() => setActiveTab('chat')}
                              size="lg"
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Complete Business Setup
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-0 shadow-lg">
                          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                            <CardTitle className="flex items-center gap-2">
                              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                <Wand2 className="h-4 w-4 text-white" />
                              </div>
                              Content Generator
                              <Badge variant="outline" className="ml-auto">Advanced AI</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <ContentGenerator
                              onContentGenerated={handleContentGenerated}
                              onScheduleContent={handleScheduleContent}
                            />
                          </CardContent>
                        </Card>
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
                  
                  {/* AI Tips Card */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-indigo-500 rounded-md">
                          <Brain className="h-3 w-3 text-white" />
                        </div>
                        AI Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <p className="text-muted-foreground">Complete business setup for personalized content</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <p className="text-muted-foreground">Use specific prompts for better results</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <p className="text-muted-foreground">Review and edit generated content</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
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
    </SidebarProvider>
  );
}

export default withAuth(AIAssistantPage);