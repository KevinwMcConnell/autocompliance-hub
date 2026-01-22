import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Fallback email allowlist (temporary until role data exists)
const ADMIN_EMAILS: string[] = [
  "kevinsemail925@gmail.com",
];

type AppRole = "admin" | "moderator" | "user";

export function useAdmin() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Query user's role from database
        const { data, error } = await supabase.rpc("get_user_role", {
          _user_id: user.id,
        });

        if (error) {
          console.error("Error fetching user role:", error);
          // Fallback to email allowlist
          const emailIsAdmin = user.email 
            ? ADMIN_EMAILS.includes(user.email.toLowerCase()) 
            : false;
          setRole(emailIsAdmin ? "admin" : "user");
        } else {
          setRole(data as AppRole || "user");
        }
      } catch (err) {
        console.error("Error in fetchRole:", err);
        // Fallback to email allowlist
        const emailIsAdmin = user.email 
          ? ADMIN_EMAILS.includes(user.email.toLowerCase()) 
          : false;
        setRole(emailIsAdmin ? "admin" : "user");
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user?.id, user?.email]);

  // Use database role, with email allowlist as fallback
  const isAdmin = role === "admin" || (
    role === null && user?.email 
      ? ADMIN_EMAILS.includes(user.email.toLowerCase()) 
      : false
  );

  return { isAdmin, role, loading };
}
