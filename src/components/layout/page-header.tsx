"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  backUrl?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  showHomeButton = true,
  showBackButton = false,
  backUrl,
  children,
  className
}: PageHeaderProps) {
  const router = useRouter();

  const handleHome = () => {
    router.push('/');
  };

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Go back</span>
            </Button>
          )}
          {showHomeButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHome}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Go to dashboard</span>
            </Button>
          )}
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}