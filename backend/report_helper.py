import tempfile, os
from datetime import datetime
from fpdf import FPDF

CLASS_LABELS = {
    "F_Normal":   "NO DAMAGE DETECTED",
    "F_Breakage": "FRONT IMPACT - BREAKAGE",
    "F_Crushed":  "FRONT IMPACT - CRUSHED",
    "R_Normal":   "NO DAMAGE DETECTED",
    "R_Breakage": "REAR IMPACT - BREAKAGE",
    "R_Crushed":  "REAR IMPACT - CRUSHED",
}

SEVERITY = {
    "F_Normal":   "NONE",
    "F_Breakage": "CRITICAL",
    "F_Crushed":  "MODERATE",
    "R_Normal":   "NONE",
    "R_Breakage": "CRITICAL",
    "R_Crushed":  "MODERATE",
}

ZONE = {
    "F_Normal":   "Front Zone",
    "F_Breakage": "Front Zone",
    "F_Crushed":  "Front Zone",
    "R_Normal":   "Rear Zone",
    "R_Breakage": "Rear Zone",
    "R_Crushed":  "Rear Zone",
}

RECOMMENDATION = {
    "Normal":   "Vehicle appears structurally intact. Cosmetic assessment may still be warranted.",
    "Crushed":  "Significant structural damage detected. Immediate professional assessment recommended.",
    "Breakage": "Panel breakage identified. Workshop evaluation and repair estimate advised.",
}


def build_report_pdf(entries: list[tuple[bytes, dict]]) -> bytes:
    """Build a PDF report from a list of (image_bytes, result_dict) entries."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)

    # ── Cover page ────────────────────────────────────────────────────────────
    pdf.add_page()

    # Header bar
    pdf.set_fill_color(2, 4, 8)
    pdf.rect(0, 0, 210, 40, "F")

    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(0, 212, 255)
    pdf.set_y(10)
    pdf.cell(0, 10, "DENT VISION AI", align="C", ln=True)

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(180, 200, 220)
    pdf.cell(0, 8, "VEHICLE DAMAGE ANALYSIS REPORT", align="C", ln=True)

    # Meta info
    pdf.set_y(50)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 6, f"Generated: {datetime.now().strftime('%B %d, %Y  %H:%M')}", align="C", ln=True)
    pdf.cell(0, 6, f"Total Images Analyzed: {len(entries)}", align="C", ln=True)

    # Divider
    pdf.set_y(70)
    pdf.set_draw_color(0, 212, 255)
    pdf.set_line_width(0.5)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())

    # Summary table header
    pdf.set_y(pdf.get_y() + 8)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(40, 40, 40)
    pdf.set_fill_color(230, 240, 255)
    pdf.cell(10, 8, "#", border=1, fill=True, align="C")
    pdf.cell(70, 8, "Classification", border=1, fill=True, align="C")
    pdf.cell(30, 8, "Zone", border=1, fill=True, align="C")
    pdf.cell(30, 8, "Confidence", border=1, fill=True, align="C")
    pdf.cell(50, 8, "Severity", border=1, fill=True, align="C", ln=True)

    pdf.set_font("Helvetica", "", 9)
    for idx, (_, result) in enumerate(entries, 1):
        cls = result.get("class", "Unknown")
        conf = result.get("confidence", 0)
        label = CLASS_LABELS.get(cls, cls)
        zone = ZONE.get(cls, "-")
        sev = SEVERITY.get(cls, "UNKNOWN")

        # Row color based on severity
        if sev == "CRITICAL":
            pdf.set_fill_color(255, 230, 230)
        elif sev == "MODERATE":
            pdf.set_fill_color(255, 245, 220)
        else:
            pdf.set_fill_color(225, 255, 240)

        pdf.cell(10, 7, str(idx), border=1, fill=True, align="C")
        pdf.cell(70, 7, label, border=1, fill=True)
        pdf.cell(30, 7, zone, border=1, fill=True, align="C")
        pdf.cell(30, 7, f"{conf * 100:.1f}%", border=1, fill=True, align="C")
        pdf.cell(50, 7, sev, border=1, fill=True, align="C", ln=True)

    # ── Per-image pages ───────────────────────────────────────────────────────
    for idx, (img_bytes, result) in enumerate(entries, 1):
        pdf.add_page()

        cls = result.get("class", "Unknown")
        conf = result.get("confidence", 0)
        all_scores = result.get("all_scores", {})
        label = CLASS_LABELS.get(cls, cls)
        zone = ZONE.get(cls, "-")
        sev = SEVERITY.get(cls, "UNKNOWN")
        is_demo = result.get("demo", False)

        # Page header
        pdf.set_fill_color(2, 4, 8)
        pdf.rect(0, 0, 210, 14, "F")
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(0, 212, 255)
        pdf.set_y(4)
        pdf.cell(0, 6, f"DENT VISION AI  |  Image {idx} of {len(entries)}", align="C", ln=True)

        # Image
        tmp_img = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
                tmp.write(img_bytes)
                tmp_img = tmp.name
            img_x, img_w, img_h = 15, 85, 64
            pdf.set_y(18)
            pdf.image(tmp_img, x=img_x, y=pdf.get_y(), w=img_w, h=img_h)
        except Exception:
            pass
        finally:
            if tmp_img:
                try:
                    os.unlink(tmp_img)
                except Exception:
                    pass

        # Classification block (right of image)
        text_x = 108
        pdf.set_xy(text_x, 18)

        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(0, 212, 255) if "Normal" in cls else (
            pdf.set_text_color(255, 80, 80) if "Breakage" in cls else pdf.set_text_color(255, 179, 68)
        )
        pdf.multi_cell(90, 7, label, align="L")

        pdf.set_x(text_x)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(45, 6, f"Zone: {zone}", ln=False)
        pdf.cell(45, 6, f"Confidence: {conf * 100:.1f}%", ln=True)
        pdf.set_x(text_x)
        pdf.cell(90, 6, f"Severity: {sev}", ln=True)

        if is_demo:
            pdf.set_x(text_x)
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(200, 148, 58)
            pdf.cell(90, 5, "[ DEMO MODE — no live backend ]", ln=True)

        # Probability bars
        bars_y = 90
        pdf.set_y(bars_y)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(40, 40, 40)
        pdf.cell(0, 6, "CLASS PROBABILITIES", ln=True)

        sorted_scores = sorted(all_scores.items(), key=lambda x: x[1], reverse=True)
        bar_max_w = 100
        for c, score in sorted_scores:
            bar_w = score * bar_max_w
            cy = pdf.get_y()

            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(60, 60, 60)
            pdf.cell(40, 5, c, ln=False)
            pdf.cell(15, 5, f"{score * 100:.1f}%", ln=False, align="R")

            # Background bar
            bx = pdf.get_x() + 2
            pdf.set_fill_color(220, 230, 240)
            pdf.rect(bx, cy + 1, bar_max_w, 3, "F")

            # Filled bar
            if c == cls:
                if "Normal" in c:
                    pdf.set_fill_color(0, 180, 210)
                elif "Breakage" in c:
                    pdf.set_fill_color(220, 60, 60)
                else:
                    pdf.set_fill_color(220, 150, 40)
            else:
                pdf.set_fill_color(160, 180, 200)
            pdf.rect(bx, cy + 1, bar_w, 3, "F")

            pdf.ln(6)

        # Recommendation
        pdf.ln(4)
        pdf.set_draw_color(0, 212, 255)
        pdf.set_line_width(0.4)
        rec_key = next((k for k in RECOMMENDATION if k in cls), "Normal")
        rec_text = RECOMMENDATION[rec_key]
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(0, 5, "AI RECOMMENDATION", ln=True)
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(100, 100, 100)
        pdf.multi_cell(0, 5, rec_text)

        # Footer line
        pdf.set_y(-15)
        pdf.set_draw_color(200, 200, 200)
        pdf.line(15, pdf.get_y(), 195, pdf.get_y())
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(160, 160, 160)
        pdf.cell(0, 5, f"Dent Vision AI  |  dentvision-report.pdf  |  Image {idx}/{len(entries)}", align="C")

    return bytes(pdf.output())
