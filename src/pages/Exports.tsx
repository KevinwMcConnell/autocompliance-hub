import { useState, useEffect, useCallback } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { StatusChip } from "@/components/StatusChip";
import {
  FileOutput,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface EvidenceItem {
  id: string;
  status: string;
  last_received_at: string | null;
  next_due_at: string | null;
  evidence_type_id: string;
}

interface ExportPacket {
  id: string;
  name: string;
  created_at: string;
  status: string;
  included_evidence_ids: string[] | null;
}

export default function Exports() {
  const navigate = useNavigate();
  const { currentFacility } = useFacilities();
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [exportPackets, setExportPackets] = useState<ExportPacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!currentFacility?.id) {
      setEvidenceItems([]);
      setExportPackets([]);
      setLoading(false);
      return;
    }

    try {
      const [evidenceRes, packetsRes] = await Promise.all([
        supabase
          .from("evidence_items")
          .select("*")
          .eq("facility_id", currentFacility.id),
        supabase
          .from("export_packets")
          .select("*")
          .eq("facility_id", currentFacility.id)
          .order("created_at", { ascending: false }),
      ]);

      if (evidenceRes.error) throw evidenceRes.error;
      if (packetsRes.error) throw packetsRes.error;

      setEvidenceItems(evidenceRes.data || []);
      setExportPackets(packetsRes.data || []);
      
      // Auto-select "ok" items
      const okItems = (evidenceRes.data || []).filter(e => e.status === "ok").map(e => e.id);
      setSelectedItems(okItems);
    } catch (error) {
      console.error("Error fetching export data:", error);
      toast.error("Failed to load export data");
    } finally {
      setLoading(false);
    }
  }, [currentFacility?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusFromEvidence = (item: EvidenceItem): "ok" | "needs_review" | "due_soon" | "missing" | "overdue" => {
    if (item.status === "ok") return "ok";
    if (item.status === "needs_review") return "needs_review";
    if (item.status === "due_soon") return "due_soon";
    if (item.status === "overdue") return "overdue";
    return "missing";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const includedItems = evidenceItems.filter((e) => e.status === "ok");
  const problemItems = evidenceItems.filter((e) => e.status !== "ok");
  const readinessPercent = evidenceItems.length > 0 
    ? Math.round((includedItems.length / evidenceItems.length) * 100) 
    : 0;

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exports</h1>
          <p className="text-muted-foreground">Loading export data...</p>
        </div>
      </div>
    );
  }

  // Empty state when no evidence items
  if (evidenceItems.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exports</h1>
          <p className="text-muted-foreground">
            Generate inspection packets for {currentFacility?.name || "your facility"}
          </p>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <FileOutput className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No evidence to export</h3>
            <p className="text-muted-foreground mb-6">
              Upload compliance documents first to build your inspection packets.
            </p>
            <Button onClick={() => navigate("/uploads")} className="gap-2">
              <Upload className="h-4 w-4" />
              Go to Upload Inbox
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exports</h1>
          <p className="text-muted-foreground">
            Generate inspection packets for {currentFacility?.name || "your facility"}
          </p>
        </div>
        <Button size="lg" className="gap-2" disabled={selectedItems.length === 0}>
          <Download className="h-5 w-5" />
          Export Packet ({selectedItems.length} items)
        </Button>
      </div>

      {/* Readiness Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Packet Readiness</CardTitle>
          <CardDescription>
            {includedItems.length} of {evidenceItems.length} evidence items ready for export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={readinessPercent} className="flex-1 h-3" />
              <span className="text-lg font-bold">{readinessPercent}%</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-ok" />
                <span className="text-sm">{includedItems.length} Included</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-overdue" />
                <span className="text-sm">{problemItems.length} Needs Attention</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Selection */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Included Items */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-status-ok" />
              <CardTitle className="text-base font-medium">Included Evidence</CardTitle>
            </div>
            <CardDescription>Select items to include in export</CardDescription>
          </CardHeader>
          <CardContent>
            {includedItems.length > 0 ? (
              <div className="space-y-2">
                {includedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Evidence Item</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.last_received_at) ? `Updated ${formatDate(item.last_received_at)}` : "Never updated"}
                      </p>
                    </div>
                    <StatusChip status="ok" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No evidence items ready for export</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missing / Needs Attention */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-status-overdue" />
              <CardTitle className="text-base font-medium">Needs Attention</CardTitle>
            </div>
            <CardDescription>Items that cannot be included yet</CardDescription>
          </CardHeader>
          <CardContent>
            {problemItems.length > 0 ? (
              <div className="space-y-2">
                {problemItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="h-4 w-4" /> {/* Spacer for alignment */}
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Evidence Item</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.last_received_at) ? `Last updated ${formatDate(item.last_received_at)}` : "Never uploaded"}
                      </p>
                    </div>
                    <StatusChip status={getStatusFromEvidence(item)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">All evidence items are ready!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous Exports */}
      {exportPackets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Previous Exports</CardTitle>
                <CardDescription>Download previous inspection packets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportPackets.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileOutput className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{exp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(exp.created_at)} • {exp.included_evidence_ids?.length || 0} items
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
