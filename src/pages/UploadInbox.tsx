import { useState, useEffect, useCallback } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDropzone } from "@/components/UploadDropzone";
import { StatusChip } from "@/components/StatusChip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  CheckCircle2,
  Upload,
  Eye,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
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

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected for upload:", files);
    toast.success(`${files.length} file(s) ready for upload`);
  };

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

  const handleClassificationChange = async (docId: string, classification: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          classification,
          classification_confidence: 1.0, // 100%
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
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2 text-foreground">
            <Upload className="h-4 w-4" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Drag and drop files here. We'll automatically classify them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadDropzone onFilesSelected={handleFilesSelected} maxFiles={10} />
        </CardContent>
      </Card>

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
                    <p className="text-muted-foreground">No documents need review right now.</p>
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
                          <StatusChip status="ok" />
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
            <p className="text-muted-foreground">
              Upload documents above to start processing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
