import { CopyButton } from "@/components/ui/CopyButton";
import { Download, Printer } from "lucide-react";
import {
  downloadCoverLetterWord,
  printCoverLetterPdf,
  type CoverLetterDocumentInput
} from "@/lib/export/coverLetterDocument";

type CoverLetterPreviewProps = {
  coverLetter: string;
  embedded?: boolean;
  documentInput?: Omit<CoverLetterDocumentInput, "coverLetter">;
};

export function CoverLetterPreview({ coverLetter, embedded = false, documentInput }: CoverLetterPreviewProps) {
  const canExport = Boolean(documentInput && coverLetter.trim());

  const content = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Cover letter draft</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review, copy, regenerate, or export as a professionally formatted document.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-xs font-medium text-slate-500 sm:inline">250-350 word target</span>
          <CopyButton value={coverLetter} label="Copy letter" copiedLabel="Copied" />
          <button
            type="button"
            onClick={() => {
              if (!documentInput) return;
              downloadCoverLetterWord({ ...documentInput, coverLetter });
            }}
            disabled={!canExport}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slateLine bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-pilot-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={15} aria-hidden="true" />
            Download Word
          </button>
          <button
            type="button"
            onClick={() => {
              if (!documentInput) return;
              printCoverLetterPdf({ ...documentInput, coverLetter });
            }}
            disabled={!canExport}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slateLine bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-pilot-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={15} aria-hidden="true" />
            Save PDF
          </button>
        </div>
      </div>
      {canExport ? (
        <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
          Exports use Arial 11, a blue divider, a bold subject line, inline-bold role keywords, and a clean sign-off.
        </p>
      ) : null}
      <div className="mt-4 whitespace-pre-line rounded-lg border border-slateLine bg-surface p-4 text-sm leading-6 text-slate-700">
        {coverLetter}
      </div>
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      {content}
    </section>
  );
}
