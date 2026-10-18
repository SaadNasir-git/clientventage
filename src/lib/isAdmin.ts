import { getUser } from "./auth-helpers"

export const isAdmin = async () => {
    try {
        const user = await getUser();
        if (user.role !== 'admin') {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}