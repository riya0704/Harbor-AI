'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Twitter, Linkedin, Instagram, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { SocialPlatform } from '@/lib/types';

interface SchedulePostDialogProps {
    isOpen: boolean;
    onClose: () => void;
    defaultDate?: Date | null;
    onScheduled?: () => void;
    defaultContent?: {
        content?: string;
        image?: string;
        video?: string;
        platforms?: SocialPlatform[];
        type?: 'dynamic' | 'static';
    };
}

interface PlatformGuidelines {
    maxTextLength: number;
    supportsImages: boolean;
    supportsVideos: boolean;
    requiresMedia: boolean;
    bestPractices: string[];
}

export function SchedulePostDialog({ isOpen, onClose, defaultDate, onScheduled, defaultContent }: SchedulePostDialogProps) {
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [video, setVideo] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['Twitter']);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [postType, setPostType] = useState<'dynamic' | 'static'>('dynamic');
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
    const { toast } = useToast();

    // Platform guidelines
    const platformGuidelines: Record<SocialPlatform, PlatformGuidelines> = {
        Twitter: {
            maxTextLength: 280,
            supportsImages: true,
            supportsVideos: true,
            requiresMedia: false,
            bestPractices: [
                'Keep tweets concise and engaging',
                'Use hashtags strategically (1-2 per tweet)',
                'Include calls to action'
            ]
        },
        LinkedIn: {
            maxTextLength: 3000,
            supportsImages: true,
            supportsVideos: true,
            requiresMedia: false,
            bestPractices: [
                'Share professional insights',
                'Use industry-relevant hashtags',
                'Engage with comments promptly'
            ]
        },
        Instagram: {
            maxTextLength: 2200,
            supportsImages: true,
            supportsVideos: true,
            requiresMedia: true,
            bestPractices: [
                'Use high-quality, visually appealing images',
                'Write engaging captions with storytelling',
                'Use relevant hashtags (5-10 per post)'
            ]
        }
    };

    // Initialize form with default date and content
    useEffect(() => {
        if (defaultDate) {
            setScheduledDate(format(defaultDate, 'yyyy-MM-dd'));
            setScheduledTime(format(defaultDate, 'HH:mm'));
        } else {
            const now = new Date();
            now.setHours(now.getHours() + 1); // Default to 1 hour from now
            setScheduledDate(format(now, 'yyyy-MM-dd'));
            setScheduledTime(format(now, 'HH:mm'));
        }

        // Set default content if provided
        if (defaultContent && isOpen) {
            if (defaultContent.content) setContent(defaultContent.content);
            if (defaultContent.image) setImage(defaultContent.image);
            if (defaultContent.video) setVideo(defaultContent.video);
            if (defaultContent.platforms) setSelectedPlatforms(defaultContent.platforms);
            if (defaultContent.type) setPostType(defaultContent.type);
        }
    }, [defaultDate, defaultContent, isOpen]);

    // Validate content
    useEffect(() => {
        const errors: string[] = [];
        const warnings: string[] = [];

        selectedPlatforms.forEach(platform => {
            const guidelines = platformGuidelines[platform];

            // Check text length
            if (content.length > guidelines.maxTextLength) {
                errors.push(`${platform}: Text exceeds ${guidelines.maxTextLength} character limit (${content.length} characters)`);
            }

            // Check media requirements
            if (guidelines.requiresMedia && !image && !video) {
                errors.push(`${platform}: Requires either an image or video`);
            }

            // Check media support
            if (image && !guidelines.supportsImages) {
                errors.push(`${platform}: Does not support images`);
            }

            if (video && !guidelines.supportsVideos) {
                errors.push(`${platform}: Does not support videos`);
            }

            // Warnings for optimal length
            if (platform === 'Twitter' && content.length > 240) {
                warnings.push(`${platform}: Consider shortening text for better engagement`);
            }

            if (platform === 'LinkedIn' && content.length > 1300) {
                warnings.push(`${platform}: Posts over 1300 characters may be truncated in feed`);
            }
        });

        setValidationErrors(errors);
        setValidationWarnings(warnings);
    }, [content, image, video, selectedPlatforms]);

    const handlePlatformToggle = (platform: SocialPlatform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handleSchedule = async () => {
        if (!content.trim()) {
            toast({
                title: 'Content Required',
                description: 'Please enter content for your post',
                variant: 'destructive'
            });
            return;
        }

        if (selectedPlatforms.length === 0) {
            toast({
                title: 'Platform Required',
                description: 'Please select at least one platform',
                variant: 'destructive'
            });
            return;
        }

        if (validationErrors.length > 0) {
            toast({
                title: 'Validation Errors',
                description: 'Please fix the validation errors before scheduling',
                variant: 'destructive'
            });
            return;
        }

        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledDateTime <= new Date()) {
            toast({
                title: 'Invalid Date',
                description: 'Scheduled time must be in the future',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/posts/schedule', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content.trim(),
                    image: image.trim() || undefined,
                    video: video.trim() || undefined,
                    platforms: selectedPlatforms,
                    scheduledTime: scheduledDateTime.toISOString(),
                    type: postType
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Post Scheduled',
                    description: `Your post has been scheduled for ${format(scheduledDateTime, 'MMM d, h:mm a')}`,
                });

                if (data.warnings && data.warnings.length > 0) {
                    toast({
                        title: 'Scheduling Warnings',
                        description: data.warnings.join('; '),
                        variant: 'default'
                    });
                }

                if (onScheduled) {
                    onScheduled();
                }
                onClose();
            } else {
                throw new Error(data.error || 'Failed to schedule post');
            }
        } catch (error) {
            console.error('Error scheduling post:', error);
            toast({
                title: 'Scheduling Failed',
                description: error instanceof Error ? error.message : 'Could not schedule post',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setContent('');
        setImage('');
        setVideo('');
        setSelectedPlatforms(['Twitter']);
        setPostType('dynamic');
        setValidationErrors([]);
        setValidationWarnings([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
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
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule New Post</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Content */}
                    <div className="space-y-2">
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                            id="content"
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>{content.length} characters</span>
                            {selectedPlatforms.length > 0 && (
                                <span>
                                    Max: {Math.min(...selectedPlatforms.map(p => platformGuidelines[p].maxTextLength))}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Media */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="image">Image URL</Label>
                            <Input
                                id="image"
                                placeholder="https://example.com/image.jpg"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="video">Video URL</Label>
                            <Input
                                id="video"
                                placeholder="https://example.com/video.mp4"
                                value={video}
                                onChange={(e) => setVideo(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Platforms */}
                    <div className="space-y-3">
                        <Label>Platforms *</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['Twitter', 'LinkedIn', 'Instagram'] as SocialPlatform[]).map(platform => (
                                <Card
                                    key={platform}
                                    className={`cursor-pointer transition-colors ${selectedPlatforms.includes(platform)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'hover:bg-gray-50'
                                        }`}
                                    onClick={() => handlePlatformToggle(platform)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={selectedPlatforms.includes(platform)}
                                                onChange={() => handlePlatformToggle(platform)}
                                            />
                                            {getPlatformIcon(platform)}
                                            <span className="text-sm font-medium">{platform}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Schedule Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="date"
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Time *</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="time"
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Post Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">Post Type</Label>
                        <Select value={postType} onValueChange={(value: 'dynamic' | 'static') => setPostType(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dynamic">Dynamic (Interactive/Engaging)</SelectItem>
                                <SelectItem value="static">Static (Simple/Visual)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Validation Messages */}
                    {(validationErrors.length > 0 || validationWarnings.length > 0) && (
                        <div className="space-y-2">
                            {validationErrors.length > 0 && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                        <span className="text-sm font-medium text-red-800">Validation Errors</span>
                                    </div>
                                    <ul className="text-sm text-red-700 space-y-1">
                                        {validationErrors.map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {validationWarnings.length > 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                                        <span className="text-sm font-medium text-yellow-800">Recommendations</span>
                                    </div>
                                    <ul className="text-sm text-yellow-700 space-y-1">
                                        {validationWarnings.map((warning, index) => (
                                            <li key={index}>• {warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Platform Guidelines */}
                    {selectedPlatforms.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Platform Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {selectedPlatforms.map(platform => (
                                    <div key={platform} className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            {getPlatformIcon(platform)}
                                            <span className="font-medium text-sm">{platform}</span>
                                        </div>
                                        <ul className="text-xs text-gray-600 space-y-1 ml-6">
                                            {platformGuidelines[platform].bestPractices.slice(0, 2).map((practice, index) => (
                                                <li key={index}>• {practice}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSchedule}
                            disabled={isLoading || validationErrors.length > 0}
                        >
                            {isLoading ? 'Scheduling...' : 'Schedule Post'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}