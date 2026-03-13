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

// Max number of files kept in the dialog queue (can still upload repeatedly)
const MAX_FILES_PER_QUEUE = 50;

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
  const [lastEventFired, setLastEventFired] = useState<"yes" | "no">("no");
  const [lastSelectedCount, setLastSelectedCount] = useState(0);
  const [lastQueuedCount, setLastQueuedCount] = useState(0);
  const [lastErrorMessage, setLastErrorMessage] = useState("");
  const showDebugPanel = import.meta.env.DEV;
  const abortControllerRef = useRef<AbortController | null>(null);
  // Avoid side-effects inside setState updaters; keep a lightweight ref of current queue length.
  const filesCountRef = useRef(0);
  useEffect(() => {
    filesCountRef.current = files.length;
  }, [files.length]);

  // Ref to file input for resetting value
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset file input value - critical for allowing same file to be selected again
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
    setLastEventFired("no");
    setLastSelectedCount(0);
    setLastQueuedCount(0);
    setLastErrorMessage("");
    resetFileInput();
  }, [resetFileInput]);

  // Handle dialog close
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetState();
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, resetState]
  );

  // Reset input whenever the dialog opens
  useEffect(() => {
    if (open) resetFileInput();
  }, [open, resetFileInput]);

  // Validate and add files with detailed error messages
  const addFiles = useCallback((newFiles: File[]): number => {
    const valid: File[] = [];

    for (const file of newFiles) {
      const fileType = file.type || "no type";
      const fileSize = formatFileSize(file.size);

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const message = `Rejected: ${file.name} | type: ${fileType} | size: ${fileSize} | reason: too large (max 20MB)`;
        toast.error(message);
        setLastErrorMessage(message);
        continue;
      }

      if (!isAcceptedFile(file)) {
        const message = `Rejected: ${file.name} | type: ${fileType} | size: ${fileSize} | reason: type not accepted`;
        toast.error(message);
        setLastErrorMessage(message);
        continue;
      }

      valid.push(file);
    }

    if (valid.length === 0) return 0;

    const remaining = Math.max(0, MAX_FILES_PER_QUEUE - filesCountRef.current);
    if (remaining === 0) {
      const message = `You can queue up to ${MAX_FILES_PER_QUEUE} files at a time.`;
      toast.error(message);
      setLastErrorMessage(message);
      return 0;
    }

    const filesWithStatus: FileWithStatus[] = valid.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }));

    if (filesWithStatus.length > remaining) {
      const message = `Only the first ${remaining} file(s) were added (queue limit: ${MAX_FILES_PER_QUEUE}).`;
      toast.error(message);
      setLastErrorMessage(message);
    }

    const toAdd = filesWithStatus.slice(0, remaining);
    setFiles((prev) => [...prev, ...toAdd]);
    return toAdd.length;
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
      const droppedFiles = Array.from(e.dataTransfer.files).slice(0, MAX_FILES_PER_QUEUE);
      addFiles(droppedFiles);
    },
    [addFiles]
  );

  // Single React onChange handler — no native listeners, no programmatic .click()
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.currentTarget.files || []).slice(0, MAX_FILES_PER_QUEUE);
      const count = selected.length;
      const names = selected.map((f) => f.name);
      const types = selected.map((f) => f.type || "no type detected");
      const sizes = selected.map((f) => f.size);

      setLastEventFired("yes");
      setLastSelectedCount(count);
      setLastQueuedCount(0);
      setLastErrorMessage("");

      toast.info(`onChange fired: ${selected.length} file(s)`);
      console.log("[UploadDialog] onChange fired", { count, names, types, sizes });

      if (selected.length > 0) {
        const queuedCount = addFiles(selected);
        setLastQueuedCount(queuedCount);
        toast.info(`Queued: ${selected.length} file(s)`);
      } else {
        const message = "onChange fired but Android returned 0 files";
        setLastErrorMessage(message);
        toast.error(message);
      }

      e.currentTarget.value = "";
    },
    [addFiles]
  );

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

    console.log("[Upload] Starting:", {
      facilityId, evidenceItemId: evidenceItemId || "(none)",
      storagePath, fileName: file.name, fileSize: file.size, fileType: file.type
    });

    try {
      toast.info(`Uploading: ${file.name}`);
      setLastErrorMessage("");

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

      if (uploadError) {
        const message = `Storage upload failed: ${uploadError.message}`;
        toast.error(message);
        setLastErrorMessage(message);
        throw uploadError;
      }

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

      if (insertError) {
        const message = `DB insert failed: ${insertError.message}`;
        toast.error(message);
        setLastErrorMessage(message);
        throw insertError;
      }

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
      setLastErrorMessage(error?.message || "Upload failed");
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
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
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
          {/* Visually hidden file input — clip-based hiding for Android/iOS reliability */}
          <input
            id="upload-file-input"
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            disabled={isUploading}
            onChange={handleFileChange}
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
            tabIndex={-1}
          />

          {/* Dropzone for desktop drag-and-drop only — NOT a click target */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "rounded-lg border-2 border-dashed p-6 transition-all duration-200",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border",
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
                  Drop files here or use the button below
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PDF, JPG, PNG, HEIC, DOCX, XLSX, ZIP (max 20MB)
                </p>
              </div>
              {/* Label acts as native button — reliable on Android/iOS */}
              <label
                htmlFor="upload-file-input"
                className={cn(
                  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium rounded-md border border-input bg-background shadow-xs h-9 px-4 mt-2 cursor-pointer select-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  isUploading && "opacity-50 pointer-events-none"
                )}
              >
                <Upload className="h-4 w-4" />
                Choose files
              </label>
            </div>
          </div>

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

          {showDebugPanel && (
            <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">Upload debug</p>
              <p className="text-xs text-muted-foreground">
                lastEvent: onChange fired = {lastEventFired}
              </p>
              <p className="text-xs text-muted-foreground">
                lastSelectedCount: {lastSelectedCount}
              </p>
              <p className="text-xs text-muted-foreground">
                lastQueuedCount: {lastQueuedCount}
              </p>
              <p className="text-xs text-muted-foreground break-words">
                lastErrorMessage: {lastErrorMessage || "none"}
              </p>
            </div>
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
