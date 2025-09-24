'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckCircle, AlertCircle, Twitter, Linkedin, Instagram, ExternalLink } from 'lucide-react';
import { SocialAccount } from '@/lib/types';

interface SocialAccountsWidgetProps {
  refreshTrigger?: number;
  detailed?: boolean;
}

export function SocialAccountsWidget({ refreshTrigger, detailed = false }: SocialAccountsWidgetProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
        description: 'Could not load social accounts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [refreshTrigger]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Twitter':
        return <Twitter className="h-4 w-4 text-blue-500" />;
      case 'LinkedIn':
        return <Linkedin className="h-4 w-4 text-blue-700" />;
      case 'Instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Twitter':
        return 'border-blue-500';
      case 'LinkedIn':
        return 'border-blue-700';
      case 'Instagram':
        return 'border-pink-500';
      default:
        return 'border-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
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
        <CardTitle className="text-lg">Connected Accounts</CardTitle>
        <Badge variant="secondary">{accounts.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg ${getPlatformColor(account.platform)}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={account.avatarUrl} alt={account.username} />
                  <AvatarFallback>
                    {account.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(account.platform)}
                    <p className="text-sm font-medium truncate">{account.username}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{account.platform}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {detailed && (
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No accounts connected</p>
            <p className="text-xs text-gray-500 mb-4">
              Connect your social media accounts to start scheduling posts
            </p>
          </div>
        )}

        {/* Available Platforms */}
        {!detailed && accounts.length < 3 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">Available platforms:</p>
            <div className="flex space-x-2">
              {['Twitter', 'LinkedIn', 'Instagram'].map(platform => {
                const isConnected = accounts.some(acc => acc.platform === platform);
                return (
                  <div
                    key={platform}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      isConnected 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {getPlatformIcon(platform)}
                    <span>{platform}</span>
                    {isConnected && <CheckCircle className="h-3 w-3" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Connect Button */}
        <Button 
          variant={accounts.length === 0 ? 'default' : 'outline'} 
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          {accounts.length === 0 ? 'Connect First Account' : 'Connect More Accounts'}
        </Button>

        {/* Detailed View Additional Info */}
        {detailed && accounts.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <div className="text-xs text-muted-foreground">
              <p>• All accounts are verified and ready for posting</p>
              <p>• Tokens are automatically refreshed when needed</p>
              <p>• You can disconnect accounts anytime from settings</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-blue-50 rounded">
                <p className="font-medium text-blue-900">Total Platforms</p>
                <p className="text-blue-700">{accounts.length}/3</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="font-medium text-green-900">Status</p>
                <p className="text-green-700">All Active</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}