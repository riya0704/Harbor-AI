"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Post, SocialAccount } from "@/lib/types";

interface AppContextType {
  accounts: SocialAccount[];
  posts: Post[];
  addPost: (post: Omit<Post, "id" | "status">) => Promise<void>;
  updatePost: (post: Post) => Promise<void>;
  getPostsForDate: (date: Date) => Post[];
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      // Dates from API are strings, convert them back to Date objects
      setPosts(data.map((p: any) => ({ ...p, date: new Date(p.date) })));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error(error);
    }
  }, []);
  
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await Promise.all([fetchPosts(), fetchAccounts()]);
      setIsLoading(false);
    }
    loadData();
  }, [fetchPosts, fetchAccounts]);


  const addPost = useCallback(async (post: Omit<Post, "id" | "status">) => {
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...post, status: "scheduled" }),
        });
        if (!response.ok) throw new Error('Failed to create post');
        const newPost = await response.json();
        setPosts((prev) => [...prev, { ...newPost, date: new Date(newPost.date) }]);
    } catch (error) {
        console.error(error);
    }
  }, []);

  const updatePost = useCallback(async (updatedPost: Post) => {
    try {
        const response = await fetch(`/api/posts/${updatedPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPost),
        });
        if (!response.ok) throw new Error('Failed to update post');
        const savedPost = await response.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === savedPost.id ? { ...savedPost, date: new Date(savedPost.date) } : p))
        );
    } catch (error) {
        console.error(error);
    }
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

  const value = { accounts, posts, addPost, updatePost, getPostsForDate, isLoading };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
