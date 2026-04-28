import { CopyButton } from "@/components/ui/CopyButton";

export function CoverLetterPreview({ coverLetter, embedded = false }: { coverLetter: string; embedded?: boolean }) {
  const content = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Cover letter draft</h2>
          <p className="mt-1 text-sm text-slate-500">Review, copy, or regenerate with a clearer instruction.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-slate-500 sm:inline">250-350 word target</span>
          <CopyButton value={coverLetter} label="Copy letter" copiedLabel="Copied" />
        </div>
      </div>
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
