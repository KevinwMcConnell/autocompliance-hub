import { useState } from "react";
import { useFacilities } from "@/hooks/useFacilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip, StatusType } from "@/components/StatusChip";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDropzone } from "@/components/UploadDropzone";
import { Search, FileText, Upload, Calendar, Clock } from "lucide-react";

// Mock data
const mockEvidenceItems = [
  { id: "1", name: "Hazardous Waste Manifest", category: "Environmental", status: "ok" as StatusType, lastReceived: "Dec 15, 2024", nextDue: "Mar 15, 2025", retention: "3 years", documents: 3 },
  { id: "2", name: "Paint Booth Inspection", category: "Environmental", status: "due_soon" as StatusType, lastReceived: "Jan 20, 2024", nextDue: "Jan 27, 2025", retention: "1 year", documents: 2 },
  { id: "3", name: "Air Compressor Inspection", category: "Safety", status: "overdue" as StatusType, lastReceived: "Jan 10, 2024", nextDue: "Jan 10, 2025", retention: "1 year", documents: 1 },
  { id: "4", name: "Lift Equipment Certification", category: "Safety", status: "ok" as StatusType, lastReceived: "Nov 5, 2024", nextDue: "Nov 5, 2025", retention: "1 year", documents: 2 },
  { id: "5", name: "Fire Suppression Inspection", category: "Safety", status: "needs_review" as StatusType, lastReceived: "Jan 18, 2025", nextDue: "Jan 18, 2026", retention: "1 year", documents: 1 },
  { id: "6", name: "Business License", category: "Administrative", status: "ok" as StatusType, lastReceived: "Jul 1, 2024", nextDue: "Jul 1, 2025", retention: "1 year", documents: 1 },
  { id: "7", name: "Workers Comp Insurance", category: "Administrative", status: "ok" as StatusType, lastReceived: "Oct 1, 2024", nextDue: "Oct 1, 2025", retention: "1 year", documents: 1 },
  { id: "8", name: "SDS Binder", category: "Safety", status: "missing" as StatusType, lastReceived: null, nextDue: null, retention: "1 year", documents: 0 },
  { id: "9", name: "Employee Training Records", category: "Safety", status: "ok" as StatusType, lastReceived: "Dec 20, 2024", nextDue: "Dec 20, 2025", retention: "3 years", documents: 5 },
  { id: "10", name: "First Aid Kit Inspection", category: "Safety", status: "due_soon" as StatusType, lastReceived: "Dec 22, 2024", nextDue: "Jan 22, 2025", retention: "1 year", documents: 12 },
];

const mockDocuments = [
  { id: "1", name: "hazwaste_manifest_q4_2024.pdf", uploadedAt: "Dec 15, 2024", size: "245 KB" },
  { id: "2", name: "hazwaste_manifest_q3_2024.pdf", uploadedAt: "Sep 15, 2024", size: "238 KB" },
  { id: "3", name: "hazwaste_manifest_q2_2024.pdf", uploadedAt: "Jun 15, 2024", size: "251 KB" },
];

export default function EvidenceMap() {
  const { currentFacility } = useFacilities();
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<typeof mockEvidenceItems[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = ["all", ...Array.from(new Set(mockEvidenceItems.map((i) => i.category)))];

  const filteredItems = mockEvidenceItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof mockEvidenceItems>);

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected:", files);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Evidence Map</h1>
        <p className="text-muted-foreground">
          Track compliance documents for {currentFacility?.name || "your facility"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search evidence items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
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

      {/* Evidence Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evidence Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Received</TableHead>
                <TableHead className="hidden lg:table-cell">Next Due</TableHead>
                <TableHead className="hidden lg:table-cell">Retention</TableHead>
                <TableHead className="text-right">Docs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedItems).map(([category, items]) => (
                <>
                  <TableRow key={category} className="bg-muted/30 hover:bg-muted/30">
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
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={item.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {item.lastReceived || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {item.nextDue || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {item.retention}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{item.documents}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <StatusChip status={selectedItem.status} />
                </div>
                <SheetTitle>{selectedItem.name}</SheetTitle>
                <SheetDescription>
                  {selectedItem.category} • {selectedItem.retention} retention
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Key Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Last Received
                    </div>
                    <p className="font-medium">{selectedItem.lastReceived || "Never"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      Next Due
                    </div>
                    <p className="font-medium">{selectedItem.nextDue || "Not set"}</p>
                  </div>
                </div>

                {/* Attached Documents */}
                <div>
                  <h4 className="font-medium mb-3">Attached Documents</h4>
                  {mockDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {mockDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.uploadedAt} • {doc.size}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
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
                  <h4 className="font-medium mb-3">Upload New Document</h4>
                  <UploadDropzone onFilesSelected={handleFilesSelected} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
