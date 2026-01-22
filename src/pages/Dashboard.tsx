import { useFacilities } from "@/hooks/useFacilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReadinessScore } from "@/components/ReadinessScore";
import { StatusChip, StatusType } from "@/components/StatusChip";
import { UploadDropzone } from "@/components/UploadDropzone";
import {
  FileOutput,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for demonstration
const mockMissingEvidence = [
  { id: "1", name: "Hazardous Waste Manifest", category: "Environmental" },
  { id: "2", name: "Air Compressor Inspection", category: "Safety" },
  { id: "3", name: "Fire Extinguisher Inspection", category: "Safety" },
];

const mockDueSoon = [
  { id: "1", name: "Lift Equipment Certification", dueDate: "Jan 28, 2024", days: 6 },
  { id: "2", name: "First Aid Kit Inspection", dueDate: "Jan 25, 2024", days: 3 },
  { id: "3", name: "Eye Wash Station Test", dueDate: "Jan 29, 2024", days: 7 },
];

const mockNeedsReview = [
  { id: "1", name: "insurance_cert_2024.pdf", uploadedAt: "2 hours ago", confidence: 85 },
  { id: "2", name: "training_records.xlsx", uploadedAt: "Yesterday", confidence: 72 },
];

export default function Dashboard() {
  const { currentFacility } = useFacilities();

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected:", files);
    // TODO: Implement file upload
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Compliance overview for {currentFacility?.name || "your facility"}
          </p>
        </div>
        <Button size="lg" className="gap-2" asChild>
          <Link to="/exports">
            <FileOutput className="h-5 w-5" />
            Export Inspection Packet
          </Link>
        </Button>
      </div>

      {/* Top Row - Score + Missing Evidence */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Readiness Score Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Readiness Score</CardTitle>
            <CardDescription>Overall compliance status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <ReadinessScore score={73} />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              3 items need attention before your next inspection
            </p>
          </CardContent>
        </Card>

        {/* Missing Evidence */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-status-overdue" />
                  Missing Evidence
                </CardTitle>
                <CardDescription>Required items not yet uploaded</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/evidence">
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockMissingEvidence.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <StatusChip status="missing" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row - Due Soon + Upload */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Due Soon */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-status-due-soon" />
                  Due Next 7 Days
                </CardTitle>
                <CardDescription>Upcoming compliance deadlines</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockDueSoon.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Due {item.dueDate}</p>
                  </div>
                  <StatusChip status="due_soon" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upload Dropzone */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Quick Upload</CardTitle>
            <CardDescription>Drop compliance documents here</CardDescription>
          </CardHeader>
          <CardContent>
            <UploadDropzone onFilesSelected={handleFilesSelected} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Needs Review */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-status-needs-review" />
                Needs Review
              </CardTitle>
              <CardDescription>Uploaded documents awaiting classification</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/uploads">
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mockNeedsReview.length > 0 ? (
            <div className="space-y-2">
              {mockNeedsReview.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Uploaded {item.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {item.confidence}% confidence
                    </span>
                    <StatusChip status="needs_review" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents awaiting review</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
