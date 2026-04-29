export type CoverLetterDocumentInput = {
  coverLetter: string;
  companyName: string;
  jobTitle: string;
  resumeText: string;
  keywords?: string[];
};

type CandidateContact = {
  name: string;
  email: string;
  linkedIn: string;
};

const dividerColor = "#2E75B6";

export function downloadCoverLetterWord(input: CoverLetterDocumentInput) {
  const html = buildCoverLetterDocumentHtml(input);
  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${toFileName(input.companyName)}-${toFileName(input.jobTitle)}-cover-letter.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printCoverLetterPdf(input: CoverLetterDocumentInput) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(buildCoverLetterDocumentHtml(input, { autoPrint: true }));
  printWindow.document.close();
}

export function buildCoverLetterDocumentHtml(input: CoverLetterDocumentInput, options?: { autoPrint?: boolean }) {
  const contact = extractCandidateContact(input.resumeText);
  const bodyHtml = buildBodyHtml(input.coverLetter, input, contact);
  const contactLine = [contact.email, contact.linkedIn].filter(Boolean).join(" | ");
  const date = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.jobTitle)} cover letter</title>
    <style>
      @page { margin: 1in; }
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.45;
        color: #111827;
      }
      .name,
      .contact,
      .date,
      .signoff {
        font-size: 11pt;
        font-weight: 400;
      }
      .divider {
        border: 0;
        border-top: 2px solid ${dividerColor};
        margin: 10pt 0 14pt;
      }
      .date {
        margin-bottom: 12pt;
      }
      .subject {
        margin-bottom: 12pt;
        font-size: 11pt;
        font-weight: 700;
      }
      p {
        margin: 0 0 10pt;
        font-size: 11pt;
        font-weight: 400;
      }
      strong {
        font-weight: 700;
      }
      .signoff {
        margin-top: 18pt;
      }
    </style>
  </head>
  <body>
    <div class="name">${escapeHtml(contact.name)}</div>
    ${contactLine ? `<div class="contact">${escapeHtml(contactLine)}</div>` : ""}
    <hr class="divider" />
    <div class="date">${escapeHtml(date)}</div>
    <div class="subject">Re: Application for ${escapeHtml(input.jobTitle)}</div>
    ${bodyHtml}
    ${options?.autoPrint ? "<script>window.onload = () => { window.focus(); window.print(); };</script>" : ""}
  </body>
</html>`;
}

function buildBodyHtml(inputLetter: string, input: CoverLetterDocumentInput, contact: CandidateContact) {
  const letterWithoutTrailingSignoff = removeTrailingSignoff(inputLetter);
  const keywords = collectBoldKeywords(input);
  const paragraphs = letterWithoutTrailingSignoff
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${boldKeywords(escapeHtml(paragraph).replace(/\n/g, "<br />"), keywords)}</p>`);

  const signoffLines = ["Yours sincerely,", contact.name, contact.email, contact.linkedIn].filter(Boolean);
  const signoffHtml = signoffLines.map((line) => escapeHtml(line)).join("<br />");

  return `${paragraphs.join("\n")}
    <div class="signoff">${signoffHtml}</div>`;
}

function extractCandidateContact(resumeText: string): CandidateContact {
  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const email = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const linkedIn =
    resumeText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|,]+/i)?.[0]?.replace(/^https?:\/\//i, "") || "";

  const name =
    lines.find((line) => {
      if (line.includes("@") || /linkedin|github|portfolio|http/i.test(line)) return false;
      if (line.length > 48) return false;
      return /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(toTitleCase(line));
    }) || "Candidate";

  return {
    name: toTitleCase(name),
    email,
    linkedIn
  };
}

function collectBoldKeywords(input: CoverLetterDocumentInput) {
  const sourceKeywords = [
    input.companyName,
    input.jobTitle,
    ...input.jobTitle.split(/\s+/),
    ...(input.keywords || [])
  ];

  const seen = new Set<string>();
  return sourceKeywords
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length >= 4)
    .filter((keyword) => {
      const key = keyword.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.length - a.length)
    .slice(0, 18);
}

function boldKeywords(html: string, keywords: string[]) {
  let output = html;

  for (const keyword of keywords) {
    const pattern = new RegExp(`\\b(${escapeRegExp(escapeHtml(keyword))})\\b`, "gi");
    output = output.replace(pattern, "<strong>$1</strong>");
  }

  return output;
}

function removeTrailingSignoff(letter: string) {
  return letter
    .trim()
    .replace(
      /\n{1,3}(?:kind regards|regards|sincerely|yours sincerely|yours faithfully),?\s*\n(?:[^\n]+(?:\n(?:[^\n]+)){0,3})?\s*$/i,
      ""
    )
    .trim();
}

function toFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "jobpilot"
  );
}

function toTitleCase(value: string) {
  if (value === value.toUpperCase()) {
    return value
      .toLowerCase()
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
