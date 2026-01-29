import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  evidenceItemId?: string;
  evidenceTypeRecurrenceDays?: number;
  onUploadComplete?: () => void;
}

interface FileWithStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  documentId?: string;
}

// Tablet/iOS-friendly accept attribute - include extensions AND MIME types
// iOS Safari is inconsistent with MIME types, so extensions are essential
const ACCEPT_ATTRIBUTE = ".pdf,application/pdf,image/*,.png,.jpg,.jpeg,.heic,.heif,.docx,.xlsx,.zip";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

// Format file size for error messages
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Check if file is accepted - use BOTH MIME and extension for tablet compatibility
const isAcceptedFile = (file: File): boolean => {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  // Check by extension first (more reliable on tablets/iOS)
  if (name.endsWith(".pdf")) return true;
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")) return true;
  if (name.endsWith(".heic") || name.endsWith(".heif")) return true;
  if (name.endsWith(".docx")) return true;
  if (name.endsWith(".xlsx")) return true;
  if (name.endsWith(".zip")) return true;

  // Fallback to MIME type if extension check didn't match
  if (type) {
    if (type === "application/pdf" || type === "application/x-pdf") return true;
    if (type.startsWith("image/")) return true;
    if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return true;
    if (type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return true;
    if (type === "application/zip") return true;
  }

  return false;
};

export function UploadDialog({
  open,
  onOpenChange,
  facilityId,
  evidenceItemId,
  evidenceTypeRecurrenceDays,
  onUploadComplete,
}: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastPickRef = useRef<{ sig: string; ts: number }>({ sig: "", ts: 0 });
  
  // Ref to file input for iOS compatibility (reset before each pick)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset file input value - critical for iOS to allow selecting same file twice
  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Reset all state - called on close/cancel
  const resetState = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setFiles([]);
    setIsDragging(false);
    setIsUploading(false);
    setApprovingIndex(null);
    resetFileInput();
  }, [resetFileInput]);

  // Handle dialog close (X button or backdrop click)
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetState();
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, resetState]
  );

  // Also reset input whenever the dialog opens (prevents stale picker state on iOS)
  useEffect(() => {
    if (open) resetFileInput();
  }, [open, resetFileInput]);

  // Validate and add files with detailed error messages
  const addFiles = useCallback((newFiles: File[]) => {
    const valid: File[] = [];

    for (const file of newFiles) {
      // Check file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          `"${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is 20MB.`
        );
        continue;
      }

      // Check file type with detailed error
      if (!isAcceptedFile(file)) {
        const typeInfo = file.type ? ` (type: ${file.type})` : " (no type detected)";
        toast.error(
          `"${file.name}"${typeInfo} is not an accepted file type. Accepted: PDF, JPG, PNG, HEIC, DOCX, XLSX, ZIP.`
        );
        continue;
      }

      valid.push(file);
    }

    if (valid.length === 0) return;

    const filesWithStatus: FileWithStatus[] = valid.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...filesWithStatus].slice(0, 10));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files).slice(0, 10);
      addFiles(droppedFiles);
    },
    [addFiles]
  );

  // Handle file input change - reset input value after reading files
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const fileList = (input as HTMLInputElement).files;
      const selectedFiles = Array.from(fileList || []).slice(0, 10);

      // De-dupe (some browsers can fire both input + change)
      const sig = selectedFiles.map((f) => `${f.name}:${f.size}`).join("|");
      const now = Date.now();
      if (sig && lastPickRef.current.sig === sig && now - lastPickRef.current.ts < 1000) {
        (input as HTMLInputElement).value = "";
        return;
      }
      lastPickRef.current = { sig, ts: now };

      // Debug toast - remove after confirming fix works
      toast.info(`Picked ${selectedFiles.length} file(s)`);

      addFiles(selectedFiles);

      // Reset input immediately so same file can be selected again (iOS fix)
      (input as HTMLInputElement).value = "";
    },
    [addFiles]
  );

  // Native event listener fallback (iOS Safari can be flaky with React synthetic events)
  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;

    const handler = () => {
      const selectedFiles = Array.from(input.files || []).slice(0, 10);
      const sig = selectedFiles.map((f) => `${f.name}:${f.size}`).join("|");
      const now = Date.now();
      if (sig && lastPickRef.current.sig === sig && now - lastPickRef.current.ts < 1000) {
        input.value = "";
        return;
      }
      lastPickRef.current = { sig, ts: now };

      toast.info(`Picked ${selectedFiles.length} file(s)`);
      addFiles(selectedFiles);
      input.value = "";
    };

    input.addEventListener("change", handler);
    input.addEventListener("input", handler);
    return () => {
      input.removeEventListener("change", handler);
      input.removeEventListener("input", handler);
    };
  }, [addFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (
    fileWithStatus: FileWithStatus,
    index: number
  ): Promise<boolean> => {
    const { file } = fileWithStatus;

    const uuid = crypto.randomUUID();
    const storagePath = `${facilityId}/${uuid}-${file.name}`;

    try {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "uploading", progress: 10 } : f
        )
      );

      const { error: uploadError } = await supabase.storage
        .from("compliance-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 60 } : f))
      );

      // Determine file type - use MIME if available, fallback to extension-based guess
      let fileType = file.type || "application/octet-stream";
      if (!file.type || file.type === "") {
        const name = file.name.toLowerCase();
        if (name.endsWith(".pdf")) fileType = "application/pdf";
        else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) fileType = "image/jpeg";
        else if (name.endsWith(".png")) fileType = "image/png";
        else if (name.endsWith(".heic") || name.endsWith(".heif")) fileType = "image/heic";
        else if (name.endsWith(".docx")) fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (name.endsWith(".xlsx")) fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        else if (name.endsWith(".zip")) fileType = "application/zip";
      }

      const { data: insertedDoc, error: insertError } = await supabase
        .from("documents")
        .insert({
          facility_id: facilityId,
          evidence_item_id: evidenceItemId || null,
          file_name: file.name,
          file_size: file.size,
          file_type: fileType,
          storage_path: storagePath,
          needs_review: true,
          uploaded_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "success", progress: 100, documentId: insertedDoc?.id }
            : f
        )
      );

      return true;
    } catch (error: any) {
      console.error("Upload error:", error);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "error",
                progress: 0,
                error: error.message || "Upload failed",
              }
            : f
        )
      );
      return false;
    }
  };

  const handleApprove = async (index: number) => {
    const fileWithStatus = files[index];
    if (!fileWithStatus.documentId) return;

    setApprovingIndex(index);

    try {
      const now = new Date().toISOString();

      const { error: docError } = await supabase
        .from("documents")
        .update({
          needs_review: false,
          reviewed_at: now,
        })
        .eq("id", fileWithStatus.documentId);

      if (docError) throw docError;

      if (evidenceItemId) {
        const updateData: Record<string, any> = {
          last_received_at: now,
          status: "ok",
        };

        if (evidenceTypeRecurrenceDays && evidenceTypeRecurrenceDays > 0) {
          const nextDue = new Date();
          nextDue.setDate(nextDue.getDate() + evidenceTypeRecurrenceDays);
          updateData.next_due_at = nextDue.toISOString();
        }

        const { error: evidenceError } = await supabase
          .from("evidence_items")
          .update(updateData)
          .eq("id", evidenceItemId);

        if (evidenceError) throw evidenceError;
      }

      toast.success("Document approved");
      onUploadComplete?.();
      handleOpenChange(false);
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error("Failed to approve document");
    } finally {
      setApprovingIndex(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "success") {
        successCount++;
        continue;
      }

      const success = await uploadFile(files[i], i);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(
        `${successCount} file(s) uploaded successfully${
          failCount > 0 ? `, ${failCount} failed` : ""
        }`
      );

      // Always notify parent of completion, but do NOT auto-close
      // User should be able to upload more files if they want
      onUploadComplete?.();
    } else if (failCount > 0) {
      toast.error("All uploads failed. Please try again.");
    }
  };

  const pendingFiles = files.filter((f) => f.status === "pending");
  const successFiles = files.filter((f) => f.status === "success");
  const hasUploading = files.some((f) => f.status === "uploading");
  const showApprovalFlow = evidenceItemId && successFiles.length > 0 && !isUploading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {evidenceItemId ? "Upload Evidence Document" : "Upload Documents"}
          </DialogTitle>
          <DialogDescription>
            {evidenceItemId
              ? "Upload a document for this evidence item. You can approve it to update the status."
              : "Upload compliance documents. They'll be available for review after upload."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dropzone - hide after successful upload if approval flow */}
          {/* Always show dropzone - users can upload as many files as they want */}
          {(
            <>
              {/* 
                File input - visually hidden but NOT display:none.
                iOS Safari ignores programmatic clicks on display:none inputs.
                Using sr-only-like styles keeps it in DOM and accessible.
              */}
              <input
                id="upload-file-input"
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_ATTRIBUTE}
                onChange={handleFileInput}
                onInput={handleFileInput}
                disabled={isUploading}
                key={open ? "open" : "closed"}
                style={{
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  padding: 0,
                  margin: "-1px",
                  overflow: "hidden",
                  clip: "rect(0,0,0,0)",
                  whiteSpace: "nowrap",
                  border: 0,
                  opacity: 0,
                }}
              />
              <label
                htmlFor="upload-file-input"
                onPointerDown={resetFileInput}
                onMouseDown={resetFileInput}
                onTouchStart={resetFileInput}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative block rounded-lg border-2 border-dashed p-6 transition-all duration-200 cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                  isUploading && "pointer-events-none opacity-50"
                )}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={cn(
                      "p-2.5 rounded-full transition-colors",
                      isDragging ? "bg-primary/20" : "bg-muted"
                    )}
                  >
                    <Upload
                      className={cn(
                        "h-5 w-5",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Tap to select files or drop here
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PDF, JPG, PNG, HEIC, DOCX, XLSX, ZIP (max 20MB)
                    </p>
                  </div>
                </div>
              </label>
            </>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((fileWithStatus, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    fileWithStatus.status === "success" &&
                      "bg-status-ok/5 border-status-ok/30",
                    fileWithStatus.status === "error" &&
                      "bg-status-overdue/5 border-status-overdue/30",
                    fileWithStatus.status === "pending" && "bg-muted/50",
                    fileWithStatus.status === "uploading" && "bg-primary/5"
                  )}
                >
                  {fileWithStatus.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-status-ok flex-shrink-0" />
                  ) : fileWithStatus.status === "uploading" ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {fileWithStatus.file.name}
                    </p>
                    {fileWithStatus.status === "uploading" ? (
                      <Progress value={fileWithStatus.progress} className="h-1 mt-1" />
                    ) : fileWithStatus.status === "error" ? (
                      <p className="text-xs text-status-overdue">
                        {fileWithStatus.error}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileWithStatus.file.size)}
                      </p>
                    )}
                  </div>
                  {fileWithStatus.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {showApprovalFlow && fileWithStatus.status === "success" && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(index);
                      }}
                      disabled={approvingIndex !== null}
                    >
                      {approvingIndex === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {showApprovalFlow && (
            <p className="text-sm text-muted-foreground text-center">
              Click "Approve" to mark this evidence item as received and update its status.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={hasUploading || approvingIndex !== null}
          >
            {showApprovalFlow ? "Close" : "Cancel"}
          </Button>
          {!showApprovalFlow && (
            <Button
              onClick={handleUpload}
              disabled={pendingFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ""}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
