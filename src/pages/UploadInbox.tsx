import { useState, useEffect, useCallback } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDialog } from "@/components/UploadDialog";
import { StatusChip } from "@/components/StatusChip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  FileText,
  CheckCircle2,
  Upload,
  Eye,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploaded_at: string;
  classification: string | null;
  classification_confidence: number | null;
  needs_review: boolean;
  reviewed_at: string | null;
  evidence_item_id: string | null;
}

interface EvidenceType {
  id: string;
  name: string;
  category: string;
}

export default function UploadInbox() {
  const { currentFacility } = useFacilities();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("needs_review");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentFacility?.id) {
      setDocuments([]);
      setEvidenceTypes([]);
      setLoading(false);
      return;
    }

    try {
      const [docsRes, typesRes] = await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .eq("facility_id", currentFacility.id)
          .order("uploaded_at", { ascending: false }),
        supabase
          .from("evidence_types")
          .select("id, name, category")
          .order("category", { ascending: true }),
      ]);

      if (docsRes.error) throw docsRes.error;
      if (typesRes.error) throw typesRes.error;

      setDocuments(docsRes.data || []);
      setEvidenceTypes(typesRes.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [currentFacility?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const needsReview = documents.filter((d) => d.needs_review);
  const processed = documents.filter((d) => !d.needs_review);

  const handleApprove = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          needs_review: false,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", docId);

      if (error) throw error;

      toast.success("Document approved and filed!");
      fetchData();
    } catch (error) {
      console.error("Error approving document:", error);
      toast.error("Failed to approve document");
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    setIsDeleting(true);

    try {
      // Step 1: Delete file from storage
      const { error: storageError } = await supabase.storage
        .from("compliance-documents")
        .remove([documentToDelete.storage_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue to delete DB record even if storage fails
      }

      // Step 2: Delete database record
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (dbError) throw dbError;

      // Step 3: Recompute linked evidence item status if applicable
      if (documentToDelete.evidence_item_id) {
        const { data: remainingDocs } = await supabase
          .from("documents")
          .select("uploaded_at")
          .eq("evidence_item_id", documentToDelete.evidence_item_id);

        if (remainingDocs && remainingDocs.length > 0) {
          const lastReceived = remainingDocs.reduce((latest, doc) =>
            doc.uploaded_at > latest ? doc.uploaded_at : latest,
            remainingDocs[0].uploaded_at
          );
          await supabase
            .from("evidence_items")
            .update({
              status: "ok",
              last_received_at: lastReceived,
            })
            .eq("id", documentToDelete.evidence_item_id);
        } else {
          await supabase
            .from("evidence_items")
            .update({
              status: "missing",
              last_received_at: null,
            })
            .eq("id", documentToDelete.evidence_item_id);
        }
      }

      toast.success("Document deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
    }
  };

  const handleClassificationChange = async (docId: string, classification: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          classification,
          classification_confidence: 1.0,
        })
        .eq("id", docId);

      if (error) throw error;

      toast.success("Classification updated");
      fetchData();
    } catch (error) {
      console.error("Error updating classification:", error);
      toast.error("Failed to update classification");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return "text-muted-foreground";
    const pct = Math.round(confidence * 100);
    if (pct >= 90) return "text-status-ok";
    if (pct >= 75) return "text-status-due-soon";
    return "text-status-overdue";
  };

  const getConfidencePercent = (confidence: number | null) => {
    if (!confidence) return 0;
    return Math.round(confidence * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Upload Inbox</h1>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Upload Inbox</h1>
          <p className="text-muted-foreground">
            Manage and classify uploaded documents
          </p>
        </div>
        <Button className="gap-2" onClick={() => setUploadDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      {/* Document List */}
      {documents.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="needs_review" className="gap-2">
              <Eye className="h-4 w-4" />
              Needs Review
              {needsReview.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {needsReview.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Processed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="needs_review" className="mt-4">
            <div className="grid gap-4">
              {needsReview.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium truncate text-foreground">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(doc.file_size)} • Uploaded {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                          <StatusChip status="needs_review" />
                        </div>
                        {doc.classification && (
                          <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">{doc.classification}</span>
                              </div>
                              <span className={`text-sm font-medium ${getConfidenceColor(doc.classification_confidence)}`}>
                                {getConfidencePercent(doc.classification_confidence)}% confidence
                              </span>
                            </div>
                            <Progress value={getConfidencePercent(doc.classification_confidence)} className="h-1.5" />
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          <Select
                            value={doc.classification || ""}
                            onValueChange={(v) => handleClassificationChange(doc.id, v)}
                          >
                            <SelectTrigger className="h-8 text-sm flex-1">
                              <SelectValue placeholder="Select classification" />
                            </SelectTrigger>
                            <SelectContent>
                              {evidenceTypes.map((type) => (
                                <SelectItem key={type.id} value={type.name}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => handleApprove(doc.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDocumentToDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {needsReview.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-status-ok opacity-50" />
                    <h3 className="font-medium text-lg mb-1 text-foreground">All caught up!</h3>
                     <p className="text-muted-foreground">
                       No documents need review right now — you can still upload more anytime.
                     </p>
                     <Button
                       variant="outline"
                       className="mt-4 gap-2"
                       onClick={() => setUploadDialogOpen(true)}
                     >
                       <Upload className="h-4 w-4" />
                       Upload more documents
                     </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="processed" className="mt-4">
            <div className="grid gap-4">
              {processed.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-status-ok/10">
                        <FileText className="h-5 w-5 text-status-ok" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium truncate text-foreground">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(doc.file_size)} • Uploaded {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              onClick={() => setDocumentToDelete(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <StatusChip status="ok" />
                          </div>
                        </div>
                        {doc.classification && (
                          <div className="mt-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm text-foreground">{doc.classification}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {processed.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No processed documents yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload compliance documents to get started.
            </p>
            <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{documentToDelete?.file_name}"? This action cannot be undone.
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

      {/* Upload Dialog */}
      {currentFacility && (
        <UploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          facilityId={currentFacility.id}
          onUploadComplete={fetchData}
        />
      )}
    </div>
  );
}