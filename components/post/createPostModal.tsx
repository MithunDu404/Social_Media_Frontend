"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImagePlus, X, Loader2 } from "lucide-react";

import { createPost, addMediaToPost } from "@/lib/posts";
import { uploadMultipleToCloudinary, UploadResult } from "@/lib/upload";

const MAX_FILES = 4;
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = "image/*,video/*";

interface PreviewFile {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

export default function CreatePostModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [blog, setBlog] = useState("");
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // ── helpers ──────────────────────────────────────────
  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError("");
      const newFiles: PreviewFile[] = [];
      const existing = files.length;

      for (const file of Array.from(incoming)) {
        if (existing + newFiles.length >= MAX_FILES) {
          setError(`Maximum ${MAX_FILES} files allowed.`);
          break;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setError(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
          continue;
        }
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          setError(`"${file.name}" is not a supported file type.`);
          continue;
        }
        newFiles.push({
          file,
          previewUrl: URL.createObjectURL(file),
          isVideo: file.type.startsWith("video/"),
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const resetForm = () => {
    setTitle("");
    setBlog("");
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setUploadProgress(0);
    setIsUploading(false);
    setError("");
  };

  // ── drag & drop ─────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  // ── mutations ───────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);

      // 1) Upload files to Cloudinary (if any)
      let uploaded: UploadResult[] = [];
      if (files.length > 0) {
        uploaded = await uploadMultipleToCloudinary(
          files.map((f) => f.file),
          setUploadProgress,
        );
      }

      // 2) Create the post on our backend
      const postData = await createPost({ title, blog });
      const postId: number = postData.post.id;

      // 3) Attach each media to the post
      for (const media of uploaded) {
        await addMediaToPost(postId, media);
      }

      return postData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err.message || "Failed to create post.");
      setIsUploading(false);
    },
  });

  const handleCreate = () => {
    setError("");
    if (!title.trim() || !blog.trim()) {
      setError("Title and content are required.");
      return;
    }
    createMutation.mutate();
  };

  const isBusy = createMutation.isPending || isUploading;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isBusy) {
          setOpen(v);
          if (!v) resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          Create Post
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <Input
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isBusy}
          />

          {/* Blog content */}
          <Textarea
            placeholder="What's on your mind? (Blog content)"
            value={blog}
            onChange={(e) => setBlog(e.target.value)}
            rows={4}
            disabled={isBusy}
          />

          {/* Drop zone / file picker */}
          {files.length < MAX_FILES && (
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <ImagePlus size={28} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium text-primary">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-muted-foreground">
                Images or videos · max {MAX_FILE_SIZE_MB}MB each · up to {MAX_FILES} files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {/* Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="relative rounded-lg overflow-hidden border bg-muted aspect-video group"
                >
                  {f.isVideo ? (
                    <video
                      src={f.previewUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={f.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Remove button */}
                  {!isBusy && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {isBusy && files.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Uploading media…
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleCreate}
            disabled={isBusy}
            className="w-full"
          >
            {isBusy ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {files.length > 0 ? "Uploading & Posting…" : "Posting…"}
              </span>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
