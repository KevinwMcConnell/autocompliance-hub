import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
        // Query user's role from database only - no email fallback
        const { data, error } = await supabase.rpc("get_user_role", {
          _user_id: user.id,
        });

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("user");
        } else {
          setRole((data as AppRole) || "user");
        }
      } catch (err) {
        console.error("Error in fetchRole:", err);
        setRole("user");
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user?.id]);

  // Admin status determined solely by database role
  const isAdmin = role === "admin";

  return { isAdmin, role, loading };
}
