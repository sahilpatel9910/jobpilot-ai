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

type DocxModule = Awaited<typeof import("docx")>;

const dividerColor = "#2E75B6";
const dividerDocxColor = "2E75B6";
const arial11 = {
  font: "Arial",
  size: 22
};

export async function downloadCoverLetterWord(input: CoverLetterDocumentInput) {
  const docx = await import("docx");
  const blob = await docx.Packer.toBlob(buildCoverLetterDocx(input, docx));
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${toFileName(input.companyName)}-${toFileName(input.jobTitle)}-cover-letter.docx`;
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
      .name {
        font-size: 16pt;
        font-weight: 700;
      }
      .divider {
        border: 0;
        border-top: 2px solid ${dividerColor};
        margin: 8pt 0 14pt;
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
  const keywords = collectHighlightKeywords(input);
  const paragraphs = letterWithoutTrailingSignoff
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${boldKeywords(escapeHtml(paragraph).replace(/\n/g, "<br />"), keywords)}</p>`);

  const signoffLines = ["Thank you,", "", "Warm regards,", contact.name, contact.email, contact.linkedIn].filter(
    (line) => line !== null && line !== undefined
  );
  const signoffHtml = signoffLines.map((line) => escapeHtml(line)).join("<br />");

  return `${paragraphs.join("\n")}
    <div class="signoff">${signoffHtml}</div>`;
}

function buildCoverLetterDocx(input: CoverLetterDocumentInput, docx: DocxModule) {
  const { BorderStyle, Document, Paragraph, convertInchesToTwip } = docx;
  const contact = extractCandidateContact(input.resumeText);
  const contactLine = [contact.email, contact.linkedIn].filter(Boolean).join(" | ");
  const paragraphs = buildDocxBodyParagraphs(removeTrailingSignoff(input.coverLetter), collectHighlightKeywords(input), docx);
  const date = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return new Document({
    title: `${input.jobTitle} cover letter`,
    creator: "JobPilot AI",
    styles: {
      default: {
        document: {
          run: arial11,
          paragraph: {
            spacing: { after: 0 }
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1)
            }
          }
        },
        children: [
          textParagraph(contact.name, { bold: true, size: 32, docx }),
          ...(contactLine ? [textParagraph(contactLine, { docx })] : []),
          new Paragraph({
            border: {
              bottom: {
                color: dividerDocxColor,
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12
              }
            },
            spacing: { before: 120, after: 280 }
          }),
          textParagraph(date, { after: 240, docx }),
          textParagraph(`Re: Application for ${input.jobTitle}`, { bold: true, after: 260, docx }),
          ...paragraphs,
          textParagraph("Thank you,", { before: 180, docx }),
          textParagraph("", { after: 80, docx }),
          textParagraph("Warm regards,", { docx }),
          textParagraph(contact.name, { docx }),
          ...(contact.email ? [textParagraph(contact.email, { docx })] : []),
          ...(contact.linkedIn ? [textParagraph(contact.linkedIn, { docx })] : [])
        ]
      }
    ]
  });
}

function buildDocxBodyParagraphs(letter: string, keywords: string[], docx: DocxModule) {
  const { Paragraph } = docx;

  return letter
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        new Paragraph({
          children: splitTextRuns(paragraph.replace(/\s*\n\s*/g, " "), keywords, docx),
          spacing: { after: 220 },
          run: arial11
        })
    );
}

function textParagraph(
  text: string,
  options: { docx: DocxModule; bold?: boolean; size?: number; before?: number; after?: number }
) {
  const { Paragraph, TextRun } = options.docx;

  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        size: options?.size || arial11.size,
        font: arial11.font,
      })
    ],
    spacing: {
      before: options?.before || 0,
      after: options?.after || 0
    },
    run: arial11
  });
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

function collectHighlightKeywords(input: CoverLetterDocumentInput) {
  const sourceKeywords = input.keywords || [];

  const seen = new Set<string>();
  return sourceKeywords.flatMap(toHighlightTerms)
    .filter((keyword) => {
      const key = keyword.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.length - a.length)
    .slice(0, 14);
}

function boldKeywords(html: string, keywords: string[]) {
  let output = html;

  for (const keyword of keywords) {
    const pattern = new RegExp(`\\b(${escapeRegExp(escapeHtml(keyword))})\\b`, "gi");
    output = output.replace(pattern, "<strong>$1</strong>");
  }

  return output;
}

function splitTextRuns(text: string, keywords: string[], docx: DocxModule) {
  const { TextRun } = docx;

  if (!keywords.length) return [new TextRun({ text, ...arial11 })];

  const pattern = new RegExp(`\\b(${keywords.map(escapeRegExp).join("|")})\\b`, "gi");
  const runs: InstanceType<typeof TextRun>[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, index), ...arial11 }));
    }
    runs.push(new TextRun({ text: match[0], bold: true, ...arial11 }));
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), ...arial11 }));
  }

  return runs.length ? runs : [new TextRun({ text, ...arial11 })];
}

function toHighlightTerms(keyword: string) {
  const cleaned = keyword
    .replace(/\b(experience|proficiency|awareness|delivery|skills?|requirements?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const terms = new Set<string>();

  if (isUsefulHighlight(cleaned)) {
    terms.add(cleaned);
  }

  for (const token of cleaned.split(/[\s,/|()]+/)) {
    const normalized = token.trim();
    if (isUsefulHighlight(normalized) && isLikelySpecificSkill(normalized)) {
      terms.add(normalized);
    }
  }

  return Array.from(terms);
}

function isUsefulHighlight(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 42) return false;
  if (genericHighlightWords.has(normalized)) return false;
  return true;
}

function isLikelySpecificSkill(value: string) {
  return /[A-Z0-9.#/+]/.test(value) || specificSkillWords.has(value.toLowerCase());
}

const genericHighlightWords = new Set([
  "full",
  "stack",
  "engineer",
  "developer",
  "software",
  "frontend",
  "backend",
  "framework",
  "development",
  "application",
  "applications",
  "production",
  "customer-facing",
  "maintainable",
  "code"
]);

const specificSkillWords = new Set([
  "accessibility",
  "automation",
  "performance",
  "testing",
  "maintainability",
  "react",
  "next.js",
  "typescript",
  "javascript",
  "node.js",
  "postgresql",
  "mongodb",
  "sql",
  "api",
  "apis",
  "aws",
  "vercel",
  "prisma",
  "docker",
  "ci/cd",
  "rbac",
  "llm",
  "ai",
  "websocket",
  "serverless"
]);

function removeTrailingSignoff(letter: string) {
  return letter
    .trim()
    .replace(
      /\n{1,3}(?:thank you,?\s*\n+)?(?:warm regards|kind regards|regards|sincerely|yours sincerely|yours faithfully),?\s*\n(?:[^\n]+(?:\n(?:[^\n]+)){0,4})?\s*$/i,
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
