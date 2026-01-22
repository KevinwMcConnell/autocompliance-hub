import { useState } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { StatusChip } from "@/components/StatusChip";
import {
  FileOutput,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";

// Mock data
const mockEvidenceForExport = [
  { id: "1", name: "Business License", status: "included" as const, lastUpdated: "Jul 1, 2024" },
  { id: "2", name: "General Liability Insurance", status: "included" as const, lastUpdated: "Oct 1, 2024" },
  { id: "3", name: "Workers Comp Insurance", status: "included" as const, lastUpdated: "Oct 1, 2024" },
  { id: "4", name: "Hazardous Waste Manifest", status: "included" as const, lastUpdated: "Dec 15, 2024" },
  { id: "5", name: "Lift Equipment Certification", status: "included" as const, lastUpdated: "Nov 5, 2024" },
  { id: "6", name: "Fire Suppression Inspection", status: "needs_review" as const, lastUpdated: "Jan 18, 2025" },
  { id: "7", name: "Employee Training Records", status: "included" as const, lastUpdated: "Dec 20, 2024" },
  { id: "8", name: "Air Compressor Inspection", status: "missing" as const, lastUpdated: null },
  { id: "9", name: "Paint Booth Inspection", status: "due_soon" as const, lastUpdated: "Jan 20, 2024" },
  { id: "10", name: "SDS Binder", status: "missing" as const, lastUpdated: null },
];

const previousExports = [
  { id: "1", name: "Inspection Packet - Q4 2024", createdAt: "Dec 31, 2024", itemCount: 12 },
  { id: "2", name: "Inspection Packet - Q3 2024", createdAt: "Sep 30, 2024", itemCount: 11 },
  { id: "3", name: "Inspection Packet - EPA Audit", createdAt: "Aug 15, 2024", itemCount: 8 },
];

export default function Exports() {
  const { currentFacility } = useFacilities();
  const [selectedItems, setSelectedItems] = useState<string[]>(
    mockEvidenceForExport
      .filter((e) => e.status === "included")
      .map((e) => e.id)
  );

  const included = mockEvidenceForExport.filter((e) => e.status === "included");
  const missing = mockEvidenceForExport.filter((e) => e.status === "missing" || e.status === "due_soon");
  const needsReview = mockEvidenceForExport.filter((e) => e.status === "needs_review");
  const readinessPercent = Math.round((included.length / mockEvidenceForExport.length) * 100);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
            {included.length} of {mockEvidenceForExport.length} evidence items ready for export
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
                <span className="text-sm">{included.length} Included</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-needs-review" />
                <span className="text-sm">{needsReview.length} Needs Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-status-overdue" />
                <span className="text-sm">{missing.length} Missing</span>
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
            <div className="space-y-2">
              {mockEvidenceForExport
                .filter((e) => e.status === "included")
                .map((item) => (
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
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {item.lastUpdated}
                      </p>
                    </div>
                    <StatusChip status="ok" />
                  </div>
                ))}
            </div>
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
            <div className="space-y-2">
              {mockEvidenceForExport
                .filter((e) => e.status !== "included")
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="h-4 w-4" /> {/* Spacer for alignment */}
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.lastUpdated ? `Last updated ${item.lastUpdated}` : "Never uploaded"}
                      </p>
                    </div>
                    <StatusChip
                      status={
                        item.status === "needs_review"
                          ? "needs_review"
                          : item.status === "due_soon"
                          ? "due_soon"
                          : "missing"
                      }
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previous Exports */}
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
            {previousExports.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileOutput className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{exp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.createdAt} • {exp.itemCount} items
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
    </div>
  );
}
