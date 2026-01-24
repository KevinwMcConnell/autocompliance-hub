import { useState, useEffect, useCallback } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

interface EvidenceItem {
  id: string;
  status: string;
  last_received_at: string | null;
  next_due_at: string | null;
  evidence_type_id: string;
}

interface EvidenceType {
  id: string;
  name: string;
  category: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
}

interface Document {
  id: string;
  file_name: string;
  uploaded_at: string;
  needs_review: boolean;
  classification_confidence: number | null;
}

export default function Dashboard() {
  const { currentFacility } = useFacilities();
  const [evidenceItems, setEvidenceItems] = useState<(EvidenceItem & { evidence_type?: EvidenceType })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentFacility?.id) {
      setEvidenceItems([]);
      setTasks([]);
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      const [evidenceRes, typesRes, tasksRes, docsRes] = await Promise.all([
        supabase
          .from("evidence_items")
          .select("*")
          .eq("facility_id", currentFacility.id),
        supabase
          .from("evidence_types")
          .select("id, name, category"),
        supabase
          .from("tasks")
          .select("*")
          .eq("facility_id", currentFacility.id)
          .neq("status", "completed")
          .order("due_date", { ascending: true }),
        supabase
          .from("documents")
          .select("*")
          .eq("facility_id", currentFacility.id)
          .order("uploaded_at", { ascending: false }),
      ]);

      if (evidenceRes.error) throw evidenceRes.error;
      if (typesRes.error) throw typesRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (docsRes.error) throw docsRes.error;

      // Enrich evidence items with type info
      const enrichedItems = (evidenceRes.data || []).map((item) => ({
        ...item,
        evidence_type: typesRes.data?.find((t) => t.id === item.evidence_type_id),
      }));

      setEvidenceItems(enrichedItems);
      setTasks(tasksRes.data || []);
      setDocuments(docsRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [currentFacility?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected:", files);
    toast.success(`${files.length} file(s) ready for upload`);
  };

  // Calculate stats
  const missingEvidence = evidenceItems.filter(
    (e) => e.status === "missing" || e.status === "overdue"
  );

  const dueSoonItems = evidenceItems.filter((e) => e.status === "due_soon");

  const dueSoonTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const daysUntil = differenceInDays(new Date(t.due_date), new Date());
    return daysUntil >= 0 && daysUntil <= 7;
  });

  const needsReviewDocs = documents.filter((d) => d.needs_review);

  // Calculate readiness score
  const totalEvidence = evidenceItems.length;
  const okEvidence = evidenceItems.filter((e) => e.status === "ok").length;
  const readinessScore = totalEvidence > 0 ? Math.round((okEvidence / totalEvidence) * 100) : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilDue = (dueDate: string | null): number => {
    if (!dueDate) return 999;
    return differenceInDays(new Date(dueDate), new Date());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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

      {/* Top Row - Score + Primary Actions */}
      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        {/* Readiness Score Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Inspection Readiness</CardTitle>
            <CardDescription>Your overall compliance status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-4">
            <ReadinessScore score={readinessScore} />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              {totalEvidence > 0 ? (
                <>
                  {missingEvidence.length} items need attention before your next inspection
                </>
              ) : (
                <>Upload documents to see your readiness score</>
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
                        <p className="font-medium text-sm text-foreground">
                          {item.evidence_type?.name || "Unknown Item"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.evidence_type?.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <StatusChip status={item.status as any} />
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
                  {totalEvidence > 0 ? "All required items are uploaded!" : "No evidence items tracked yet"}
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
                      <p className="font-medium text-sm text-foreground">
                        {item.evidence_type?.name || "Unknown Item"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(item.next_due_at)}
                      </p>
                    </div>
                    <StatusChip status="due_soon" />
                  </div>
                ))}
                {dueSoonTasks.slice(0, 3).map((task) => {
                  const daysUntil = getDaysUntilDue(task.due_date);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(task.due_date)} ({daysUntil} days)
                        </p>
                      </div>
                      <StatusChip status={daysUntil <= 3 ? "due_soon" : "ok"} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No items due soon</p>
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
              {needsReviewDocs.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.classification_confidence && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(doc.classification_confidence * 100)}% confidence
                      </span>
                    )}
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
