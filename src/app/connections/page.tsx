'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import withAuth from '@/components/layout/with-auth';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { ConnectionCard } from '@/components/social/connection-card';
import { ConnectPlatform } from '@/components/social/connect-platform';
import { RefreshCw, Twitter, Linkedin, Instagram, AlertCircle, CheckCircle, Users, HelpCircle } from 'lucide-react';
import { SocialAccount, SocialPlatform } from '@/lib/types';

function ConnectionsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Handle OAuth callback messages
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const platform = searchParams.get('platform');
    const username = searchParams.get('username');

    if (error) {
      toast({
        title: 'Connection Failed',
        description: error,
        variant: 'destructive'
      });
    } else if (success && platform) {
      toast({
        title: 'Connection Successful',
        description: `Successfully connected ${platform}${username ? ` (@${username})` : ''}`,
      });
      // Refresh accounts list
      fetchAccounts();
    }
  }, [searchParams, toast]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/social/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setAccounts(data.accounts);
      } else {
        throw new Error(data.error || 'Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Could not load connected accounts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAccounts();
  };

  const handleDisconnect = (accountId: string) => {
    setAccounts(accounts.filter(account => account.id !== accountId));
  };

  const handleVerify = () => {
    // Refresh accounts to get updated status
    fetchAccounts();
  };

  const getConnectedPlatforms = (): SocialPlatform[] => {
    return accounts.map(account => account.platform);
  };

  const getAvailablePlatforms = (): Array<{
    platform: SocialPlatform;
    description: string;
    icon: React.ReactNode;
  }> => {
    const connected = getConnectedPlatforms();
    const allPlatforms = [
      {
        platform: 'Twitter' as SocialPlatform,
        description: 'Share quick updates and engage with your audience',
        icon: <Twitter className="h-8 w-8 text-blue-500" />
      },
      {
        platform: 'LinkedIn' as SocialPlatform,
        description: 'Connect with professionals and share industry insights',
        icon: <Linkedin className="h-8 w-8 text-blue-700" />
      },
      {
        platform: 'Instagram' as SocialPlatform,
        description: 'Share visual content and stories with your followers',
        icon: <Instagram className="h-8 w-8 text-pink-500" />
      }
    ];

    return allPlatforms.filter(p => !connected.includes(p.platform));
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar className="h-full border-r">
            <SidebarNav />
          </Sidebar>
          <SidebarInset className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading connections...</p>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

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
                title="Social Media Connections"
                description="Connect your social media accounts to start scheduling and publishing posts across all platforms"
                showHomeButton={true}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    <Users className="h-3 w-3 mr-1" />
                    {accounts.length} Connected
                  </Badge>
                  <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    size="sm"
                  >
                    {isRefreshing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
              </PageHeader>

              {/* Connection Status Alert */}
              {accounts.length === 0 ? (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    No social media accounts connected yet. Connect at least one account to start using the platform.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {accounts.length} account{accounts.length > 1 ? 's' : ''} connected. 
                    You can now schedule and publish posts to your connected platforms.
                  </AlertDescription>
                </Alert>
              )}

              {/* Connected Accounts */}
              {accounts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Connected Accounts</h2>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {accounts.length} Active
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((account) => (
                      <ConnectionCard
                        key={account.id}
                        account={account}
                        onDisconnect={handleDisconnect}
                        onVerify={handleVerify}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Available Platforms */}
              {getAvailablePlatforms().length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {accounts.length > 0 ? 'Connect More Platforms' : 'Connect Your First Platform'}
                    </h2>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {getAvailablePlatforms().length} Available
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getAvailablePlatforms().map((platform) => (
                      <ConnectPlatform
                        key={platform.platform}
                        platform={platform.platform}
                        description={platform.description}
                        icon={platform.icon}
                        onConnect={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Help Section */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500 rounded-lg">
                      <HelpCircle className="h-4 w-4 text-white" />
                    </div>
                    Need Help?
                  </CardTitle>
                  <CardDescription>
                    Having trouble connecting your accounts? Here are some common solutions:
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">Make sure you're logged into the correct social media account</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">Check that you have the necessary permissions on your account</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">Try clearing your browser cache and cookies</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">Ensure pop-ups are enabled for this site</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground">For Instagram, make sure you're using a Business or Creator account</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default withAuth(ConnectionsPage);