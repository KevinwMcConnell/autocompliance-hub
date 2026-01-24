import { useState, useEffect } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface EvidenceType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  retention_days: number | null;
  recurrence_days: number | null;
}

interface AddEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEvidenceCreated: () => void;
}

export function AddEvidenceDialog({ open, onOpenChange, onEvidenceCreated }: AddEvidenceDialogProps) {
  const { currentFacility } = useFacilities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [notes, setNotes] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");

  useEffect(() => {
    const fetchEvidenceTypes = async () => {
      const { data, error } = await supabase
        .from("evidence_types")
        .select("id, name, category, description, retention_days, recurrence_days")
        .order("category", { ascending: true });

      if (!error && data) {
        setEvidenceTypes(data);
      }
    };

    if (open) {
      fetchEvidenceTypes();
    }
  }, [open]);

  const resetForm = () => {
    setSelectedTypeId("");
    setNotes("");
    setNextDueDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTypeId) {
      toast.error("Please select an evidence type");
      return;
    }

    if (!currentFacility?.id) {
      toast.error("No facility selected");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("evidence_items").insert({
        facility_id: currentFacility.id,
        evidence_type_id: selectedTypeId,
        notes: notes.trim() || null,
        next_due_at: nextDueDate ? new Date(nextDueDate).toISOString() : null,
        status: "missing",
      });

      if (error) throw error;

      toast.success("Evidence item created successfully!");
      resetForm();
      onOpenChange(false);
      onEvidenceCreated();
    } catch (error: any) {
      console.error("Error creating evidence item:", error);
      toast.error(error.message || "Failed to create evidence item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = evidenceTypes.find((t) => t.id === selectedTypeId);

  // Group evidence types by category
  const groupedTypes = evidenceTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, EvidenceType[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Evidence Item</DialogTitle>
            <DialogDescription>
              Add a compliance requirement to track for {currentFacility?.name || "your facility"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="evidence-type" className="text-foreground">
                Evidence Type <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger id="evidence-type">
                  <SelectValue placeholder="Select an evidence type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedTypes).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </div>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">{selectedType.description}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {selectedType.retention_days && (
                    <span>Retention: {selectedType.retention_days} days</span>
                  )}
                  {selectedType.recurrence_days && (
                    <span>Recurrence: every {selectedType.recurrence_days} days</span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="evidence-due-date" className="text-foreground">
                Next Due Date
              </Label>
              <Input
                id="evidence-due-date"
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence-notes" className="text-foreground">
                Notes
              </Label>
              <Textarea
                id="evidence-notes"
                placeholder="Add any notes about this evidence item..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
