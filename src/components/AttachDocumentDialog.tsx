import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, FileText, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentWithEvidence {
  id: string;
  file_name: string;
  uploaded_at: string;
  classification: string | null;
  needs_review: boolean | null;
  evidence_item_id: string | null;
  evidence_item_name?: string | null;
}

interface AttachDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  evidenceItemId: string;
  evidenceItemName: string;
  onAttachComplete: () => void;
}

export function AttachDocumentDialog({
  open,
  onOpenChange,
  facilityId,
  evidenceItemId,
  evidenceItemName,
  onAttachComplete,
}: AttachDocumentDialogProps) {
  const [documents, setDocuments] = useState<DocumentWithEvidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [attaching, setAttaching] = useState(false);

  // Fetch all facility documents when dialog opens
  const fetchDocuments = async () => {
    if (!facilityId) return;
    
    setLoading(true);
    try {
      // Fetch documents with their linked evidence item info
      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select(`
          id,
          file_name,
          uploaded_at,
          classification,
          needs_review,
          evidence_item_id
        `)
        .eq("facility_id", facilityId)
        .order("uploaded_at", { ascending: false });

      if (docsError) throw docsError;

      // Get evidence items to map names
      const { data: evidenceItems, error: eiError } = await supabase
        .from("evidence_items")
        .select("id, evidence_type_id")
        .eq("facility_id", facilityId);

      if (eiError) throw eiError;

      // Get evidence types for names
      const { data: evidenceTypes, error: etError } = await supabase
        .from("evidence_types")
        .select("id, name");

      if (etError) throw etError;

      // Build a map of evidence_item_id -> name
      const itemNameMap: Record<string, string> = {};
      (evidenceItems || []).forEach((item) => {
        const typeName = evidenceTypes?.find((t) => t.id === item.evidence_type_id)?.name;
        if (typeName) {
          itemNameMap[item.id] = typeName;
        }
      });

      // Enrich documents with evidence item names
      const enrichedDocs = (docs || []).map((doc) => ({
        ...doc,
        evidence_item_name: doc.evidence_item_id ? itemNameMap[doc.evidence_item_id] || null : null,
      }));

      setDocuments(enrichedDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on open
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSearch("");
      setSelectedIds(new Set());
      fetchDocuments();
    }
    onOpenChange(newOpen);
  };

  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return documents;
    const lowerSearch = search.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.file_name.toLowerCase().includes(lowerSearch) ||
        doc.classification?.toLowerCase().includes(lowerSearch) ||
        doc.evidence_item_name?.toLowerCase().includes(lowerSearch)
    );
  }, [documents, search]);

  const toggleSelection = (docId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const handleAttach = async () => {
    if (selectedIds.size === 0) return;

    setAttaching(true);
    try {
      const idsArray = Array.from(selectedIds);
      
      const { error } = await supabase
        .from("documents")
        .update({ evidence_item_id: evidenceItemId })
        .in("id", idsArray);

      if (error) throw error;

      toast.success(`${idsArray.length} document(s) attached`);
      onOpenChange(false);
      onAttachComplete();
    } catch (error) {
      console.error("Error attaching documents:", error);
      toast.error("Failed to attach documents");
    } finally {
      setAttaching(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Attach Existing Documents</DialogTitle>
          <DialogDescription>
            Select documents to attach to "{evidenceItemName}"
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name, classification, or linked item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Documents Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-50" />
              <p>{documents.length === 0 ? "No documents in this facility" : "No documents match your search"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                  <TableHead className="hidden md:table-cell">Classification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Currently Linked To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer"
                    onClick={() => toggleSelection(doc.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(doc.id)}
                        onCheckedChange={() => toggleSelection(doc.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">{doc.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(doc.uploaded_at)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {doc.classification || "—"}
                    </TableCell>
                    <TableCell>
                      {doc.needs_review ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-500">
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Approved</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {doc.evidence_item_name ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{doc.evidence_item_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedIds.size > 0 && `${selectedIds.size} document(s) selected`}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={attaching}>
            Cancel
          </Button>
          <Button onClick={handleAttach} disabled={selectedIds.size === 0 || attaching}>
            {attaching ? "Attaching..." : `Attach ${selectedIds.size > 0 ? `(${selectedIds.size})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
