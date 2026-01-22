import { useState } from "react";
import { useDemoData } from "@/hooks/useDemoData";
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

const evidenceTypes = [
  "Hazardous Waste Manifest",
  "Paint Booth Inspection",
  "Air Compressor Inspection",
  "Lift Equipment Certification",
  "Fire Suppression Inspection",
  "General Liability Insurance",
  "Workers Comp Insurance",
  "Business License",
  "Employee Training Records",
  "Fire Extinguisher Inspection",
];

export default function UploadInbox() {
  const { demoLoaded, documents, loadDemoData, updateDocument } = useDemoData();
  const [activeTab, setActiveTab] = useState("needs_review");

  const needsReview = documents.filter((u) => u.status === "needs_review");
  const processed = documents.filter((u) => u.status === "processed");

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected for upload:", files);
    toast.success(`${files.length} file(s) ready for upload`);
  };

  const handleApprove = (docId: string) => {
    updateDocument(docId, { status: "processed" });
    toast.success("Document approved and filed!");
  };

  const handleClassificationChange = (docId: string, classification: string) => {
    updateDocument(docId, { classification, confidence: 100 });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-status-ok";
    if (confidence >= 75) return "text-status-due-soon";
    return "text-status-overdue";
  };

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
      {demoLoaded ? (
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
              {needsReview.map((upload) => (
                <Card key={upload.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium truncate text-foreground">{upload.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(upload.size)} • Uploaded {upload.uploadedAt}
                            </p>
                          </div>
                          <StatusChip status="needs_review" />
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">{upload.classification}</span>
                            </div>
                            <span className={`text-sm font-medium ${getConfidenceColor(upload.confidence)}`}>
                              {upload.confidence}% confidence
                            </span>
                          </div>
                          <Progress value={upload.confidence} className="h-1.5" />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Select
                            value={upload.classification}
                            onValueChange={(v) => handleClassificationChange(upload.id, v)}
                          >
                            <SelectTrigger className="h-8 text-sm flex-1">
                              <SelectValue placeholder="Change classification" />
                            </SelectTrigger>
                            <SelectContent>
                              {evidenceTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => handleApprove(upload.id)}>
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
              {processed.map((upload) => (
                <Card key={upload.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-status-ok/10">
                        <FileText className="h-5 w-5 text-status-ok" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium truncate text-foreground">{upload.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(upload.size)} • Uploaded {upload.uploadedAt}
                            </p>
                          </div>
                          <StatusChip status="ok" />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">{upload.classification}</span>
                        </div>
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
