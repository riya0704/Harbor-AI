"use client";

import { Linkedin, Twitter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useAppContext } from "@/context/app-context";
import { Separator } from "../ui/separator";
import { AddAccountDialog } from "./add-account-dialog";

export default function AccountManager() {
  const { accounts, addAccount } = useAppContext();

  const platformIcons: Record<string, React.ReactNode> = {
    Twitter: <Twitter className="h-5 w-5 text-sky-500" />,
    LinkedIn: <Linkedin className="h-5 w-5 text-blue-700" />,
    Instagram: <Icons.instagram className="h-5 w-5 text-pink-600" />,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Manage and connect your social media profiles.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 min-h-[100px]">
        {accounts.map((account, index) => (
          <div key={account.id} className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={account.avatarUrl} alt={account.platform} />
              <AvatarFallback>{account.platform.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{account.platform}</p>
              <p className="text-sm text-muted-foreground">
                {account.username}
              </p>
            </div>
            {platformIcons[account.platform]}
          </div>
        ))}
         {accounts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No accounts connected yet.</p>}
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <AddAccountDialog onAddAccount={addAccount} />
      </CardFooter>
    </Card>
  );
}
