import { useState, useRef, DragEvent } from "react";
import { Upload, CheckCircle2, Loader2, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface DropZoneUploaderProps {
  label: string;
  hint?: string;
  required?: boolean;
  uploaded: boolean;
  uploading?: boolean;
  fileName?: string | null;
  onFileSelected: (file: File) => void;
  onClear?: () => void;
  accept?: string;
}

const DropZoneUploader = ({
  label,
  hint,
  required,
  uploaded,
  uploading,
  fileName,
  onFileSelected,
  onClear,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
}: DropZoneUploaderProps) => {
  const { isRTL } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div>
      <label className="text-sm font-medium block mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground mb-2">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all min-h-[110px] flex flex-col items-center justify-center gap-2",
          uploaded && !uploading
            ? "border-success bg-success/5"
            : dragActive
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
            <p className="text-sm font-medium text-primary">
              {isRTL ? "جارٍ الرفع..." : "Uploading..."}
            </p>
          </>
        ) : uploaded ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div className="flex items-center gap-2 max-w-full">
              <FileText className="h-4 w-4 text-success shrink-0" />
              <p className="text-sm font-semibold text-success truncate">
                {fileName || (isRTL ? "تم الرفع بنجاح" : "Uploaded successfully")}
              </p>
            </div>
            {onClear && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute top-2 end-2 p-1 rounded-full hover:bg-destructive/10 text-destructive"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <>
            <Upload className={cn("h-7 w-7", dragActive ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm font-medium">
              {isRTL ? "اسحب الملف هنا أو انقر للاختيار" : "Drag file here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG · ≤ 5MB</p>
          </>
        )}
      </div>
    </div>
  );
};

export default DropZoneUploader;
