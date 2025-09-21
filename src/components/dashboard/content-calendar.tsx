"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";
import { SchedulePostDialog } from "./schedule-post-dialog";
import { useToast } from "@/hooks/use-toast";

const platformColors: Record<string, string> = {
    Twitter: "bg-sky-500",
    LinkedIn: "bg-blue-700",
    Instagram: "bg-pink-600",
};

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { getPostsForDate, addPost, updatePost } = useAppContext();
  const { toast } = useToast();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<Partial<Post> | null>(null);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const prevMonthDays = useMemo(() => {
    const prevMonth = subMonths(currentDate, 1);
    const endOfPrevMonth = endOfMonth(prevMonth);
    return Array.from({ length: startingDayIndex }, (_, i) => {
        const day = new Date(endOfPrevMonth);
        day.setDate(endOfPrevMonth.getDate() - (startingDayIndex - 1 - i));
        return day;
    });
  }, [currentDate, startingDayIndex]);


  const nextMonthDays = useMemo(() => {
    const endDayIndex = getDay(lastDayOfMonth);
    const nextMonth = addMonths(currentDate, 1);
    const startOfNextMonth = startOfMonth(nextMonth);
    return Array.from({ length: 6 - endDayIndex }, (_, i) => {
        const day = new Date(startOfNextMonth);
        day.setDate(startOfNextMonth.getDate() + i);
        return day;
    });
  }, [currentDate, lastDayOfMonth]);

  const calendarDays = [...prevMonthDays, ...daysInMonth, ...nextMonthDays];

  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSelectedPost({date: day});
    setDialogOpen(true);
  };
  
  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setDialogOpen(true);
  };
  
  const handleSavePost = async (post: Post) => {
    if(post.id) {
        await updatePost(post);
        toast({ title: "Post Updated!", description: "Your post has been updated on the calendar." });
    } else {
        await addPost(post);
        toast({ title: "Post Scheduled!", description: "Your new post has been added to the calendar." });
    }
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl">
            {format(currentDate, "MMMM yyyy")}
          </CardTitle>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <SchedulePostDialog open={isDialogOpen} onOpenChange={setDialogOpen} post={selectedPost ?? {date: selectedDate ?? new Date()}} onSave={handleSavePost}>
           <Button onClick={() => handleDayClick(new Date())}>
                <Plus className="mr-2 h-4 w-4" /> Schedule Post
            </Button>
        </SchedulePostDialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-t border-l">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="border-r border-b p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            const postsForDay = getPostsForDate(day);
            return (
              <div
                key={index}
                className={cn(
                  "relative h-32 border-r border-b p-2 group",
                  !isSameMonth(day, currentDate) && "bg-muted/30"
                )}
              >
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "text-sm",
                    isToday(day) &&
                      "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </time>
                <div className="mt-1 space-y-1">
                  {postsForDay.slice(0, 2).map((post) => (
                    <button key={post.id} onClick={() => handlePostClick(post)} className="w-full text-left p-1 rounded-md bg-secondary hover:bg-secondary/80">
                      <p className="text-xs truncate">{post.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {post.platforms.map(p => <div key={p} className={cn("w-2 h-2 rounded-full", platformColors[p])} />)}
                      </div>
                    </button>
                  ))}
                   {postsForDay.length > 2 && (
                    <p className="text-xs text-muted-foreground">+ {postsForDay.length - 2} more</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDayClick(day)}>
                    <Plus className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
