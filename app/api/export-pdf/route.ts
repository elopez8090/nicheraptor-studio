import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { buildManuscriptPrintHtml } from "@/lib/ebooks/build-manuscript-print-html";
import {
  attachmentResponse,
  resolveExportManuscript,
} from "@/lib/ebooks/export-utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const resolved = await resolveExportManuscript(request);
    if (!resolved.ok) {
      return resolved.response;
    }

    const { manuscript, filenameBase, printOptions } = resolved;
    const html = buildManuscriptPrintHtml(manuscript, printOptions);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "18mm",
          right: "16mm",
          bottom: "18mm",
          left: "16mm",
        },
      });

      return attachmentResponse(
        pdfBuffer,
        "application/pdf",
        `${filenameBase}.pdf`,
      );
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error in /api/export-pdf:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 },
    );
  }
}
