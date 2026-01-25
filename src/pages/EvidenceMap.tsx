import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/StatusChip";
import { UploadDialog } from "@/components/UploadDialog";
import { AddEvidenceDialog } from "@/components/AddEvidenceDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, FileText, Calendar, Clock, Info, Upload, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EvidenceType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  retention_days: number | null;
  recurrence_days: number | null;
}

interface EvidenceItem {
  id: string;
  facility_id: string;
  evidence_type_id: string;
  status: string;
  last_received_at: string | null;
  next_due_at: string | null;
  notes: string | null;
  evidence_type?: EvidenceType;
}

interface Document {
  id: string;
  file_name: string;
  uploaded_at: string;
  file_size: number;
  storage_path: string;
  evidence_item_id: string | null;
  needs_review: boolean;
}

export default function EvidenceMap() {
  const navigate = useNavigate();
  const { currentFacility } = useFacilities();
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [addEvidenceOpen, setAddEvidenceOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentFacility?.id) {
      setEvidenceItems([]);
      setEvidenceTypes([]);
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      const [itemsRes, typesRes, docsRes] = await Promise.all([
        supabase
          .from("evidence_items")
          .select("*")
          .eq("facility_id", currentFacility.id),
        supabase
          .from("evidence_types")
          .select("*"),
        supabase
          .from("documents")
          .select("id, file_name, uploaded_at, file_size, evidence_item_id, storage_path, needs_review")
          .eq("facility_id", currentFacility.id),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (typesRes.error) throw typesRes.error;
      if (docsRes.error) throw docsRes.error;

      setEvidenceTypes(typesRes.data || []);
      setDocuments(docsRes.data || []);

      // Enrich evidence items with their type info
      const enrichedItems = (itemsRes.data || []).map((item) => ({
        ...item,
        evidence_type: typesRes.data?.find((t) => t.id === item.evidence_type_id),
      }));
      setEvidenceItems(enrichedItems);
    } catch (error) {
      console.error("Error fetching evidence data:", error);
      toast.error("Failed to load evidence data");
    } finally {
      setLoading(false);
    }
  }, [currentFacility?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = useMemo(() => {
    const cats = new Set(evidenceItems.map((i) => i.evidence_type?.category || "Uncategorized"));
    return ["all", ...Array.from(cats)];
  }, [evidenceItems]);

  const filteredItems = useMemo(() => {
    return evidenceItems.filter((item) => {
      const name = item.evidence_type?.name || "";
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || item.evidence_type?.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [evidenceItems, search, activeCategory]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const cat = item.evidence_type?.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, EvidenceItem[]>);
  }, [filteredItems]);

  const getDocCountForItem = (itemId: string) => {
    return documents.filter((d) => d.evidence_item_id === itemId).length;
  };

  const getApprovedDocCountForItem = (itemId: string) => {
    return documents.filter((d) => d.evidence_item_id === itemId && !d.needs_review).length;
  };

  const getPendingDocCountForItem = (itemId: string) => {
    return documents.filter((d) => d.evidence_item_id === itemId && d.needs_review).length;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRetention = (days: number | null | undefined) => {
    if (!days) return "—";
    if (days >= 365) return `${Math.round(days / 365)} year${days >= 730 ? "s" : ""}`;
    return `${days} days`;
  };

  const handleViewDocument = async (storagePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("compliance-documents")
        .createSignedUrl(storagePath, 60 * 60); // 1 hour expiry

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Error getting document URL:", error);
      toast.error("Failed to open document");
    }
  };

  // Recompute evidence item status based on linked documents
  const recomputeEvidenceItemStatus = async (evidenceItemId: string) => {
    try {
      // Fetch all documents linked to this evidence item
      const { data: linkedDocs, error: docsError } = await supabase
        .from("documents")
        .select("id, uploaded_at, needs_review")
        .eq("evidence_item_id", evidenceItemId);

      if (docsError) throw docsError;

      const approvedDocs = (linkedDocs || []).filter((d) => !d.needs_review);
      const pendingDocs = (linkedDocs || []).filter((d) => d.needs_review);

      let newStatus: string;
      let lastReceivedAt: string | null = null;
      let nextDueAt: string | null = null;

      if (approvedDocs.length > 0) {
        // Has approved docs -> status OK
        newStatus = "ok";
        // Find most recent approved doc upload date
        const sortedApproved = approvedDocs.sort(
          (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );
        lastReceivedAt = sortedApproved[0].uploaded_at;

        // Get the evidence item to find recurrence_days from evidence type
        const item = evidenceItems.find((i) => i.id === evidenceItemId);
        const recurrenceDays = item?.evidence_type?.recurrence_days;
        
        if (recurrenceDays && recurrenceDays > 0) {
          const nextDue = new Date(lastReceivedAt);
          nextDue.setDate(nextDue.getDate() + recurrenceDays);
          nextDueAt = nextDue.toISOString();
        }
      } else if (pendingDocs.length > 0) {
        // Has docs but all need review
        newStatus = "needs_review";
      } else {
        // No docs at all
        newStatus = "missing";
      }

      // Update evidence item
      const updateData: Record<string, any> = {
        status: newStatus,
        last_received_at: lastReceivedAt,
      };
      if (nextDueAt) {
        updateData.next_due_at = nextDueAt;
      }

      const { error: updateError } = await supabase
        .from("evidence_items")
        .update(updateData)
        .eq("id", evidenceItemId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error recomputing evidence item status:", error);
      // Don't throw - we still want to continue with refresh
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    // Get the evidence_item_id before deleting
    const docToDelete = documents.find((d) => d.id === documentToDelete.id);
    const linkedEvidenceItemId = docToDelete?.evidence_item_id;

    setIsDeleting(true);
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from("compliance-documents")
        .remove([documentToDelete.storage_path]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // Continue with DB deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (dbError) throw dbError;

      // Recompute evidence item status if doc was linked
      if (linkedEvidenceItemId) {
        await recomputeEvidenceItemStatus(linkedEvidenceItemId);
      }

      toast.success("Document deleted");
      setDocumentToDelete(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusFromItem = (item: EvidenceItem): "ok" | "needs_review" | "due_soon" | "missing" | "overdue" => {
    if (item.status === "ok") return "ok";
    if (item.status === "needs_review") return "needs_review";
    if (item.status === "due_soon") return "due_soon";
    if (item.status === "overdue") return "overdue";
    return "missing";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Evidence Map</h1>
          <p className="text-muted-foreground">Loading evidence data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Evidence Map</h1>
          <p className="text-muted-foreground">
            Track all compliance documents and their status
          </p>
        </div>
        {evidenceItems.length > 0 && (
          <Button onClick={() => setAddEvidenceOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Evidence Item
          </Button>
        )}
      </div>

      {/* Filters */}
      {evidenceItems.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search evidence items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-foreground"
            />
          </div>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList>
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="capitalize">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Evidence Table or Empty State */}
      {evidenceItems.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground font-semibold">Evidence Item</TableHead>
                  <TableHead className="text-foreground font-semibold">Status</TableHead>
                  <TableHead className="hidden md:table-cell text-foreground font-semibold">Last Received</TableHead>
                  <TableHead className="hidden lg:table-cell text-foreground font-semibold">Next Due</TableHead>
                  <TableHead className="hidden lg:table-cell text-foreground font-semibold">Retention</TableHead>
                  <TableHead className="text-right text-foreground font-semibold">Docs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedItems).map(([category, items]) => (
                  <>
                    <TableRow key={`cat-${category}`} className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={6} className="py-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {category}
                        </span>
                      </TableCell>
                    </TableRow>
                    {items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedItem(item)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {item.evidence_type?.name || "Unknown Type"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={getStatusFromItem(item)} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(item.last_received_at) || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatDate(item.next_due_at) || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatRetention(item.evidence_type?.retention_days)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Badge variant="secondary">{getApprovedDocCountForItem(item.id)}</Badge>
                            {getPendingDocCountForItem(item.id) > 0 && (
                              <Badge variant="outline" className="text-amber-600 border-amber-600/50">
                                +{getPendingDocCountForItem(item.id)} pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No evidence items yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload compliance documents or create an evidence item to start tracking your requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/uploads")} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Documents
              </Button>
              <Button variant="outline" onClick={() => setAddEvidenceOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Evidence Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Evidence Dialog */}
      <AddEvidenceDialog
        open={addEvidenceOpen}
        onOpenChange={setAddEvidenceOpen}
        onEvidenceCreated={fetchData}
      />

      {/* Detail Drawer */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <StatusChip status={getStatusFromItem(selectedItem)} />
                </div>
                <SheetTitle className="text-foreground">
                  {selectedItem.evidence_type?.name || "Evidence Item"}
                </SheetTitle>
                <SheetDescription>
                  {selectedItem.evidence_type?.category || "Uncategorized"} •{" "}
                  {formatRetention(selectedItem.evidence_type?.retention_days)} retention
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Plain English Explanation */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">What is this?</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedItem.evidence_type?.description || "No description available."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Last Received
                    </div>
                    <p className="font-medium text-foreground">
                      {formatDate(selectedItem.last_received_at) || "Never"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      Next Due
                    </div>
                    <p className="font-medium text-foreground">
                      {formatDate(selectedItem.next_due_at) || "Not set"}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {selectedItem.notes && (
                  <div>
                    <h4 className="font-medium mb-2 text-foreground">Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedItem.notes}
                    </p>
                  </div>
                )}

                {/* Attached Documents */}
                <div>
                  <h4 className="font-medium mb-3 text-foreground">Attached Documents</h4>
                  {getDocCountForItem(selectedItem.id) > 0 ? (
                    <div className="space-y-2">
                      {documents
                        .filter((d) => d.evidence_item_id === selectedItem.id)
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className={`flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                              doc.needs_review ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-primary" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                                  {doc.needs_review && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-500 text-xs">
                                      Pending Review
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(doc.uploaded_at)} •{" "}
                                  {Math.round(doc.file_size / 1024)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewDocument(doc.storage_path)}
                              >
                                View
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDocumentToDelete(doc)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No documents attached</p>
                    </div>
                  )}
                </div>

                {/* Upload New */}
                <div>
                  <h4 className="font-medium mb-3 text-foreground">Upload New Document</h4>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Upload Dialog - linked to selected evidence item when opened from drawer */}
      {currentFacility && (
        <UploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          facilityId={currentFacility.id}
          evidenceItemId={selectedItem?.id}
          evidenceTypeRecurrenceDays={selectedItem?.evidence_type?.recurrence_days ?? undefined}
          onUploadComplete={fetchData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
