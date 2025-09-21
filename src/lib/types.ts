export type SocialPlatform = "Twitter" | "LinkedIn" | "Instagram";

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  username: string;
  avatarUrl: string;
};

export type PostStatus = "draft" | "scheduled" | "published" | "error";

export type PostType = "dynamic" | "static";

export type Post = {
  id: string;
  date: Date;
  platforms: SocialPlatform[];
  content: string;
  image?: string;
  video?: string;
  status: PostStatus;
  type: PostType;
  userId: string;
};
