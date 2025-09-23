'use client';

import { useState } from 'react';
import { CalendarView } from '@/components/calendar/calendar-view';
import { CalendarStats } from '@/components/calendar/calendar-stats';
import { PostEventCard } from '@/components/calendar/post-event-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent } from '@/lib/content-scheduler';
import { format } from 'date-fns';
import { Edit, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const handleDateClick = (date: Date) => {
    // Could open schedule dialog for this date
    console.log('Date clicked:', date);
  };

  const handleEditEvent = () => {
    if (selectedEvent && selectedEvent.type === 'scheduled' && selectedEvent.status === 'pending') {
      // TODO: Open edit dialog
      toast({
        title: 'Edit Feature',
        description: 'Edit functionality will be implemented in the next phase',
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || selectedEvent.type !== 'scheduled') return;

    try {
      const response = await fetch(`/api/posts/scheduled/${selectedEvent.scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Post Cancelled',
          description: 'The scheduled post has been cancelled successfully',
        });
        setShowEventDialog(false);
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel post');
      }
    } catch (error) {
      console.error('Error cancelling post:', error);
      toast({
        title: 'Error',
        description: 'Could not cancel the scheduled post',
        variant: 'destructive'
      });
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Content Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Manage your scheduled posts and plan your content strategy
        </p>
      </div>

      <CalendarStats refreshTrigger={refreshTrigger} />

      <CalendarView
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
      />

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              {/* Status and Date */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedEvent.status)}>
                  {getStatusText(selectedEvent.status)}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                {format(selectedEvent.date, 'h:mm a')}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="font-medium">Content</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedEvent.content}</p>
                </div>
              </div>

              {/* Media */}
              {(selectedEvent.image || selectedEvent.video) && (
                <div className="space-y-2">
                  <h3 className="font-medium">Media</h3>
                  <div className="space-y-2">
                    {selectedEvent.image && (
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Image: {selectedEvent.image}
                      </div>
                    )}
                    {selectedEvent.video && (
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Video: {selectedEvent.video}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Platforms */}
              <div className="space-y-2">
                <h3 className="font-medium">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.platforms.map((platform, index) => (
                    <Badge key={index} variant="outline">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Post Type */}
              {selectedEvent.postType && (
                <div className="space-y-2">
                  <h3 className="font-medium">Post Type</h3>
                  <Badge variant="secondary">
                    {selectedEvent.postType === 'dynamic' ? 'Dynamic (Interactive)' : 'Static (Visual)'}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              {selectedEvent.type === 'scheduled' && selectedEvent.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleEditEvent}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={handleDeleteEvent} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}

              {selectedEvent.type === 'published' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    This post has been successfully published to your selected platforms.
                  </p>
                </div>
              )}

              {selectedEvent.status === 'failed' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    This post failed to publish. Check your account connections and try rescheduling.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}