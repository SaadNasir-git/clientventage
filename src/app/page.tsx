import { Suspense } from "react";
import { Loader } from "lucide-react";
import { getUser } from "@/lib/auth-helpers";
import { ProtectedApp } from "@/components/protected-app";
import { Unauthorized } from "@/components/auth/unauthorized";

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AuthenticatedHome />
    </Suspense>
  );
}

async function AuthenticatedHome() {
  let user;
  try {
    user = await getUser();
  } catch {
    return <Unauthorized />;
  }

  if (user.role !== "admin") {
    return <Unauthorized userName={user.name} />;
  }

  return (
    <ProtectedApp
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}