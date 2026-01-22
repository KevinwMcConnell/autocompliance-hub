import { createContext, useContext, useState, ReactNode } from "react";
import {
  demoEvidenceItems,
  demoTasks,
  demoDocuments,
  getDemoStats,
  DemoEvidenceItem,
  DemoTask,
  DemoDocument,
} from "@/lib/demoData";
import { toast } from "sonner";

interface DemoDataContextType {
  demoLoaded: boolean;
  evidenceItems: DemoEvidenceItem[];
  tasks: DemoTask[];
  documents: DemoDocument[];
  stats: ReturnType<typeof getDemoStats> | null;
  loadDemoData: () => void;
  clearDemoData: () => void;
  updateTask: (taskId: string, updates: Partial<DemoTask>) => void;
  updateDocument: (docId: string, updates: Partial<DemoDocument>) => void;
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<DemoEvidenceItem[]>([]);
  const [tasks, setTasks] = useState<DemoTask[]>([]);
  const [documents, setDocuments] = useState<DemoDocument[]>([]);

  const loadDemoData = () => {
    setEvidenceItems(demoEvidenceItems);
    setTasks(demoTasks);
    setDocuments(demoDocuments);
    setDemoLoaded(true);
    toast.success("Demo data loaded! Explore the dashboard to see sample compliance items.");
  };

  const clearDemoData = () => {
    setEvidenceItems([]);
    setTasks([]);
    setDocuments([]);
    setDemoLoaded(false);
    toast.info("Demo data cleared.");
  };

  const updateTask = (taskId: string, updates: Partial<DemoTask>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  const updateDocument = (docId: string, updates: Partial<DemoDocument>) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, ...updates } : doc))
    );
  };

  const stats = demoLoaded ? getDemoStats() : null;

  return (
    <DemoDataContext.Provider
      value={{
        demoLoaded,
        evidenceItems,
        tasks,
        documents,
        stats,
        loadDemoData,
        clearDemoData,
        updateTask,
        updateDocument,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (context === undefined) {
    throw new Error("useDemoData must be used within a DemoDataProvider");
  }
  return context;
}
