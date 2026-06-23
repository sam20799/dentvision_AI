import nodemailer from 'nodemailer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '../.env.development.local') });
loadEnv({ path: join(__dirname, '../.env.local') });

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};

const CLASS_LABELS = {
  F_Normal: 'Front · Normal',
  F_Breakage: 'Front · Breakage',
  F_Crushed: 'Front · Crushed',
  R_Normal: 'Rear · Normal',
  R_Breakage: 'Rear · Breakage',
  R_Crushed: 'Rear · Crushed',
};

const SEVERITY = {
  F_Normal: 'NONE',
  R_Normal: 'NONE',
  F_Breakage: 'MODERATE',
  R_Breakage: 'MODERATE',
  F_Crushed: 'SEVERE',
  R_Crushed: 'SEVERE',
};

const RECOMMENDATION = {
  F_Normal: 'No damage detected. Vehicle appears in good condition.',
  R_Normal: 'No damage detected. Vehicle appears in good condition.',
  F_Breakage: 'Moderate front breakage detected. Inspect and replace broken parts before next use.',
  R_Breakage: 'Moderate rear breakage detected. Inspect and replace broken parts before next use.',
  F_Crushed: 'Severe front crush damage detected. Structural assessment required — do not drive until inspected.',
  R_Crushed: 'Severe rear crush damage detected. Structural assessment required — do not drive until inspected.',
};

const BG = rgb(0.06, 0.06, 0.1);
const CYAN = rgb(0, 0.83, 1);
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.65, 0.65, 0.65);
const DARK = rgb(0.1, 0.1, 0.15);

async function buildPDF(images, results) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── Cover page ──────────────────────────────────────────────────────────────
  const cover = doc.addPage([595, 842]);
  cover.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: BG });

  // Accent bar
  cover.drawRectangle({ x: 0, y: 800, width: 595, height: 4, color: CYAN });

  cover.drawText('DENT VISION AI', { x: 40, y: 755, size: 30, font: bold, color: CYAN });
  cover.drawText('Vehicle Damage Analysis Report', { x: 40, y: 720, size: 15, font, color: WHITE });
  cover.drawText(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, {
    x: 40, y: 695, size: 10, font, color: GRAY,
  });
  cover.drawText(`Images analyzed: ${results.length}`, { x: 40, y: 678, size: 10, font, color: GRAY });

  // Divider
  cover.drawRectangle({ x: 40, y: 660, width: 515, height: 1, color: rgb(0.2, 0.2, 0.3) });

  // Summary table header
  const cols = [40, 80, 290, 400, 490];
  const headers = ['#', 'Damage Class', 'Confidence', 'Severity'];
  headers.forEach((h, i) => {
    cover.drawText(h, { x: cols[i + 1], y: 640, size: 9, font: bold, color: CYAN });
  });
  cover.drawRectangle({ x: 40, y: 635, width: 515, height: 1, color: rgb(0.15, 0.15, 0.25) });

  results.forEach((r, i) => {
    const y = 618 - i * 22;
    const sev = SEVERITY[r.class] || '—';
    const sevColor = sev === 'SEVERE' ? rgb(1, 0.3, 0.3) : sev === 'MODERATE' ? rgb(1, 0.75, 0) : rgb(0.2, 0.8, 0.4);
    cover.drawText(`${i + 1}`, { x: cols[1], y, size: 9, font, color: GRAY });
    cover.drawText(CLASS_LABELS[r.class] || r.class, { x: cols[2], y, size: 9, font, color: WHITE });
    cover.drawText(`${(r.confidence * 100).toFixed(1)}%`, { x: cols[3], y, size: 9, font, color: WHITE });
    cover.drawText(sev, { x: cols[4], y, size: 9, font: bold, color: sevColor });
  });

  // Footer
  cover.drawText('Powered by Dent Vision AI — AI-Powered Vehicle Damage Detection', {
    x: 40, y: 30, size: 8, font, color: rgb(0.35, 0.35, 0.45),
  });

  // ── Per-image pages ──────────────────────────────────────────────────────────
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const page = doc.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: BG });
    page.drawRectangle({ x: 0, y: 800, width: 595, height: 4, color: CYAN });

    // Header
    page.drawText(`IMAGE ${i + 1} / ${results.length}`, { x: 40, y: 778, size: 8, font, color: CYAN });
    page.drawText(CLASS_LABELS[r.class] || r.class, { x: 40, y: 755, size: 22, font: bold, color: WHITE });

    const sev = SEVERITY[r.class] || '—';
    const sevColor = sev === 'SEVERE' ? rgb(1, 0.3, 0.3) : sev === 'MODERATE' ? rgb(1, 0.75, 0) : rgb(0.2, 0.8, 0.4);
    page.drawRectangle({ x: 40, y: 742, width: 70, height: 16, color: sevColor, opacity: 0.15 });
    page.drawText(sev, { x: 45, y: 746, size: 9, font: bold, color: sevColor });

    // Image
    try {
      const imgBytes = Buffer.from(images[i], 'base64');
      let img;
      try { img = await doc.embedJpg(imgBytes); } catch { img = await doc.embedPng(imgBytes); }
      const { width, height } = img.scale(1);
      const maxW = 515, maxH = 280;
      const scale = Math.min(maxW / width, maxH / height);
      const drawW = width * scale, drawH = height * scale;
      const imgX = 40 + (maxW - drawW) / 2;
      page.drawImage(img, { x: imgX, y: 450, width: drawW, height: drawH });
    } catch {
      page.drawRectangle({ x: 40, y: 450, width: 515, height: 240, color: DARK });
      page.drawText('[Image unavailable]', { x: 250, y: 568, size: 11, font, color: GRAY });
    }

    // Divider
    page.drawRectangle({ x: 40, y: 440, width: 515, height: 1, color: rgb(0.2, 0.2, 0.3) });

    // Meta rows
    const metaY = 422;
    page.drawText('CONFIDENCE', { x: 40, y: metaY, size: 8, font: bold, color: GRAY });
    page.drawText(`${(r.confidence * 100).toFixed(1)}%`, { x: 40, y: metaY - 14, size: 13, font: bold, color: WHITE });

    page.drawText('SEVERITY', { x: 160, y: metaY, size: 8, font: bold, color: GRAY });
    page.drawText(sev, { x: 160, y: metaY - 14, size: 13, font: bold, color: sevColor });

    // Recommendation
    const rec = RECOMMENDATION[r.class] || 'Consult a vehicle damage specialist.';
    page.drawRectangle({ x: 40, y: 370, width: 515, height: 34, color: rgb(0.08, 0.1, 0.16) });
    page.drawText('RECOMMENDATION', { x: 50, y: 394, size: 8, font: bold, color: CYAN });
    page.drawText(rec, { x: 50, y: 378, size: 9, font, color: WHITE, maxWidth: 495 });

    // Score bars
    page.drawText('CLASS PROBABILITIES', { x: 40, y: 350, size: 8, font: bold, color: CYAN });
    page.drawRectangle({ x: 40, y: 345, width: 515, height: 1, color: rgb(0.15, 0.15, 0.25) });

    const scores = Object.entries(r.all_scores || {}).sort((a, b) => b[1] - a[1]);
    scores.forEach(([cls, score], idx) => {
      const y = 328 - idx * 26;
      const barMax = 310;
      const barW = Math.max(score * barMax, 2);
      const isTop = cls === r.class;
      page.drawText(CLASS_LABELS[cls] || cls, { x: 40, y: y + 5, size: 8, font, color: isTop ? WHITE : GRAY });
      page.drawRectangle({ x: 175, y, width: barMax, height: 14, color: DARK });
      page.drawRectangle({ x: 175, y, width: barW, height: 14, color: isTop ? CYAN : rgb(0.22, 0.22, 0.35) });
      page.drawText(`${(score * 100).toFixed(1)}%`, { x: 492, y: y + 4, size: 8, font, color: isTop ? CYAN : GRAY });
    });

    page.drawText('Powered by Dent Vision AI — AI-Powered Vehicle Damage Detection', {
      x: 40, y: 30, size: 8, font, color: rgb(0.35, 0.35, 0.45),
    });
  }

  return await doc.save();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { images, results } = req.body;
  if (!Array.isArray(images) || !Array.isArray(results) || images.length !== results.length) {
    return res.status(400).json({ error: 'Invalid payload: images and results arrays required' });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const recipient = process.env.REPORT_RECIPIENT || 'shubham.2k07@gmail.com';

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: 'Email credentials not configured on server' });
  }

  try {
    const pdfBytes = await buildPDF(images, results);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    await transporter.sendMail({
      from: `Dent Vision AI <${gmailUser}>`,
      to: recipient,
      subject: `Dent Vision AI — Damage Report (${dateStr})`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#0f0f1a;color:#e0e0e0;padding:32px;border-radius:8px;max-width:520px">
          <h2 style="color:#00d4ff;margin:0 0 12px">◈ Dent Vision AI</h2>
          <p style="margin:0 0 8px">Your vehicle damage analysis report is ready.</p>
          <p style="margin:0 0 16px"><strong>${results.length}</strong> image${results.length !== 1 ? 's' : ''} analyzed — see the attached PDF for full details.</p>
          <p style="font-size:12px;color:#666">Generated by Dent Vision AI &mdash; ${new Date().toLocaleString()}</p>
        </div>
      `,
      attachments: [{
        filename: 'dentvision-report.pdf',
        content: Buffer.from(pdfBytes),
        contentType: 'application/pdf',
      }],
    });

    return res.json({ status: 'sent', count: results.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
