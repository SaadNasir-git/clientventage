import { getUser } from "../lib/auth-helpers"
import { Unauthorized } from "./Main";

let user: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  role: "user" | "admin" | null | undefined;
} | null

try {
  user = await getUser();
} catch {
  user = null;
}
const page = async () => {
  return (
    <Unauthorized userName={user?.name} />
  )
}

export default page