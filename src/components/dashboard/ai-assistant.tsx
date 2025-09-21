"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2 } from "lucide-react";
import { getContentSuggestions } from "@/ai/flows/get-content-suggestions";
import { generateSocialMediaContent } from "@/ai/flows/generate-social-media-content";
import { refineGeneratedContent } from "@/ai/flows/refine-generated-content";
import { SchedulePostDialog } from "./schedule-post-dialog";
import { useAppContext } from "@/context/app-context";

const generateSchema = z.object({
  businessDetails: z.string().min(10, "Please provide more details."),
  contentType: z.enum(["text", "image", "video"]),
  tone: z.string().optional(),
  style: z.string().optional(),
  persona: z.string().optional(),
});

export default function AiAssistant() {
  const { toast } = useToast();
  const { addPost } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isScheduling, setScheduling] = useState(false);

  const form = useForm<z.infer<typeof generateSchema>>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      businessDetails: "",
      contentType: "text",
      tone: "Friendly",
      style: "Creative",
      persona: "Expert",
    },
  });

  async function onSubmit(values: z.infer<typeof generateSchema>) {
    setIsLoading(true);
    setGeneratedContent(null);
    try {
      const result = await generateSocialMediaContent(values);
      let content = result.text || "";
      if (result.imageCaption) content += `\n\n${result.imageCaption}`;
      if (result.videoCaption) content += `\n\n${result.videoCaption}`;
      setGeneratedContent(content);
    } catch (error) {
      console.error("AI content generation failed:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate content. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSchedule = () => {
    if (generatedContent) {
      setScheduling(true);
    }
  };
  
  const handleSavePost = (post: any) => {
    addPost({
      date: post.date,
      platforms: post.platforms,
      content: post.content,
      type: post.type,
      image: post.image,
    });
    toast({
      title: "Post Scheduled!",
      description: "Your new post has been added to the calendar.",
    });
    setScheduling(false);
    setGeneratedContent(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
        <CardDescription>
          Generate, refine, and get ideas for your social media content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="refine">Refine</TabsTrigger>
          </TabsList>
          <TabsContent value="generate" className="mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="businessDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Details & Context</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., We are a coffee shop in downtown that specializes in single-origin beans and latte art..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">Text Post</SelectItem>
                            <SelectItem value="image">Image + Caption</SelectItem>
                            <SelectItem value="video">Video + Caption</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Professional, Funny" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate Content
                </Button>
              </form>
            </Form>

            {(isLoading || generatedContent) && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Generated Content</h4>
                <div className="rounded-md border bg-muted p-4 min-h-[100px]">
                  {isLoading ? (
                     <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                  )}
                </div>
                {!isLoading && generatedContent && (
                  <div className="mt-4 flex gap-2">
                    <SchedulePostDialog
                      open={isScheduling}
                      onOpenChange={setScheduling}
                      post={{content: generatedContent}}
                      onSave={handleSavePost}
                    >
                      <Button onClick={handleSchedule} className="w-full">Schedule Post</Button>
                    </SchedulePostDialog>
                    <Button variant="outline" className="w-full">Refine</Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="refine">
             <p className="text-sm text-center text-muted-foreground py-8">Refinement feature coming soon.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
