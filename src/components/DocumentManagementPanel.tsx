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
  Download,
  CheckCheck,
  Upload,
  Filter,
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

  const allUploaded = documents.every((doc) => doc.status === "uploaded");
  const uploadedCount = documents.filter((doc) => doc.status === "uploaded").length;

  const handleUploadStart = (docId: string) => {
    setUploading(docId);
    setDocuments(
      documents.map((doc) =>
        doc.id === docId
          ? { ...doc, isUploading: true, uploadProgress: 0 }
          : doc
      )
    );

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Update document status after upload completes
        setTimeout(() => {
          setDocuments(
            documents.map((doc) =>
              doc.id === docId
                ? {
                    ...doc,
                    status: "uploaded",
                    lastUpdated: new Date().toISOString().split("T")[0],
                    isUploading: false,
                    uploadProgress: 0,
                  }
                : doc
            )
          );
          setUploading(null);
        }, 500);
      } else {
        setDocuments(
          documents.map((doc) =>
            doc.id === docId
              ? { ...doc, uploadProgress: progress }
              : doc
          )
        );
      }
    }, 200);
  };

  const handleDelete = (docId: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === docId
          ? { ...doc, status: "pending", lastUpdated: undefined }
          : doc
      )
    );
  };

  const rejectDoc = (docId: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === docId
          ? { ...doc, status: "rejected", lastUpdated: new Date().toISOString().split("T")[0] }
          : doc
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Management</h1>
          <p className="text-muted-foreground mt-1">
            {uploadedCount}/{documents.length} documents verified
          </p>
        </div>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {allUploaded && (
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
                Your documents have been approved and verified.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc, i) => {
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
                isUploading && "ring-2 ring-campus-teal/50"
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
                    <FileText className={cn("w-5 h-5", config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.type} Document
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
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                  Last updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                </p>
              )}

              {/* Rejection Reason */}
              {doc.status === "rejected" && !isUploading && (
                <div className="mb-4 p-3 bg-campus-rose/5 border border-campus-rose/20 rounded-lg">
                  <p className="text-xs text-campus-rose font-medium">
                    Rejection reason: Document quality is poor. Please resubmit.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {doc.status === "pending" ? (
                  <button
                    onClick={() => handleUploadStart(doc.id)}
                    disabled={uploading === doc.id}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      uploading === doc.id
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-campus-teal text-primary-foreground hover:bg-campus-teal/90"
                    )}
                  >
                    {uploading === doc.id ? "Uploading..." : "Upload"}
                    {uploading !== doc.id && <ArrowRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={uploading === doc.id}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-campus-rose/10 hover:text-campus-rose transition-all"
                    >
                      Remove
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
          💡 Tip: Ensure all documents are clear, legible, and match the specified format for quick verification.
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
              className="bg-card rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-border"
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
              <div className="p-5">
                <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center gap-3 min-h-[400px]">
                  <FileText className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm font-medium">
                    Document Preview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {previewDoc.name} ({previewDoc.type})
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentManagementPanel;
