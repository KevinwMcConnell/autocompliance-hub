import { useState } from "react";
import { useFacilities } from "@/hooks/useFacilities";
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
  AlertTriangle,
  Sparkles,
  Upload,
  Eye,
  Trash2,
} from "lucide-react";

// Mock data
const mockUploads = [
  {
    id: "1",
    name: "insurance_cert_2024.pdf",
    type: "application/pdf",
    size: 245000,
    uploadedAt: "2 hours ago",
    status: "needs_review" as const,
    classification: "General Liability Insurance",
    confidence: 85,
    extractedFields: {
      "Policy Number": "GL-2024-78432",
      "Effective Date": "Jan 1, 2024",
      "Expiration Date": "Jan 1, 2025",
      "Coverage Amount": "$1,000,000",
    },
  },
  {
    id: "2",
    name: "training_records.xlsx",
    type: "application/xlsx",
    size: 128000,
    uploadedAt: "Yesterday",
    status: "needs_review" as const,
    classification: "Employee Training Records",
    confidence: 72,
    extractedFields: {
      "Training Type": "Safety Training",
      "Date": "Dec 15, 2024",
      "Employees": "12",
    },
  },
  {
    id: "3",
    name: "lift_inspection_jan.pdf",
    type: "application/pdf",
    size: 512000,
    uploadedAt: "3 days ago",
    status: "processed" as const,
    classification: "Lift Equipment Certification",
    confidence: 95,
    extractedFields: {
      "Inspector": "SafetyFirst Inc.",
      "Inspection Date": "Jan 15, 2025",
      "Next Due": "Jan 15, 2026",
      "Result": "Pass",
    },
  },
  {
    id: "4",
    name: "fire_extinguisher_log.jpg",
    type: "image/jpeg",
    size: 1200000,
    uploadedAt: "5 days ago",
    status: "processed" as const,
    classification: "Fire Extinguisher Inspection",
    confidence: 88,
    extractedFields: {
      "Location": "Bay 1",
      "Inspection Date": "Jan 10, 2025",
      "Inspector": "John Smith",
    },
  },
];

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
  const { currentFacility } = useFacilities();
  const [activeTab, setActiveTab] = useState("needs_review");
  const [selectedUpload, setSelectedUpload] = useState<typeof mockUploads[0] | null>(null);

  const needsReview = mockUploads.filter((u) => u.status === "needs_review");
  const processed = mockUploads.filter((u) => u.status === "processed");

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected for upload:", files);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Inbox</h1>
        <p className="text-muted-foreground">
          Manage and classify uploaded documents for {currentFacility?.name || "your facility"}
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
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
              <Card
                key={upload.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedUpload(upload)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium truncate">{upload.name}</p>
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
                            <span className="text-sm font-medium">{upload.classification}</span>
                          </div>
                          <span className={`text-sm font-medium ${getConfidenceColor(upload.confidence)}`}>
                            {upload.confidence}% confidence
                          </span>
                        </div>
                        <Progress value={upload.confidence} className="h-1.5" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Select>
                          <SelectTrigger className="h-8 text-sm">
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
                        <Button size="sm" variant="default">
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
                  <h3 className="font-medium text-lg mb-1">All caught up!</h3>
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
                    <div className="p-2.5 rounded-lg bg-status-ok-muted">
                      <FileText className="h-5 w-5 text-status-ok" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium truncate">{upload.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(upload.size)} • Uploaded {upload.uploadedAt}
                          </p>
                        </div>
                        <StatusChip status="ok" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm">{upload.classification}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
