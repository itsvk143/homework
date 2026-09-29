"use client";

import React, { useState } from "react";
import {
  X,
  Camera,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface ProofUploadModalProps {
  assignment: any;
  isOpen: boolean;
  onClose: () => void;
  onProofSubmitted: (updatedAssignment: any) => void;
}

export function ProofUploadModal({
  assignment,
  isOpen,
  onClose,
  onProofSubmitted,
}: ProofUploadModalProps) {
  if (!isOpen || !assignment) return null;

  const [studentNotes, setStudentNotes] = useState("");
  const [attachments, setAttachments] = useState<
    Array<{ fileName: string; fileType: string; fileUrl: string; fileSize: number }>
  >([
    {
      fileName: "notebook_solution_p1.jpg",
      fileType: "IMAGE",
      fileUrl:
        "https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&auto=format&fit=crop&q=80",
      fileSize: 420000,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleSimulateAddPhoto = () => {
    const samplePhotos = [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
    ];
    const picked = samplePhotos[attachments.length % samplePhotos.length];
    setAttachments((prev) => [
      ...prev,
      {
        fileName: `homework_photo_page_${prev.length + 1}.jpg`,
        fileType: "IMAGE",
        fileUrl: picked,
        fileSize: 350000,
      },
    ]);
  };

  const handleSimulateAddPdf = () => {
    setAttachments((prev) => [
      ...prev,
      {
        fileName: `homework_scan_${prev.length + 1}.pdf`,
        fileType: "PDF",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileSize: 980000,
      },
    ]);
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/homework/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNotes,
          attachments,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onProofSubmitted(data.assignment);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upload Homework Proof</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {assignment.book.name} — {assignment.exercise.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Action buttons to attach */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={handleSimulateAddPhoto}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs transition-colors gap-1.5"
            >
              <Camera className="w-5 h-5" />
              <span>Take Photo</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateAddPhoto}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors gap-1.5"
            >
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <span>From Gallery</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateAddPdf}
              className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors gap-1.5"
            >
              <FileText className="w-5 h-5 text-rose-500" />
              <span>Upload PDF</span>
            </button>
          </div>

          {/* Attachments preview list */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Attached Files ({attachments.length}):
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {att.fileType === "IMAGE" ? (
                      <img
                        src={att.fileUrl}
                        alt="Proof thumbnail"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{att.fileName}</p>
                      <p className="text-[10px] text-slate-400">
                        {(att.fileSize / 1024).toFixed(0)} KB • {att.fileType}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes for teacher */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Note for Teacher:
            </label>
            <textarea
              rows={2}
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="e.g., Attached photos of pages 75 and 76 from my homework notebook."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{submitting ? "Submitting..." : "Submit Proof"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
