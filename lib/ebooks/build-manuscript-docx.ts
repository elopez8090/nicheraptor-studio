import {
  AlignmentType,
  Document,
  HeadingLevel,
  PageBreak,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ManuscriptDocument } from "@/lib/ebooks/build-manuscript";

function paragraphBlocks(text: string): Paragraph[] {
  const blocks = text.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);

  if (blocks.length === 0) {
    return [new Paragraph({ children: [new TextRun("")] })];
  }

  return blocks.map(
    (block) =>
      new Paragraph({
        children: [new TextRun(block)],
        spacing: { after: 200, line: 360 },
      }),
  );
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 160 },
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 280, line: 360 },
  });
}

function pageBreakParagraph(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

export async function buildManuscriptDocxBuffer(
  manuscript: ManuscriptDocument,
): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: manuscript.title,
          bold: true,
          size: 56,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 400 },
    }),
    pageBreakParagraph(),
    sectionHeading("Audience"),
    bodyParagraph(manuscript.audience),
    sectionHeading("Goal"),
    bodyParagraph(manuscript.goal),
    sectionHeading("Table of contents"),
  );

  for (const entry of manuscript.toc) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${entry.number}. `, color: "6B7280" }),
          new TextRun({ text: entry.title }),
        ],
        spacing: { after: 100 },
      }),
    );
  }

  for (const chapter of manuscript.chapters) {
    children.push(
      pageBreakParagraph(),
      new Paragraph({
        children: [
          new TextRun({
            text: `Chapter ${chapter.number}`,
            size: 20,
            color: "6B7280",
          }),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 },
      }),
      ...paragraphBlocks(chapter.body),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
