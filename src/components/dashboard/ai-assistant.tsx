"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { generateSocialMediaContent, GenerateSocialMediaContentOutput } from "@/ai/flows/generate-social-media-content";
import { refineGeneratedContent } from "@/ai/flows/refine-generated-content";
import { SchedulePostDialog } from "./schedule-post-dialog";
import { useAppContext } from "@/context/app-context";
import { Separator } from "../ui/separator";
import Image from "next/image";

const suggestionSchema = z.object({
  businessDetails: z.string().min(10, "Please provide more details."),
  socialMediaPlatform: z.string().min(1, "Please select a platform."),
  contentGoal: z.string().min(1, "Please provide a goal."),
  personaTraits: z.string().optional(),
});

const generateSchema = z.object({
  businessDetails: z.string(),
  contentType: z.enum(["text", "image", "video"]),
  tone: z.string().optional(),
  style: z.string().optional(),
  persona: z.string().optional(),
  suggestion: z.string(),
});

const refineSchema = z.object({
  originalContent: z.string().min(1),
  feedback: z.string().min(5, "Please provide more detailed feedback."),
  tone: z.string().optional(),
  persona: z.string().optional(),
});


export default function AiAssistant() {
  const { toast } = useToast();
  const { addPost } = useAppContext();
  
  const [isSuggestionPending, startSuggestionTransition] = useTransition();
  const [isGeneratePending, startGenerateTransition] = useTransition();
  const [isRefinePending, startRefineTransition] = useTransition();

  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GenerateSocialMediaContentOutput | null>(null);
  const [refinedContent, setRefinedContent] = useState<string | null>(null);

  const [isScheduling, setScheduling] = useState(false);
  const [activeTab, setActiveTab] = useState("ideas");
  
  const [selectedContentType, setSelectedContentType] = useState<'text' | 'image' | 'video'>('text');

  const finalContent = refinedContent || generatedContent?.text || generatedContent?.imageCaption || generatedContent?.videoCaption;
  const finalImage = generatedContent?.imageUrl;
  const finalVideo = generatedContent?.videoUrl;

  const suggestionForm = useForm<z.infer<typeof suggestionSchema>>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      businessDetails: "",
      socialMediaPlatform: "Twitter",
      contentGoal: "Increase engagement",
      personaTraits: "Witty, knowledgeable",
    },
  });

  const refineForm = useForm<z.infer<typeof refineSchema>>({
    resolver: zodResolver(refineSchema),
    defaultValues: { originalContent: "", feedback: "" },
  });

  const onSuggestionSubmit = (formData: z.infer<typeof suggestionSchema>) => {
    startSuggestionTransition(async () => {
      try {
        const result = await getContentSuggestions(formData);
        setSuggestions(result.suggestions);
      } catch (error) {
        console.error("AI suggestion generation failed:", error);
        toast({
          variant: "destructive",
          title: "Suggestion Failed",
          description: "Could not get suggestions. Please try again.",
        });
        setSuggestions(null);
      }
    });
  }

  const onGenerateSubmit = (formData: z.infer<typeof generateSchema>) => {
    startGenerateTransition(async () => {
      try {
        setGeneratedContent(null);
        setRefinedContent(null);
        setActiveTab("generate");
        const result = await generateSocialMediaContent(formData);
        
        setGeneratedContent(result);

        const contentToRefine = result.text || result.imageCaption || result.videoCaption || "";
        refineForm.setValue("originalContent", contentToRefine);

      } catch (error) {
        console.error("AI content generation failed:", error);
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: "Could not generate content. Please try again.",
        });
        setGeneratedContent(null);
      }
    });
  }

  const onRefineSubmit = (formData: z.infer<typeof refineSchema>) => {
     startRefineTransition(async () => {
        try {
            const result = await refineGeneratedContent(formData);
            setRefinedContent(result.refinedContent);
            refineForm.setValue("originalContent", result.refinedContent);
            refineForm.setValue("feedback", "");
        } catch (error) {
            console.error("AI content refinement failed:", error);
            toast({
                variant: "destructive",
                title: "Refinement Failed",
                description: "Could not refine content. Please try again.",
            });
        }
     });
  }


  const handleSchedule = () => {
    if (finalContent) {
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
      video: post.video,
    });
    toast({
      title: "Post Scheduled!",
      description: "Your new post has been added to the calendar.",
    });
    setScheduling(false);
    setGeneratedContent(null);
    setRefinedContent(null);
    setSuggestions(null);
    suggestionForm.reset();
    refineForm.reset();
    setActiveTab("ideas");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
        <CardDescription>
          Generate, refine, and get ideas for your social media content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ideas">Get Ideas</TabsTrigger>
            <TabsTrigger value="generate">Generate & Refine</TabsTrigger>
          </TabsList>
          
          {/* TAB 1: GET IDEAS */}
          <TabsContent value="ideas" className="mt-4">
            <Form {...suggestionForm}>
              <form
                onSubmit={suggestionForm.handleSubmit(onSuggestionSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={suggestionForm.control}
                  name="businessDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business & Content Context</FormLabel>
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
                    control={suggestionForm.control}
                    name="socialMediaPlatform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Twitter">Twitter</SelectItem>
                            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                            <SelectItem value="Instagram">Instagram</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={suggestionForm.control}
                    name="contentGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Increase engagement" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                    control={suggestionForm.control}
                    name="personaTraits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Persona Traits (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Witty, formal, funny" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <Button type="submit" className="w-full" disabled={isSuggestionPending}>
                  {isSuggestionPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Get Suggestions
                </Button>
              </form>
            </Form>

            {(isSuggestionPending || suggestions) && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Content Suggestions</h4>
                 {isSuggestionPending ? (
                     <div className="rounded-md border bg-muted p-4 min-h-[100px] flex items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Tabs value={selectedContentType} onValueChange={(v) => setSelectedContentType(v as any)} className="w-full">
                          <TabsList className="grid w-full grid-cols-3 mb-2">
                              <TabsTrigger value="text">Text</TabsTrigger>
                              <TabsTrigger value="image">Image</TabsTrigger>
                              <TabsTrigger value="video">Video</TabsTrigger>
                          </TabsList>
                      </Tabs>
                      {suggestions?.map((suggestion, i) => (
                        <Card key={i} className="p-3 bg-muted/50">
                          <div className="flex justify-between items-center">
                            <p className="text-sm flex-1 pr-4">{suggestion}</p>
                            <Button size="sm" onClick={() => onGenerateSubmit({
                              suggestion: suggestion,
                              businessDetails: suggestionForm.getValues("businessDetails"),
                              contentType: selectedContentType,
                              persona: suggestionForm.getValues("personaTraits"),
                            })} disabled={isGeneratePending}>
                                {isGeneratePending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: GENERATE & REFINE */}
          <TabsContent value="generate" className="mt-4">
             {!(generatedContent || isGeneratePending || isRefinePending) && (
                <div className="text-center text-sm text-muted-foreground py-12">
                  <p>Start by getting some content ideas in the &quot;Get Ideas&quot; tab.</p>
                  <p>Once you select an idea, you can generate and refine the content here.</p>
                </div>
             )}

            {(generatedContent || isGeneratePending || isRefinePending) && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Generated Content</h4>
                  <div className="rounded-md border bg-muted p-4 min-h-[120px]">
                      {isGeneratePending || !generatedContent ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {finalImage && (
                            <Image src={finalImage} alt="Generated image" width={200} height={200} className="rounded-md mx-auto" />
                          )}
                          {finalVideo && (
                            <div className="w-full aspect-video rounded-md overflow-hidden mx-auto max-w-[200px]">
                              <video src={finalVideo} controls className="w-full h-full object-cover" />
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{finalContent}</p>
                        </div>
                      )}
                  </div>
                   {isRefinePending && (
                    <div className="flex items-center justify-center text-muted-foreground pt-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refining...
                    </div>
                   )}
                </div>

                <Separator />

                <div>
                   <h4 className="font-semibold mb-2">Refine Content</h4>
                    <Form {...refineForm}>
                      <form
                        onSubmit={refineForm.handleSubmit(onRefineSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={refineForm.control}
                          name="feedback"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Feedback</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., Make it shorter, add a call to action, use more emojis..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <input type="hidden" {...refineForm.register("originalContent")} />
                        <Button type="submit" className="w-full" variant="outline" disabled={isRefinePending || !generatedContent}>
                          {isRefinePending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                          )}
                          Refine
                        </Button>
                      </form>
                    </Form>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      {finalContent && (
        <>
        <Separator />
        <CardFooter className="p-4">
          <SchedulePostDialog
              open={isScheduling}
              onOpenChange={setScheduling}
              post={{ content: finalContent, image: finalImage, video: finalVideo }}
              onSave={handleSavePost}
          >
              <Button onClick={handleSchedule} className="w-full">
                Schedule Post
              </Button>
          </SchedulePostDialog>
        </CardFooter>
        </>
      )}
    </Card>
  );
}
