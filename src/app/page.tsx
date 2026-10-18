import { User } from "better-auth";
import { getUser } from "../lib/auth-helpers"
import { Unauthorized } from "./Main";
import { ThemeProvider } from "next-themes";

let user: User | null;

try {
  user = await getUser();
} catch {
  user = null;
}

const page = async () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Unauthorized userName={user?.name} />
    </ThemeProvider>
  )
}

export default page