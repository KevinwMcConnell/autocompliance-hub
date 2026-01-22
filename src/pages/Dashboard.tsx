import { useFacilities } from "@/hooks/useFacilities";
import { useDemoData } from "@/hooks/useDemoData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReadinessScore } from "@/components/ReadinessScore";
import { StatusChip } from "@/components/StatusChip";
import { UploadDropzone } from "@/components/UploadDropzone";
import {
  FileOutput,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  ArrowRight,
  Upload,
  Sparkles,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Dashboard() {
  const { currentFacility } = useFacilities();
  const { demoLoaded, evidenceItems, tasks, documents, stats, loadDemoData } = useDemoData();

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected:", files);
    toast.success(`${files.length} file(s) ready for upload`);
  };

  const missingEvidence = demoLoaded 
    ? evidenceItems.filter(e => e.status === "missing" || e.status === "overdue")
    : [];
  
  const dueSoonItems = demoLoaded
    ? evidenceItems.filter(e => e.status === "due_soon")
    : [];

  const dueSoonTasks = demoLoaded
    ? tasks.filter(t => t.status === "pending" && t.daysUntilDue <= 7)
    : [];

  const needsReviewDocs = demoLoaded
    ? documents.filter(d => d.status === "needs_review")
    : [];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Compliance overview for {currentFacility?.name || "your facility"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          {!demoLoaded && (
            <Button variant="outline" onClick={loadDemoData} className="gap-2 w-full sm:w-auto">
              <Sparkles className="h-4 w-4" />
              Load Demo Data
            </Button>
          )}
          <Button variant="outline" className="gap-2 w-full sm:w-auto" asChild>
            <Link to="/uploads">
              <Upload className="h-4 w-4" />
              Upload Documents
            </Link>
          </Button>
          <Button className="gap-2 w-full sm:w-auto" asChild>
            <Link to="/exports">
              <FileOutput className="h-4 w-4" />
              Export Packet
            </Link>
          </Button>
        </div>
      </div>

      {/* Demo data notice */}
      {demoLoaded && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Demo data loaded</p>
            <p className="text-sm text-muted-foreground">
              You're viewing sample compliance data. Upload real documents to get started with your actual compliance tracking.
            </p>
          </div>
        </div>
      )}

      {/* Top Row - Score + Primary Actions */}
      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        {/* Readiness Score Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Inspection Readiness</CardTitle>
            <CardDescription>Your overall compliance status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <ReadinessScore score={stats?.readinessScore || 0} />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              {demoLoaded ? (
                <>
                  {stats?.missingEvidence.length || 0} items need attention before your next inspection
                </>
              ) : (
                <>Load demo data or upload documents to see your readiness score</>
              )}
            </p>
          </CardContent>
        </Card>

        {/* What's Missing */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4 text-status-overdue" />
                  What's Missing
                </CardTitle>
                <CardDescription>Required items not yet uploaded or overdue</CardDescription>
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
            {missingEvidence.length > 0 ? (
              <div className="space-y-2">
                {missingEvidence.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <StatusChip status={item.status} />
                  </div>
                ))}
                {missingEvidence.length > 4 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{missingEvidence.length - 4} more items
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {demoLoaded ? "All required items are uploaded!" : "Load demo data to see examples"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle Row - Due Soon + Upload */}
      <div className="grid gap-6 lg:grid-cols-2 min-w-0">
        {/* Due Soon */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-status-due-soon" />
                  Due Next 7 / 30 Days
                </CardTitle>
                <CardDescription>Upcoming compliance deadlines</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {dueSoonItems.length > 0 || dueSoonTasks.length > 0 ? (
              <div className="space-y-2">
                {dueSoonItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Due {item.nextDue}</p>
                    </div>
                    <StatusChip status="due_soon" />
                  </div>
                ))}
                {dueSoonTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Due {task.dueDate} ({task.daysUntilDue} days)</p>
                    </div>
                    <StatusChip status={task.daysUntilDue <= 3 ? "due_soon" : "ok"} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {demoLoaded ? "No items due soon" : "Load demo data to see examples"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dropzone */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Upload Documents</CardTitle>
            <CardDescription>Drop compliance documents here to get started</CardDescription>
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
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
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
          {needsReviewDocs.length > 0 ? (
            <div className="space-y-2">
              {needsReviewDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">Uploaded {doc.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {doc.confidence}% confidence
                    </span>
                    <StatusChip status="needs_review" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {demoLoaded ? "No documents awaiting review" : "Load demo data to see examples"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
