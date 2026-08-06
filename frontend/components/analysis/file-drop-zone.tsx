"use client";

import { FileText, Plus, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { useId, useState } from "react";

import { MAX_FILE_BYTES, readableSize } from "@/lib/formatting";

interface FileDropZoneProps {
  files: File[];
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label: string;
  description: string;
}

export function FileDropZone({ files, multiple = false, onFiles, label, description }: FileDropZoneProps) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  function addFiles(incoming: File[]) {
    onFiles(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  }

  return (
    <div className="file-field">
      <div className="field-heading">
        <div><label htmlFor={inputId}>{label}</label><p>{description}</p></div>
        <span><ShieldCheck size={13} /> Private</span>
      </div>
      <label
        className={`drop-zone ${dragging ? "is-dragging" : ""}`}
        htmlFor={inputId}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <input
          id={inputId}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple={multiple}
          onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
        />
        <span className="drop-icon" aria-hidden="true"><UploadCloud size={22} /></span>
        <span><strong>Drop {multiple ? "résumés" : "a document"} here</strong><small>or choose PDF, DOCX, TXT · 10 MB each</small></span>
        <span className="browse-affordance"><Plus size={14} /> Choose file</span>
      </label>
      {files.length > 0 && (
        <ul className="file-list" aria-label={`${label} selected files`}>
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`}>
              <span className="file-type"><FileText size={17} /></span>
              <span className="file-copy">
                <strong>{file.name}</strong>
                <small className={file.size === 0 || file.size > MAX_FILE_BYTES ? "is-invalid" : undefined}>
                  {readableSize(file.size)} · {file.size === 0 ? "Empty file" : file.size > MAX_FILE_BYTES ? "Exceeds 10 MB" : "Ready to scan"}
                </small>
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onFiles(files.filter((_, candidate) => candidate !== index))}
              ><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
