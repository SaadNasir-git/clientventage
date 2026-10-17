"use client";

import { ShieldX, LogOut, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function Unauthorized({ userName }: { userName?: string }) {
  const router = useRouter();

  const onSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // ignore — cookie may already be cleared
    }
    toast.success("Signed out");
    router.push("/signin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldX className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Access restricted
        </h1>
        <p className="text-sm text-muted-foreground">
          {userName ? `Hi ${userName},` : "Hi,"} your account doesn&apos;t have
          permission to view this page.
        </p>
        <p className="mx-auto max-w-md text-xs text-muted-foreground">
          Only administrators can access the dashboard. Contact your
          administrator if you believe this is a mistake.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Go back
        </Button>
        <Button variant="outline" onClick={onSignOut}>
          <LogOut className="mr-1.5 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}