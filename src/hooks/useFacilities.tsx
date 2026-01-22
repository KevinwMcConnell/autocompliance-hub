import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Facility {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  onboarding_completed: boolean;
}

interface FacilitiesContextType {
  facilities: Facility[];
  currentFacility: Facility | null;
  setCurrentFacility: (facility: Facility | null) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const FacilitiesContext = createContext<FacilitiesContextType | undefined>(undefined);

export function FacilitiesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [currentFacility, setCurrentFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchFacilities = async () => {
    if (!user) {
      setFacilities([]);
      setCurrentFacility(null);
      // Only set loading false if auth is also done loading
      if (!authLoading) {
        setLoading(false);
        setHasFetched(true);
      }
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("facilities")
      .select("id, name, address, city, state, onboarding_completed")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFacilities(data);
      if (data.length > 0 && !currentFacility) {
        setCurrentFacility(data[0]);
      }
    }
    setLoading(false);
    setHasFetched(true);
  };

  useEffect(() => {
    // Don't fetch until auth is done loading
    if (authLoading) {
      setLoading(true);
      return;
    }
    fetchFacilities();
  }, [user, authLoading]);

  return (
    <FacilitiesContext.Provider
      value={{
        facilities,
        currentFacility,
        setCurrentFacility,
        loading,
        refetch: fetchFacilities,
      }}
    >
      {children}
    </FacilitiesContext.Provider>
  );
}

export function useFacilities() {
  const context = useContext(FacilitiesContext);
  if (context === undefined) {
    throw new Error("useFacilities must be used within a FacilitiesProvider");
  }
  return context;
}
