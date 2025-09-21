import type { SocialAccount, Post } from "./types";

// This file is now for seeding/testing purposes and is not directly used by the app context.

export const MOCK_ACCOUNTS: SocialAccount[] = [
  {
    id: "1",
    platform: "Twitter",
    username: "@humanity",
    avatarUrl: "https://picsum.photos/seed/twitter/40/40",
  },
  {
    id: "2",
    platform: "LinkedIn",
    username: "Humanity Founders",
    avatarUrl: "https://picsum.photos/seed/linkedin/40/40",
  },
  {
    id: "3",
    platform: "Instagram",
    username: "humanity.founders",
    avatarUrl: "https://picsum.photos/seed/instagram/40/40",
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: "post1",
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    platforms: ["Twitter"],
    content: "Excited to announce our new AI-powered platform, Harbor AI! Simplifying social media management for everyone. #AI #SocialMedia",
    status: "scheduled",
    type: "static",
  },
  {
    id: "post2",
    date: new Date(new Date().setDate(new Date().getDate() + 4)),
    platforms: ["LinkedIn"],
    content: "Our team at Humanity Founders is proud to launch Harbor AI, a tool designed to empower creators and businesses in the digital space. Discover how we're leveraging AI to streamline content creation and scheduling.",
    status: "scheduled",
    type: "dynamic",
    image: "https://picsum.photos/seed/post2/600/400"
  },
   {
    id: "post3",
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    platforms: ["Twitter", "LinkedIn"],
    content: "Just published a new blog post on the future of AI in marketing. A must-read for all industry professionals!",
    status: "published",
    type: "static",
  },
  {
    id: "post4",
    date: new Date(),
    platforms: ["Instagram"],
    content: "Behind the scenes at Harbor AI! ✨ #StartupLife #Tech",
    status: "draft",
    type: "dynamic",
    image: "https://picsum.photos/seed/post4/400/400"
  }
];
