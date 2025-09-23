'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarEvent } from '@/lib/content-scheduler';
import { format } from 'date-fns';
import { Clock, MoreHorizontal, Edit, Trash2, Eye, Twitter, Linkedin, Instagram } from 'lucide-react';

interface PostEventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function PostEventCard({ event, onClick, onEdit, onDelete, onView }: PostEventCardProps) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Twitter':
        return <Twitter className="h-3 w-3 text-blue-500" />;
      case 'LinkedIn':
        return <Linkedin className="h-3 w-3 text-blue-700" />;
      case 'Instagram':
        return <Instagram className="h-3 w-3 text-pink-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Scheduled';
      case 'published':
        return 'Published';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Publishing';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView();
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        event.type === 'scheduled' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(event.status)}>
                  {getStatusText(event.status)}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(event.date, 'MMM d, h:mm a')}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {event.type === 'scheduled' && event.status === 'pending' && (
                    <>
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <div className="mb-3">
              <p className="text-sm text-gray-900 line-clamp-2">
                {event.content}
              </p>
            </div>

            {/* Media Preview */}
            {(event.image || event.video) && (
              <div className="mb-3">
                {event.image && (
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Image attached
                  </div>
                )}
                {event.video && (
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Video attached
                  </div>
                )}
              </div>
            )}

            {/* Platforms */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Platforms:</span>
                <div className="flex items-center space-x-1">
                  {event.platforms.map((platform, index) => (
                    <div key={index} className="flex items-center">
                      {getPlatformIcon(platform)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Post Type */}
              {event.postType && (
                <Badge variant="outline" className="text-xs">
                  {event.postType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}