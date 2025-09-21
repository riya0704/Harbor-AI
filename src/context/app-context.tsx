"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Post, SocialAccount } from "@/lib/types";
import { useRouter } from "next/navigation";
import { UserDocument } from "@/models/User";

interface AppContextType {
  user: UserDocument | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  accounts: SocialAccount[];
  posts: Post[];
  addPost: (post: Omit<Post, "id" | "status">) => Promise<void>;
  updatePost: (post: Post) => Promise<void>;
  getPostsForDate: (date: Date) => Post[];
  isLoading: boolean;
  isAuthLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to create auth headers
const getAuthHeaders = (token: string | null) => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDocument | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setAuthIsLoading] = useState(true);

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setAuthIsLoading(false);
  }, []);
  
  const fetchPosts = useCallback(async (authToken: string) => {
    try {
      const response = await fetch('/api/posts', { headers: getAuthHeaders(authToken) });
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data.map((p: any) => ({ ...p, date: new Date(p.date) })));
    } catch (error) {
      console.error(error);
      if((error as any).status === 401) logout();
    }
  }, []);

  const fetchAccounts = useCallback(async (authToken: string) => {
    try {
      const response = await fetch('/api/accounts', { headers: getAuthHeaders(authToken) });
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error(error);
      if((error as any).status === 401) logout();
    }
  }, []);
  
  useEffect(() => {
    async function loadData() {
      if (!token) {
        setIsLoading(false);
        return;
      };
      setIsLoading(true);
      await Promise.all([fetchPosts(token), fetchAccounts(token)]);
      setIsLoading(false);
    }
    loadData();
  }, [token, fetchPosts, fetchAccounts]);


  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const { user, token } = await response.json();
      setUser(user);
      setToken(token);
      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  const addPost = useCallback(async (post: Omit<Post, "id" | "status">) => {
    if(!token) return;
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
            body: JSON.stringify({ ...post, status: "scheduled" }),
        });
        if (!response.ok) throw new Error('Failed to create post');
        const newPost = await response.json();
        setPosts((prev) => [...prev, { ...newPost, date: new Date(newPost.date) }]);
    } catch (error) {
        console.error(error);
    }
  }, [token]);

  const updatePost = useCallback(async (updatedPost: Post) => {
    if(!token) return;
    try {
        const response = await fetch(`/api/posts/${updatedPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
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
  }, [token]);

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

  const value = { user, token, login, logout, accounts, posts, addPost, updatePost, getPostsForDate, isLoading, isAuthLoading };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}