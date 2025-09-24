'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Calendar, Grid, List, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { CalendarEvent } from '@/lib/content-scheduler';
import { PostEventCard } from './post-event-card';
import { SchedulePostDialog } from './schedule-post-dialog';

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({ onEventClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  // Get calendar data
  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await fetch(
        `/api/calendar/posts?year=${year}&month=${month}&view=${view}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEvents(data.events);
        setEventsByDate(data.eventsByDate);
      } else {
        throw new Error(data.error || 'Failed to fetch calendar data');
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast({
        title: 'Error',
        description: 'Could not load calendar data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, view]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date);
    }
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Handle new post scheduling
  const handleSchedulePost = (date?: Date) => {
    setSelectedDate(date || new Date());
    setShowScheduleDialog(true);
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };

  // Get calendar days for month view
  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  // Get status color for events
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render month view
  const renderMonthView = () => {
    const days = getCalendarDays();
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map(day => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isCurrentDay ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${isCurrentDay ? 'font-bold text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {dayEvents.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate cursor-pointer ${getStatusColor(event.status)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

    return (
      <div className="space-y-4">
        {sortedEvents.map(event => (
          <PostEventCard
            key={event.id}
            event={event}
            onClick={() => handleEventClick(event)}
          />
        ))}
        {sortedEvents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No posts scheduled for this period
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle className="text-2xl">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={view === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('month')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Month
                </Button>
                <Button
                  variant={view === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('week')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>

              {/* Schedule Post Button */}
              <Button onClick={() => handleSchedulePost()}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Post
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : view === 'month' ? (
            renderMonthView()
          ) : (
            renderListView()
          )}
        </CardContent>
      </Card>

      {/* Schedule Post Dialog */}
      {showScheduleDialog && (
        <SchedulePostDialog
          isOpen={showScheduleDialog}
          onClose={() => setShowScheduleDialog(false)}
          defaultDate={selectedDate}
          onScheduled={() => {
            fetchCalendarData();
            setShowScheduleDialog(false);
          }}
        />
      )}
    </div>
  );
}