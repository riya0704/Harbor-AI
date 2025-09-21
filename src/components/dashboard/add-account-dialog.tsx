"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Twitter, Linkedin } from "lucide-react";
import { Icons } from "../icons";
import { useToast } from "@/hooks/use-toast";

interface AddAccountDialogProps {
    onAddAccount: (platform: string, username: string) => Promise<void>;
}

export function AddAccountDialog({ onAddAccount }: AddAccountDialogProps) {
    const [open, setOpen] = useState(false);
    const [platform, setPlatform] = useState("");
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleConnect = async () => {
        if(!platform || !username) {
             toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please select a platform and enter a username.",
            });
            return;
        }

        setIsLoading(true);
        try {
            // In a real app, this would initiate the OAuth flow.
            // For now, we simulate adding the account directly.
            await onAddAccount(platform, username);
            toast({
                title: "Account Connected!",
                description: `Successfully connected your ${platform} account.`,
            });
            setOpen(false);
            setPlatform("");
            setUsername("");
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Connection Failed",
                description: "Could not connect the account. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const platformIcons: Record<string, React.ReactNode> = {
        Twitter: <Twitter className="h-5 w-5 text-sky-500" />,
        LinkedIn: <Linkedin className="h-5 w-5 text-blue-700" />,
        Instagram: <Icons.instagram className="h-5 w-5 text-pink-600" />,
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect New Account
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Connect a New Account</DialogTitle>
                    <DialogDescription>
                        Choose a platform and enter your username to connect. In a real app, this would redirect you to the platform to authorize.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="platform">Platform</Label>
                         <Select onValueChange={setPlatform} value={platform}>
                          <SelectTrigger id="platform">
                            <SelectValue placeholder="Select a platform..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Twitter">
                                <span className="flex items-center gap-2">{platformIcons.Twitter} Twitter</span>
                            </SelectItem>
                            <SelectItem value="LinkedIn">
                                <span className="flex items-center gap-2">{platformIcons.LinkedIn} LinkedIn</span>
                            </SelectItem>
                            <SelectItem value="Instagram">
                                <span className="flex items-center gap-2">{platformIcons.Instagram} Instagram</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="@your-handle" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleConnect} disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Connect
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

}
