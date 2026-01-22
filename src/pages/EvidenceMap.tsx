import { useState, useMemo } from "react";
import { useDemoData } from "@/hooks/useDemoData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/StatusChip";
import { UploadDropzone } from "@/components/UploadDropzone";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Calendar, Clock, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DemoEvidenceItem } from "@/lib/demoData";

const mockDocuments = [
  { id: "1", name: "hazwaste_manifest_q4_2024.pdf", uploadedAt: "Dec 15, 2024", size: "245 KB" },
  { id: "2", name: "hazwaste_manifest_q3_2024.pdf", uploadedAt: "Sep 15, 2024", size: "238 KB" },
  { id: "3", name: "hazwaste_manifest_q2_2024.pdf", uploadedAt: "Jun 15, 2024", size: "251 KB" },
];

export default function EvidenceMap() {
  const { demoLoaded, evidenceItems, loadDemoData } = useDemoData();
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<DemoEvidenceItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set(evidenceItems.map((i) => i.category)))];
  }, [evidenceItems]);

  const filteredItems = useMemo(() => {
    return evidenceItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [evidenceItems, search, activeCategory]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, DemoEvidenceItem[]>);
  }, [filteredItems]);

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected:", files);
    toast.success(`${files.length} file(s) ready for upload`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Evidence Map</h1>
          <p className="text-muted-foreground">
            Track all compliance documents and their status
          </p>
        </div>
        {!demoLoaded && (
          <Button variant="outline" onClick={loadDemoData} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Load Demo Data
          </Button>
        )}
      </div>

      {/* Demo data notice */}
      {demoLoaded && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Viewing sample compliance data. Click any row to see details and upload documents.
          </p>
        </div>
      )}

      {/* Filters */}
      {demoLoaded && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search evidence items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-foreground"
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
      )}

      {/* Evidence Table */}
      {demoLoaded ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground font-semibold">Evidence Item</TableHead>
                  <TableHead className="text-foreground font-semibold">Status</TableHead>
                  <TableHead className="hidden md:table-cell text-foreground font-semibold">Last Received</TableHead>
                  <TableHead className="hidden lg:table-cell text-foreground font-semibold">Next Due</TableHead>
                  <TableHead className="hidden lg:table-cell text-foreground font-semibold">Retention</TableHead>
                  <TableHead className="text-right text-foreground font-semibold">Docs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedItems).map(([category, items]) => (
                  <>
                    <TableRow key={`cat-${category}`} className="bg-muted/30 hover:bg-muted/30">
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
                            <span className="font-medium text-foreground">{item.name}</span>
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
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No evidence items yet</h3>
            <p className="text-muted-foreground mb-4">
              Load demo data to see example compliance requirements
            </p>
            <Button onClick={loadDemoData} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Load Demo Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <StatusChip status={selectedItem.status} />
                </div>
                <SheetTitle className="text-foreground">{selectedItem.name}</SheetTitle>
                <SheetDescription>
                  {selectedItem.category} • {selectedItem.retention} retention
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Plain English Explanation */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">What is this?</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedItem.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Last Received
                    </div>
                    <p className="font-medium text-foreground">{selectedItem.lastReceived || "Never"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      Next Due
                    </div>
                    <p className="font-medium text-foreground">{selectedItem.nextDue || "Not set"}</p>
                  </div>
                </div>

                {/* Attached Documents */}
                <div>
                  <h4 className="font-medium mb-3 text-foreground">Attached Documents</h4>
                  {selectedItem.documents > 0 ? (
                    <div className="space-y-2">
                      {mockDocuments.slice(0, selectedItem.documents).map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{doc.name}</p>
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
                  <h4 className="font-medium mb-3 text-foreground">Upload New Document</h4>
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
