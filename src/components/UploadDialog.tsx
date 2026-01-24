import { useState, useCallback, useRef } from "react";
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
  onUploadComplete?: () => void;
}

interface FileWithStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

const acceptedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
];

export function UploadDialog({
  open,
  onOpenChange,
  facilityId,
  onUploadComplete,
}: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset all state - called on close/cancel
  const resetState = useCallback(() => {
    // Abort any in-flight uploads
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setFiles([]);
    setIsDragging(false);
    setIsUploading(false);
  }, []);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).slice(0, 10);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []).slice(0, 10);
      addFiles(selectedFiles);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    []
  );

  const addFiles = (newFiles: File[]) => {
    const filesWithStatus: FileWithStatus[] = newFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...filesWithStatus].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (
    fileWithStatus: FileWithStatus,
    index: number
  ): Promise<boolean> => {
    const { file } = fileWithStatus;

    // Generate unique path: facilities/{facility_id}/{uuid}-{filename}
    const uuid = crypto.randomUUID();
    const storagePath = `${facilityId}/${uuid}-${file.name}`;

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "uploading", progress: 10 } : f
        )
      );

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("compliance-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update progress
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 60 } : f))
      );

      // Insert document record
      const { error: insertError } = await supabase.from("documents").insert({
        facility_id: facilityId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || "application/octet-stream",
        storage_path: storagePath,
        needs_review: true,
        uploaded_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // Mark success
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "success", progress: 100 } : f
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

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    let successCount = 0;
    let failCount = 0;

    // Upload files sequentially to avoid overwhelming the server
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
      onUploadComplete?.();

      // If all succeeded, close dialog after short delay
      if (failCount === 0) {
        setTimeout(() => {
          handleOpenChange(false);
        }, 500);
      }
    } else if (failCount > 0) {
      toast.error("All uploads failed. Please try again.");
    }
  };

  const pendingFiles = files.filter((f) => f.status === "pending");
  const hasUploading = files.some((f) => f.status === "uploading");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload Documents</DialogTitle>
          <DialogDescription>
            Upload compliance documents. They'll be available for review after upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-lg border-2 border-dashed p-6 transition-all duration-200 cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(",")}
              onChange={handleFileInput}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
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
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PDF, JPG, PNG, HEIC, DOCX, XLSX, ZIP
                </p>
              </div>
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
                        {(fileWithStatus.file.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  {fileWithStatus.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={hasUploading}
          >
            Cancel
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
