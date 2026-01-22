import { useAuth } from "@/hooks/useAuth";

// Admin email allowlist - add authorized admin emails here
const ADMIN_EMAILS: string[] = [
  // Add admin emails here, e.g.:
  // "admin@yourcompany.com",
];

export function useAdmin() {
  const { user } = useAuth();

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  return { isAdmin };
}
