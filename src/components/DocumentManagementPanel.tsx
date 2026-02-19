import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  X,
  Check,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationStatus = "not-uploaded" | "uploaded" | "under-review" | "verified" | "rejected";

interface Document {
  id: string;
  name: string;
  required: boolean;
  description: string;
  acceptedTypes: string[];
  maxSize: number;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  status: VerificationStatus;
  lastUpdated?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  rejectionReason?: string;
}

const initialDocuments: Document[] = [
  {
    id: "doc-1",
    name: "10th Marksheet",
    required: true,
    description: "Your 10th standard marksheet (Class X)",
    acceptedTypes: ["PDF"],
    maxSize: 5,
    fileName: "10th_Marksheet.pdf",
    fileSize: 1.2,
    fileType: "PDF",
    status: "verified",
    lastUpdated: "2026-02-15",
  },
  {
    id: "doc-2",
    name: "12th Marksheet",
    required: true,
    description: "Your 12th standard marksheet (Class XII)",
    acceptedTypes: ["PDF"],
    maxSize: 5,
    status: "under-review",
    lastUpdated: "2026-02-18",
  },
  {
    id: "doc-3",
    name: "ID Proof",
    required: true,
    description: "Aadhar, Passport, or Voter ID",
    acceptedTypes: ["PDF", "JPG", "JPEG", "PNG"],
    maxSize: 5,
    status: "rejected",
    rejectionReason: "Document quality is poor. Please ensure proper lighting and clarity.",
    lastUpdated: "2026-02-10",
  },
  {
    id: "doc-4",
    name: "Passport Photo",
    required: true,
    description: "4x6 cm photo on white background",
    acceptedTypes: ["JPG", "JPEG", "PNG"],
    maxSize: 2,
    status: "uploaded",
    fileName: "passport_photo.jpg",
    fileSize: 0.8,
    fileType: "JPG",
    lastUpdated: "2026-02-12",
  },
];

const statusConfig = {
  "not-uploaded": {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted",
    label: "Not Uploaded",
    labelBg: "bg-muted text-muted-foreground",
  },
  uploaded: {
    icon: FileText,
    color: "text-campus-amber",
    bg: "bg-campus-amber/10",
    label: "Uploaded",
    labelBg: "bg-campus-amber text-primary-foreground",
  },
  "under-review": {
    icon: Clock,
    color: "text-campus-violet",
    bg: "bg-campus-violet/10",
    label: "Under Review",
    labelBg: "bg-campus-violet text-primary-foreground",
  },
  verified: {
    icon: CheckCircle2,
    color: "text-campus-emerald",
    bg: "bg-campus-emerald/10",
    label: "Verified",
    labelBg: "bg-campus-emerald text-primary-foreground",
  },
  rejected: {
    icon: AlertTriangle,
    color: "text-campus-rose",
    bg: "bg-campus-rose/10",
    label: "Rejected",
    labelBg: "bg-campus-rose text-primary-foreground",
  },
};

const DocumentManagementPanel = () => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<VerificationStatus | "all">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const verifiedCount = documents.filter((doc) => doc.status === "verified").length;
  const totalRequired = documents.filter((doc) => doc.required).length;
  const allVerified = documents.every(
    (doc) => !doc.required || doc.status === "verified"
  );

  const filteredDocuments =
    selectedFilter === "all"
      ? documents
      : documents.filter((doc) => doc.status === selectedFilter);

  // Validation functions
  const validateFile = (file: File, acceptedTypes: string[], maxSize: number): { valid: boolean; error?: string } => {
    const fileExtension = file.name.split(".").pop()?.toUpperCase() || "";
    
    if (!acceptedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `Invalid file type. Accepted: ${acceptedTypes.join(", ")}`,
      };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize}MB limit.`,
      };
    }

    return { valid: true };
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, docId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files];
    if (docId) {
      // Single document upload
      handleFileUpload(files[0], docId);
    } else if (bulkUploadMode) {
      // Bulk upload
      files.forEach((file) => {
        const matchedDoc = documents.find(
          (doc) =>
            validateFile(file, doc.acceptedTypes, doc.maxSize).valid &&
            doc.status === "not-uploaded"
        );
        if (matchedDoc) {
          handleFileUpload(file, matchedDoc.id);
        }
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (file: File, docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    const validation = validateFile(file, doc.acceptedTypes, doc.maxSize);
    if (!validation.valid) {
      alert(`Upload failed: ${validation.error}`);
      return;
    }

    setUploading(docId);
    setDocuments(
      documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              isUploading: true,
              uploadProgress: 0,
              fileName: file.name,
              fileSize: file.size / (1024 * 1024),
              fileType: file.name.split(".").pop()?.toUpperCase() || "",
            }
          : d
      )
    );

    // Simulate upload progress with more realistic timing
    let progress = 0;

    const uploadInterval = setInterval(() => {
      progress += Math.random() * 25;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);

        // Update document status after upload completes
        setTimeout(() => {
          setDocuments((prevDocs) =>
            prevDocs.map((d) =>
              d.id === docId
                ? {
                    ...d,
                    status: "under-review" as VerificationStatus,
                    isUploading: false,
                    uploadProgress: 0,
                    lastUpdated: new Date().toISOString().split("T")[0],
                  }
                : d
            )
          );

          // Simulate automatic verification after 3-5 seconds
          setTimeout(() => {
            setDocuments((prevDocs) =>
              prevDocs.map((d) =>
                d.id === docId
                  ? {
                      ...d,
                      status: Math.random() > 0.1 ? ("verified" as VerificationStatus) : ("uploaded" as VerificationStatus),
                    }
                  : d
              )
            );
          }, 3000 + Math.random() * 2000);

          setUploading(null);
        }, 500);
      } else {
        setDocuments((prevDocs) =>
          prevDocs.map((d) =>
            d.id === docId ? { ...d, uploadProgress: progress } : d
          )
        );
      }
    }, 200);
  };

  // Handle file input change
  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docId?: string
  ) => {
    const file = e.target.files?.[0];
    if (file && docId) {
      handleFileUpload(file, docId);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Completion Tracker */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Document Verification Portal</h1>
          <p className="text-muted-foreground mt-1">Complete your document submission for registration</p>
        </div>

        {/* Animated Completion Tracker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted border border-border"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-campus-emerald" />
            <span className="text-sm font-semibold text-foreground">
              {verifiedCount}/{totalRequired}
            </span>
          </div>
          <div className="w-24 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(verifiedCount / totalRequired) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {allVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-campus-emerald/10 border border-campus-emerald/30 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-campus-emerald/20">
              <CheckCircle2 className="w-5 h-5 text-campus-emerald" />
            </div>
            <div>
              <p className="text-sm font-semibold text-campus-emerald">
                All documents verified successfully! ✓
              </p>
              <p className="text-xs text-campus-emerald/80">
                You're all set to proceed with registration.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requirements Panel */}
      <div className="bg-gradient-to-r from-campus-teal/10 to-campus-violet/10 border border-campus-teal/20 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-campus-teal" />
          Document Requirements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-campus-teal mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{doc.name}</p>
                <p className="text-[11px]">{doc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Bulk Upload Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as VerificationStatus | "all")}
            className="text-sm rounded-lg px-3 py-1.5 bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-campus-teal"
          >
            <option value="all">All Documents</option>
            <option value="not-uploaded">Not Uploaded</option>
            <option value="uploaded">Uploaded</option>
            <option value="under-review">Under Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={() => setBulkUploadMode(!bulkUploadMode)}
          className={cn(
            "text-sm font-medium px-3 py-1.5 rounded-lg transition-all",
            bulkUploadMode
              ? "bg-campus-teal text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {bulkUploadMode ? "✓ Bulk Mode" : "Bulk Upload"}
        </button>
      </div>

      {/* Bulk Upload Zone */}
      <AnimatePresence>
        {bulkUploadMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            ref={dragRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 transition-all text-center",
              dragActive
                ? "border-campus-teal bg-campus-teal/5"
                : "border-border bg-muted/30"
            )}
          >
            <ArrowRight className={cn(
              "w-10 h-10 mx-auto mb-3 transition-colors",
              dragActive ? "text-campus-teal" : "text-muted-foreground"
            )} />
            <p className="text-sm font-medium text-foreground mb-1">
              Drag & drop files here or browse
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Supported formats: PDF, JPG, JPEG, PNG (Max 5MB each)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg bg-campus-teal text-primary-foreground hover:bg-campus-teal/90 transition-colors"
            >
              Browse Files
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocuments.map((doc, i) => {
          const config = statusConfig[doc.status];
          const isUploading = doc.isUploading && uploading === doc.id;

          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-elevated transition-all",
                isUploading && "ring-2 ring-campus-teal/50",
                doc.status === "verified" && "border-campus-emerald/30"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={cn(
                      "p-2.5 rounded-lg mt-0.5 flex-shrink-0",
                      config.bg
                    )}
                  >
                    <config.icon className={cn("w-5 h-5", config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {doc.name}
                      </h3>
                      {doc.required && (
                        <span className="text-[10px] font-bold text-campus-rose">
                          *
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.description}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2",
                    config.labelBg
                  )}
                >
                  {config.label}
                </span>
              </div>

              {/* File Info - shown when uploaded */}
              {doc.fileName && !isUploading && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {doc.fileSize?.toFixed(1)}MB • {doc.fileType}
                      </p>
                    </div>
                    <Check className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Uploading...
                    </span>
                    <span className="text-xs font-bold text-campus-teal">
                      {Math.round(doc.uploadProgress || 0)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${doc.uploadProgress || 0}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full gradient-primary rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {doc.lastUpdated && !isUploading && (
                <p className="text-xs text-muted-foreground mb-4">
                  {doc.status === "under-review"
                    ? "Under review • "
                    : doc.status === "verified"
                    ? "Verified • "
                    : ""}
                  {new Date(doc.lastUpdated).toLocaleDateString()}
                </p>
              )}

              {/* Rejection Info */}
              {doc.status === "rejected" && !isUploading && (
                <div className="mb-4 p-3 bg-campus-rose/5 border border-campus-rose/20 rounded-lg">
                  <p className="text-xs font-medium text-campus-rose mb-2">
                    Rejection Reason
                  </p>
                  <p className="text-xs text-campus-rose/80">
                    {doc.rejectionReason}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {doc.status === "not-uploaded" ? (
                  <>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={(e) => handleDrop(e, doc.id)}
                      className={cn(
                        "flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 border-dashed cursor-pointer",
                        dragActive
                          ? "border-campus-teal bg-campus-teal/5"
                          : "border-border hover:border-campus-teal/50"
                      )}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span
                        onClick={() => {
                          fileInputRef.current?.setAttribute("data-doc-id", doc.id);
                          fileInputRef.current?.click();
                        }}
                        className="cursor-pointer"
                      >
                        Upload
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={doc.acceptedTypes.map((t) => `.${t.toLowerCase()}`).join(",")}
                        onChange={(e) => handleFileUpload(e.target.files?.[0]!, doc.id)}
                        className="hidden"
                      />
                    </div>
                  </>
                ) : doc.status === "rejected" ? (
                  <>
                    <button
                      onClick={() => {
                        fileInputRef.current?.setAttribute("data-doc-id", doc.id);
                        fileInputRef.current?.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-campus-teal text-primary-foreground hover:bg-campus-teal/90 transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Re-upload
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={doc.acceptedTypes.map((t) => `.${t.toLowerCase()}`).join(",")}
                      onChange={(e) => handleFileUpload(e.target.files?.[0]!, doc.id)}
                      className="hidden"
                    />
                  </>
                ) : doc.status === "uploaded" ? (
                  <>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.setAttribute("data-doc-id", doc.id);
                        fileInputRef.current?.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                    >
                      Replace
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={doc.acceptedTypes.map((t) => `.${t.toLowerCase()}`).join(",")}
                      onChange={(e) => handleFileUpload(e.target.files?.[0]!, doc.id)}
                      className="hidden"
                    />
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-campus-teal/5 border border-campus-teal/20 rounded-xl p-4">
        <p className="text-sm text-campus-teal font-medium">
          💡 Pro Tip: Ensure all documents are clear, legible, and in the specified format for quick verification. Our system will automatically review your documents.
        </p>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewDoc(null)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border"
            >
              <div className="sticky top-0 flex items-center justify-between p-5 bg-card border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  {previewDoc.name}
                </h2>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Document Preview */}
                <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-[300px]">
                  <FileText className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm font-medium">
                    Document Preview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {previewDoc.fileName || previewDoc.name}
                  </p>
                </div>

                {/* File Details */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Document Name
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {previewDoc.name}
                    </span>
                  </div>
                  {previewDoc.fileName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        File Name
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {previewDoc.fileName}
                      </span>
                    </div>
                  )}
                  {previewDoc.fileSize && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        File Size
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {previewDoc.fileSize.toFixed(1)} MB
                      </span>
                    </div>
                  )}
                  {previewDoc.fileType && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        File Type
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {previewDoc.fileType}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium px-2 py-1 rounded-full",
                        statusConfig[previewDoc.status].labelBg
                      )}
                    >
                      {statusConfig[previewDoc.status].label}
                    </span>
                  </div>
                  {previewDoc.lastUpdated && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last Updated
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {new Date(previewDoc.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-full mt-4 px-4 py-2 rounded-lg bg-campus-teal text-primary-foreground font-medium hover:bg-campus-teal/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentManagementPanel;
