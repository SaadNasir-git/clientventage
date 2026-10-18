import { Providers } from "@/src/components/providers";
import { getUser } from "@/src/lib/auth-helpers";
import { User } from "@/src/lib/types";

let user: User | null;

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    try {
        user = await getUser();
    } catch (error) {
        user = null
    }
    return (
        <Providers user={user}>{children}</Providers>
    )
} 