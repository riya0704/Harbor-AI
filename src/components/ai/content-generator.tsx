'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Wand2, RefreshCw, Copy, Download, Twitter, Linkedin, Instagram, Lightbulb, Sparkles } from 'lucide-react';
import { SocialPlatform } from '@/lib/types';

interface ContentGeneratorProps {
  onContentGenerated?: (content: any) => void;
  onScheduleContent?: (content: any) => void;
}

interface GeneratedContent {
  text?: string;
  imageCaption?: string;
  imagePrompt?: string;
  imageUrl?: string;
  videoCaption?: string;
  videoUrl?: string;
}

export function ContentGenerator({ onContentGenerated, onScheduleContent }: ContentGeneratorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('Twitter');
  const [contentGoal, setContentGoal] = useState('');
  const [personaTraits, setPersonaTraits] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [contentType, setContentType] = useState<'text' | 'image' | 'video'>('text');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const { toast } = useToast();

  // Generate content suggestions
  const generateSuggestions = async () => {
    if (!contentGoal.trim()) {
      toast({
        title: 'Content Goal Required',
        description: 'Please describe what you want to achieve with your content',
        variant: 'destructive'
      });
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/content/suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          socialMediaPlatform: selectedPlatform,
          contentGoal: contentGoal.trim(),
          personaTraits: personaTraits.trim() || 'professional, engaging'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuggestions(data.suggestions);
        if (data.suggestions.length > 0) {
          setSelectedSuggestion(data.suggestions[0]);
        }
      } else {
        throw new Error(data.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Error',
        description: 'Could not generate content suggestions',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Generate content from selected suggestion
  const generateContent = async () => {
    if (!selectedSuggestion.trim()) {
      toast({
        title: 'Suggestion Required',
        description: 'Please select a content suggestion first',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingContent(true);
    try {
      const response = await fetch('/api/ai/content/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suggestion: selectedSuggestion,
          contentType,
          useBusinessContext: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedContent(data.content);
        if (onContentGenerated) {
          onContentGenerated(data.content);
        }
        toast({
          title: 'Content Generated!',
          description: 'Your content has been generated successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Error',
        description: 'Could not generate content',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Refine generated content
  const refineContent = async () => {
    if (!generatedContent?.text || !refinementFeedback.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please provide feedback on how to improve the content',
        variant: 'destructive'
      });
      return;
    }

    setIsRefining(true);
    try {
      const response = await fetch('/api/ai/content/refine', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalContent: generatedContent.text,
          feedback: refinementFeedback.trim(),
          useBusinessContext: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedContent(prev => ({
          ...prev!,
          text: data.refinedContent
        }));
        setRefinementFeedback('');
        toast({
          title: 'Content Refined!',
          description: 'Your content has been improved based on your feedback',
        });
      } else {
        throw new Error(data.error || 'Failed to refine content');
      }
    } catch (error) {
      console.error('Error refining content:', error);
      toast({
        title: 'Error',
        description: 'Could not refine content',
        variant: 'destructive'
      });
    } finally {
      setIsRefining(false);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard',
    });
  };

  // Handle schedule content
  const handleScheduleContent = () => {
    if (generatedContent && onScheduleContent) {
      onScheduleContent({
        content: generatedContent.text || generatedContent.imageCaption || generatedContent.videoCaption,
        image: generatedContent.imageUrl,
        video: generatedContent.videoUrl,
        platform: selectedPlatform,
        type: contentType
      });
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'Twitter':
        return <Twitter className="h-4 w-4 text-blue-500" />;
      case 'LinkedIn':
        return <Linkedin className="h-4 w-4 text-blue-700" />;
      case 'Instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
            AI Content Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Target Platform</Label>
            <div className="flex space-x-2">
              {(['Twitter', 'LinkedIn', 'Instagram'] as SocialPlatform[]).map(platform => (
                <Button
                  key={platform}
                  variant={selectedPlatform === platform ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform)}
                  className="flex items-center space-x-2"
                >
                  {getPlatformIcon(platform)}
                  <span>{platform}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Content Goal */}
          <div className="space-y-2">
            <Label htmlFor="contentGoal">Content Goal *</Label>
            <Input
              id="contentGoal"
              placeholder="e.g., increase engagement, promote new product, share industry insights"
              value={contentGoal}
              onChange={(e) => setContentGoal(e.target.value)}
            />
          </div>

          {/* Persona Traits */}
          <div className="space-y-2">
            <Label htmlFor="personaTraits">Persona Traits</Label>
            <Input
              id="personaTraits"
              placeholder="e.g., professional, friendly, humorous, technical"
              value={personaTraits}
              onChange={(e) => setPersonaTraits(e.target.value)}
            />
          </div>

          {/* Generate Suggestions Button */}
          <Button 
            onClick={generateSuggestions} 
            disabled={isLoadingSuggestions || !contentGoal.trim()}
            className="w-full"
          >
            {isLoadingSuggestions ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Content Ideas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Content Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Content Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSuggestion === suggestion 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSuggestion(suggestion)}
              >
                <p className="text-sm">{suggestion}</p>
              </div>
            ))}

            {selectedSuggestion && (
              <div className="pt-4 border-t space-y-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={contentType} onValueChange={(value: 'text' | 'image' | 'video') => setContentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Post</SelectItem>
                      <SelectItem value="image">Image + Caption</SelectItem>
                      <SelectItem value="video">Video + Caption</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateContent} 
                  disabled={isGeneratingContent}
                  className="w-full"
                >
                  {isGeneratingContent ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Content */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="refine">Refine</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                {/* Text Content */}
                {generatedContent.text && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Text Content</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.text!)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{generatedContent.text}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {generatedContent.text.length} characters
                    </div>
                  </div>
                )}

                {/* Image Content */}
                {generatedContent.imageCaption && (
                  <div className="space-y-2">
                    <Label>Image Caption</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{generatedContent.imageCaption}</p>
                    </div>
                    {generatedContent.imagePrompt && (
                      <div className="space-y-1">
                        <Label className="text-xs">Image Prompt</Label>
                        <div className="p-2 bg-blue-50 rounded text-xs text-blue-800">
                          {generatedContent.imagePrompt}
                        </div>
                      </div>
                    )}
                    {generatedContent.imageUrl && (
                      <div className="space-y-1">
                        <Label className="text-xs">Generated Image</Label>
                        <img 
                          src={generatedContent.imageUrl} 
                          alt="Generated content" 
                          className="w-full max-w-sm rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Video Content */}
                {generatedContent.videoCaption && (
                  <div className="space-y-2">
                    <Label>Video Caption</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{generatedContent.videoCaption}</p>
                    </div>
                    {generatedContent.videoUrl && (
                      <div className="space-y-1">
                        <Label className="text-xs">Video Preview</Label>
                        <video 
                          src={generatedContent.videoUrl} 
                          controls 
                          className="w-full max-w-sm rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Button onClick={handleScheduleContent} className="flex-1">
                    Schedule Post
                  </Button>
                  <Button variant="outline" onClick={generateContent}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="refine" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback">How would you like to improve this content?</Label>
                  <Textarea
                    id="feedback"
                    placeholder="e.g., make it more casual, add a call to action, include hashtags"
                    value={refinementFeedback}
                    onChange={(e) => setRefinementFeedback(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={refineContent} 
                  disabled={isRefining || !refinementFeedback.trim()}
                  className="w-full"
                >
                  {isRefining ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Refining Content...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Refine Content
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}