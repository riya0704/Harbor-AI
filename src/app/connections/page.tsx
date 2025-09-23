'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ConnectionCard } from '@/components/social/connection-card';
import { ConnectPlatform } from '@/components/social/connect-platform';
import { RefreshCw, Twitter, Linkedin, Instagram, AlertCircle, CheckCircle } from 'lucide-react';
import { SocialAccount, SocialPlatform } from '@/lib/types';

export default function ConnectionsPage() {
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Connections</h1>
          <p className="text-muted-foreground mt-2">
            Connect your social media accounts to start scheduling and publishing posts
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
        >
          {isRefreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Connection Status Alert */}
      {accounts.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No social media accounts connected yet. Connect at least one account to start using the platform.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {accounts.length} account{accounts.length > 1 ? 's' : ''} connected. 
            You can now schedule and publish posts to your connected platforms.
          </AlertDescription>
        </Alert>
      )}

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {accounts.length > 0 ? 'Connect More Platforms' : 'Connect Your First Platform'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Having trouble connecting your accounts? Here are some common solutions:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Make sure you're logged into the correct social media account</li>
            <li>Check that you have the necessary permissions on your account</li>
            <li>Try clearing your browser cache and cookies</li>
            <li>Ensure pop-ups are enabled for this site</li>
            <li>For Instagram, make sure you're using a Business or Creator account</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}