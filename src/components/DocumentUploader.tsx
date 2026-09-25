import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

interface DocumentUploaderProps {
  requiredDocumentNames?: string[];
  documents: Array<{
    documentType: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileData: string;
  }>;
  onChange: (docs: Array<{
    documentType: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileData: string;
  }>) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  requiredDocumentNames = ['Resume / CV'],
  documents,
  onChange,
}) => {
  const [selectedType, setSelectedType] = useState<string>('Resume / CV');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const file = files[0];
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds 15MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const newDoc = {
        documentType: selectedType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
        fileData: base64Data,
      };

      const existingIdx = documents.findIndex((d) => d.documentType === selectedType);
      if (existingIdx >= 0) {
        const updated = [...documents];
        updated[existingIdx] = newDoc;
        onChange(updated);
      } else {
        onChange([...documents, newDoc]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeDoc = (type: string) => {
    onChange(documents.filter((d) => d.documentType !== type));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Attach Resume / CV *
          </h4>
          <p className="text-[11px] text-slate-500">
            Upload your CV in PDF or DOCX format. Admin & HR will view and download it directly.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-slate-600">Document Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none"
          >
            <option value="Resume / CV">Resume / CV</option>
            <option value="Academic Degree">Academic Degree / Diploma</option>
            <option value="Certificates">Certificates / References</option>
          </select>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          dragActive
            ? 'border-emerald-600 bg-emerald-50/50'
            : 'border-slate-300 bg-white hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold text-slate-800">
          Click to upload or drag & drop your <span className="text-emerald-700">{selectedType}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">PDF or DOCX up to 15MB</p>
      </div>

      {/* Uploaded Files Preview */}
      {documents.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {documents.map((doc) => (
            <div
              key={doc.documentType}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold text-slate-800">
                      {doc.documentType}
                    </span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      Attached
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-slate-500">
                    {doc.fileName} • {formatSize(doc.fileSize)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeDoc(doc.documentType)}
                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
