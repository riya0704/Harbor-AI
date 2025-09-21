"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback } from "react";
import type { Post, SocialAccount } from "@/lib/types";
import { MOCK_ACCOUNTS, MOCK_POSTS } from "@/lib/mock-data";

interface AppContextType {
  accounts: SocialAccount[];
  posts: Post[];
  addPost: (post: Omit<Post, "id" | "status">) => void;
  updatePost: (post: Post) => void;
  getPostsForDate: (date: Date) => Post[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>(MOCK_ACCOUNTS);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  const addPost = useCallback((post: Omit<Post, "id" | "status">) => {
    setPosts((prev) => [
      ...prev,
      { ...post, id: `post-${Date.now()}`, status: "scheduled" },
    ]);
  }, []);

  const updatePost = useCallback((updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
  }, []);

  const getPostsForDate = useCallback(
    (date: Date) => {
      return posts.filter(
        (post) =>
          post.date.getFullYear() === date.getFullYear() &&
          post.date.getMonth() === date.getMonth() &&
          post.date.getDate() === date.getDate()
      );
    },
    [posts]
  );

  const value = { accounts, posts, addPost, updatePost, getPostsForDate };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
