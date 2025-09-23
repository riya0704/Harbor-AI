'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Zap, Wand2, RefreshCw, Copy, Calendar } from 'lucide-react';
import { SocialPlatform } from '@/lib/types';

interface AIQuickActionsProps {
  onContentGenerated?: (content: any) => void;
  onScheduleContent?: (content: any) => void;
}

export function AIQuickActions({ onContentGenerated, onScheduleContent }: AIQuickActionsProps) {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('Twitter');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const { toast } = useToast();

  // Quick content generation templates
  const quickTemplates = [
    {
      label: 'Industry Insight',
      prompt: 'Share an interesting industry insight or trend',
      platforms: ['LinkedIn', 'Twitter']
    },
    {
      label: 'Behind the Scenes',
      prompt: 'Show behind the scenes of our work process',
      platforms: ['Instagram', 'LinkedIn']
    },
    {
      label: 'Tips & Advice',
      prompt: 'Share helpful tips related to our industry',
      platforms: ['Twitter', 'LinkedIn']
    },
    {
      label: 'Company Update',
      prompt: 'Share an exciting company update or milestone',
      platforms: ['LinkedIn', 'Twitter', 'Instagram']
    },
    {
      label: 'Question/Poll',
      prompt: 'Ask an engaging question to spark discussion',
      platforms: ['Twitter', 'LinkedIn']
    },
    {
      label: 'Motivational',
      prompt: 'Share an inspiring or motivational message',
      platforms: ['Instagram', 'LinkedIn']
    }
  ];

  const generateQuickContent = async (template?: { prompt: string; platforms: string[] }) => {
    const prompt = template?.prompt || quickPrompt;
    const platform = template?.platforms?.[0] || selectedPlatform;

    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a content prompt or select a template',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Use the complete workflow API for quick generation
      const response = await fetch('/api/ai/workflow', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'complete_workflow',
          workflowPlatform: platform,
          workflowContentGoal: prompt,
          workflowContentType: 'text',
          workflowPersonaTraits: 'engaging, professional'
        })
      });

      const data = await response.json();

      if (response.ok) {
        const content = data.content.text || data.content.imageCaption || data.content.videoCaption;
        setGeneratedContent(content);
        
        if (onContentGenerated) {
          onContentGenerated({
            content,
            platform,
            suggestion: data.suggestion
          });
        }

        toast({
          title: 'Content Generated!',
          description: 'Your quick content is ready',
        });
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating quick content:', error);
      toast({
        title: 'Error',
        description: 'Could not generate content',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard',
      });
    }
  };

  const handleScheduleContent = () => {
    if (generatedContent && onScheduleContent) {
      onScheduleContent({
        content: generatedContent,
        platform: selectedPlatform,
        type: 'dynamic'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-500" />
          Quick AI Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Templates */}
        <div className="space-y-2">
          <Label>Quick Templates</Label>
          <div className="grid grid-cols-2 gap-2">
            {quickTemplates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => generateQuickContent(template)}
                disabled={isGenerating}
                className="text-left justify-start h-auto p-2"
              >
                <div>
                  <div className="font-medium text-xs">{template.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.platforms.slice(0, 2).join(', ')}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-3 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="quickPrompt">Custom Prompt</Label>
            <Input
              id="quickPrompt"
              placeholder="e.g., Share a productivity tip for remote workers"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={selectedPlatform} onValueChange={(value: SocialPlatform) => setSelectedPlatform(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Twitter">Twitter</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => generateQuickContent()}
            disabled={isGenerating || !quickPrompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div className="space-y-3 pt-4 border-t">
            <Label>Generated Content</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
            </div>
            <div className="text-xs text-gray-500">
              {generatedContent.length} characters • {selectedPlatform}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button size="sm" onClick={handleScheduleContent} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Post
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}