"use client";

import Header from "@/components/layout/header";
import withAuth from "@/components/layout/with-auth";
import SidebarNav from "@/components/layout/sidebar-nav";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAppContext } from "@/context/app-context";
import { AddAccountDialog } from "@/components/dashboard/add-account-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Twitter, Linkedin } from "lucide-react";
import { Icons } from "@/components/icons";

function ConnectionsPage() {
    const { accounts, addAccount } = useAppContext();

    const platformIcons: Record<string, React.ReactNode> = {
        Twitter: <Twitter className="h-5 w-5 text-sky-500" />,
        LinkedIn: <Linkedin className="h-5 w-5 text-blue-700" />,
        Instagram: <Icons.instagram className="h-5 w-5 text-pink-600" />,
    };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar className="h-full border-r">
          <SidebarNav />
        </Sidebar>
        <SidebarInset className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-2xl">
               <Card>
                <CardHeader>
                    <CardTitle>Connections</CardTitle>
                    <CardDescription>Manage your connected social media accounts.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {accounts.length > 0 ? (
                        accounts.map((account) => (
                          <div key={account.id} className="flex items-center gap-4 p-4 rounded-md border">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={account.avatarUrl} alt={account.platform} />
                              <AvatarFallback>{account.platform.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{account.platform}</p>
                              <p className="text-sm text-muted-foreground">
                                @{account.username}
                              </p>
                            </div>
                            {platformIcons[account.platform]}
                          </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No accounts connected yet.</p>
                    )}
                </CardContent>
                <Separator />
                <CardFooter className="p-4">
                    <AddAccountDialog onAddAccount={addAccount} />
                </CardFooter>
               </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default withAuth(ConnectionsPage);
