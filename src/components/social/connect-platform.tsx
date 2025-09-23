'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Loader2 } from 'lucide-react';
import { SocialPlatform } from '@/lib/types';

interface ConnectPlatformProps {
  platform: SocialPlatform;
  description: string;
  icon: React.ReactNode;
  onConnect: () => void;
}

export function ConnectPlatform({ platform, description, icon, onConnect }: ConnectPlatformProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/social/oauth/${platform}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to OAuth URL
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to initiate connection');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: `Could not connect to ${platform}. Please try again.`,
        variant: 'destructive'
      });
      setIsConnecting(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Twitter':
        return 'border-blue-500 hover:bg-blue-50';
      case 'LinkedIn':
        return 'border-blue-700 hover:bg-blue-50';
      case 'Instagram':
        return 'border-pink-500 hover:bg-pink-50';
      default:
        return 'border-gray-500 hover:bg-gray-50';
    }
  };

  return (
    <Card className={`w-full transition-colors ${getPlatformColor(platform)}`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-lg">{platform}</CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full"
          variant="outline"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect {platform}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}