export function CoverLetterPreview({ coverLetter, embedded = false }: { coverLetter: string; embedded?: boolean }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Cover letter draft</h2>
        <span className="text-xs font-medium text-slate-500">250-350 word target</span>
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
