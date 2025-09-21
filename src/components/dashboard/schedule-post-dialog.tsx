"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Post, SocialPlatform } from "@/lib/types";
import { Icons } from "@/components/icons";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { useAppContext } from "@/context/app-context";
import Image from "next/image";

interface SchedulePostDialogProps {
  children?: React.ReactNode;
  post?: Partial<Post>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (post: any) => void;
}

const platformIcons: Record<SocialPlatform, React.ReactNode> = {
  Twitter: <Twitter className="h-4 w-4" />,
  LinkedIn: <Linkedin className="h-4 w-4" />,
  Instagram: <Icons.instagram className="h-4 w-4" />,
};

export function SchedulePostDialog({
  children,
  post,
  open,
  onOpenChange,
  onSave
}: SchedulePostDialogProps) {
  const [content, setContent] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("10:00");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [type, setType] = useState<"static" | "dynamic">("static");
  const [image, setImage] = useState<string | undefined>();
  const [id, setId] = useState<string | undefined>();
  
  const { accounts } = useAppContext();

  useEffect(() => {
    if (post) {
      setContent(post.content || "");
      setDate(post.date || new Date());
      setTime(post.date ? format(post.date, "HH:mm") : "10:00");
      setPlatforms(post.platforms || []);
      setType(post.type || "static");
      setImage(post.image);
      setId(post.id);
    }
  }, [post]);

  const handleSave = () => {
    if (!date || !content || platforms.length === 0) return;
    const [hours, minutes] = time.split(":").map(Number);
    const combinedDate = new Date(date);
    combinedDate.setHours(hours, minutes);

    const postToSave = {
      id,
      content,
      date: combinedDate,
      platforms,
      type,
      image,
      status: 'scheduled'
    };
    if (onSave) onSave(postToSave);
  };
  
  const DialogContentInner = (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{id ? "Edit Post" : "Schedule New Post"}</DialogTitle>
        <DialogDescription>
          Craft your message and schedule it for the perfect moment.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Social Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {accounts.map(account => (
                 <Button
                    key={account.id}
                    variant={platforms.includes(account.platform) ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                        setPlatforms(prev => 
                            prev.includes(account.platform) 
                            ? prev.filter(p => p !== account.platform) 
                            : [...prev, account.platform]
                        );
                    }}
                >
                    {platformIcons[account.platform]}
                    {account.platform}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Image (optional)</Label>
            {image && <Image src={image} alt="Post image" width={100} height={100} className="rounded-md" />}
            <Input type="file" />
          </div>
        </div>
        <div className="space-y-4">
           <div className="space-y-2">
              <Label>Date & Time</Label>
              <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="pl-9" />
                  </div>
              </div>
           </div>
           <div className="space-y-2">
                <Label>Post Type</Label>
                <Select value={type} onValueChange={(v: "static" | "dynamic") => setType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select post type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static Post</SelectItem>
                    <SelectItem value="dynamic">Dynamic Post</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Dynamic posts aim for engagement, while static posts are for simple announcements.
                </p>
            </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
        <Button onClick={handleSave}>
          {id ? "Save Changes" : "Schedule Post"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  if (children) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {DialogContentInner}
    </Dialog>
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>{DialogContentInner}</Dialog>
}
