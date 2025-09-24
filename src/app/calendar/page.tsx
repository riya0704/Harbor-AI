'use client';

import { useState } from 'react';
import withAuth from '@/components/layout/with-auth';
import Header from '@/components/layout/header';
import SidebarNav from '@/components/layout/sidebar-nav';
import { PageHeader } from '@/components/layout/page-header';
import { CalendarView } from '@/components/calendar/calendar-view';
import { CalendarStats } from '@/components/calendar/calendar-stats';
import { PostEventCard } from '@/components/calendar/post-event-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent } from '@/lib/content-scheduler';
import { format } from 'date-fns';
import { Edit, Trash2, Clock, Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react';

function CalendarPage() {
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
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Calendar Refreshed',
      description: 'Your calendar data has been updated.',
    });
  };

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
                title="Content Calendar"
                description="Manage your scheduled posts and plan your content strategy across all platforms"
                showHomeButton={true}
              >
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              </PageHeader>

              {/* Calendar Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-4">
                  <CalendarStats refreshTrigger={refreshTrigger} />
                </div>
              </div>

              {/* Calendar View */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border-0 overflow-hidden">
                <CalendarView
                  onEventClick={handleEventClick}
                  onDateClick={handleDateClick}
                />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Post Details
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              {/* Status and Date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Badge className={getStatusColor(selectedEvent.status)}>
                  {getStatusText(selectedEvent.status)}
                </Badge>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {format(selectedEvent.date, 'h:mm a')}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Content</h3>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedEvent.content}</p>
                </div>
              </div>

              {/* Media */}
              {(selectedEvent.image || selectedEvent.video) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Media</h3>
                  <div className="space-y-2">
                    {selectedEvent.image && (
                      <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Image</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 break-all">{selectedEvent.image}</p>
                        </div>
                      </div>
                    )}
                    {selectedEvent.video && (
                      <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Video</p>
                          <p className="text-xs text-purple-700 dark:text-purple-300 break-all">{selectedEvent.video}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Platforms */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.platforms.map((platform, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Post Type */}
              {selectedEvent.postType && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Post Type</h3>
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedEvent.postType === 'dynamic' ? 'Dynamic (Interactive)' : 'Static (Visual)'}
                  </Badge>
                </div>
              )}

              {/* Status Messages */}
              {selectedEvent.type === 'published' && (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    ✅ This post has been successfully published to your selected platforms.
                  </p>
                </div>
              )}

              {selectedEvent.status === 'failed' && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    ❌ This post failed to publish. Check your account connections and try rescheduling.
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedEvent.type === 'scheduled' && selectedEvent.status === 'pending' && (
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleEditEvent} className="w-full sm:w-auto">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Post
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDeleteEvent} 
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Post
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default withAuth(CalendarPage);