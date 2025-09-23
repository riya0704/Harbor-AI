'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { SocialAccount } from '@/lib/types';

interface ConnectionCardProps {
  account: SocialAccount;
  onDisconnect: (accountId: string) => void;
  onVerify: (accountId: string) => void;
}

export function ConnectionCard({ account, onDisconnect, onVerify }: ConnectionCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const { toast } = useToast();

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/social/accounts/${account.id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus(data.connected ? 'connected' : 'disconnected');
        toast({
          title: data.connected ? 'Connection Verified' : 'Connection Failed',
          description: data.connected 
            ? 'Your account is properly connected' 
            : 'Please reconnect your account',
          variant: data.connected ? 'default' : 'destructive'
        });
        onVerify(account.id);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setConnectionStatus('disconnected');
      toast({
        title: 'Verification Failed',
        description: 'Could not verify account connection',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch(`/api/social/accounts/${account.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Account Disconnected',
          description: `${account.platform} account has been disconnected`,
        });
        onDisconnect(account.id);
      } else {
        throw new Error(data.error || 'Disconnection failed');
      }
    } catch (error) {
      console.error('Disconnection error:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Could not disconnect account',
        variant: 'destructive'
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Twitter':
        return 'bg-blue-500';
      case 'LinkedIn':
        return 'bg-blue-700';
      case 'Instagram':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getPlatformColor(account.platform)}`} />
            <span>{account.platform}</span>
            {getStatusIcon()}
          </div>
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          Connected
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={account.avatarUrl} alt={account.username} />
            <AvatarFallback>
              {account.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{account.username}</p>
            <p className="text-xs text-muted-foreground">@{account.username}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex-1"
          >
            {isVerifying ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isDisconnecting}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to disconnect your {account.platform} account (@{account.username})? 
                  This will remove access to post on this platform and you'll need to reconnect it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnect}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}