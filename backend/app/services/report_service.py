"""PDF report generation service using ReportLab."""

from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# Brand colors
PRIMARY = HexColor("#0E7490")
PRIMARY_LIGHT = HexColor("#22D3EE")
DARK = HexColor("#0F172A")
GRAY = HexColor("#64748B")
LIGHT_GRAY = HexColor("#F1F5F9")
WHITE = HexColor("#FFFFFF")
GREEN = HexColor("#10B981")
AMBER = HexColor("#F59E0B")


def generate_pdf_report(assessment: dict, user_name: str = "User") -> BytesIO:
    """Generate a professional PDF report from assessment data."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=PRIMARY,
        spaceAfter=4 * mm,
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        textColor=GRAY,
        spaceAfter=8 * mm,
        alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=PRIMARY,
        spaceBefore=6 * mm,
        spaceAfter=3 * mm,
        fontName="Helvetica-Bold",
    )
    body_style = ParagraphStyle(
        "CustomBody",
        parent=styles["Normal"],
        fontSize=10,
        textColor=DARK,
        spaceAfter=2 * mm,
        leading=14,
    )
    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontSize=9,
        textColor=GRAY,
    )
    value_style = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontSize=10,
        textColor=DARK,
        fontName="Helvetica-Bold",
    )

    elements = []

    # ── Header ─────────────────────────────────────────────
    elements.append(Paragraph("RAINSENSE AI", title_style))
    elements.append(Paragraph(
        "Rooftop Rainwater Harvesting Assessment Report", subtitle_style
    ))
    elements.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=4 * mm))

    # ── Demo Mode Warning ─────────────────────────────────
    if assessment.get("demo_mode", False):
        demo_style = ParagraphStyle(
            "DemoWarning", parent=body_style,
            textColor=AMBER, fontSize=10, fontName="Helvetica-BoldOblique",
        )
        elements.append(Paragraph(
            "⚠ DEMO MODE — Results shown are illustrative and should not be used for actual planning.",
            demo_style
        ))
        elements.append(Spacer(1, 4 * mm))

    # ── User Information ──────────────────────────────────
    elements.append(Paragraph("User Information", section_style))
    location = assessment.get("location", {})
    info_data = [
        ["Name:", user_name],
        ["Location:", f"{location.get('city', '')}, {location.get('state', '')}, {location.get('country', '')}"],
        ["Assessment Date:", assessment.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M"))],
    ]
    elements.append(_make_info_table(info_data, label_style, value_style))

    # ── Rooftop Information ───────────────────────────────
    elements.append(Paragraph("Rooftop Information", section_style))
    roof = assessment.get("roof", {})
    roof_data = [
        ["Roof Area:", f"{roof.get('area_m2', 0)} m²"],
        ["Roof Material:", roof.get("material", "N/A")],
        ["Roof Type:", roof.get("roof_type", "N/A")],
        ["Floors:", str(roof.get("floors", 1))],
        ["Existing RWH:", roof.get("existing_rwh", "Unknown")],
    ]
    elements.append(_make_info_table(roof_data, label_style, value_style))

    # ── AI Analysis ───────────────────────────────────────
    elements.append(Paragraph("AI Analysis", section_style))
    ai = assessment.get("ai_analysis", {})
    ai_data = [
        ["Roof Detected:", "Yes" if ai.get("roof_detected") else "No"],
        ["Detection Confidence:", f"{ai.get('confidence', 0):.1%}"],
        ["Analysis Mode:", ai.get("analysis_mode", "demo").upper()],
        ["Obstacles Detected:", str(len(ai.get("obstacles", [])))],
    ]
    elements.append(_make_info_table(ai_data, label_style, value_style))
    if ai.get("model_info"):
        elements.append(Paragraph(f"<i>{ai['model_info']}</i>", label_style))

    # ── Rainfall Information ──────────────────────────────
    elements.append(Paragraph("Rainfall Information", section_style))
    rain = assessment.get("rainfall", {})
    rain_data = [
        ["Annual Rainfall:", f"{rain.get('annual_mm', 0):,.0f} mm"],
        ["Data Source:", rain.get("source", "demo").replace("_", " ").title()],
        ["Location Used:", rain.get("location_used", "N/A")],
    ]
    elements.append(_make_info_table(rain_data, label_style, value_style))

    # ── Water Harvest Estimation ──────────────────────────
    elements.append(Paragraph("Water Harvest Estimation", section_style))
    calc = assessment.get("calculation", {})
    harvest_data = [
        ["Effective Roof Area:", f"{calc.get('effective_area_m2', 0)} m²"],
        ["Runoff Coefficient:", f"{calc.get('runoff_coefficient', 0):.2f}"],
        ["Annual Harvestable Water:", f"{calc.get('harvestable_litres', 0):,.0f} litres"],
        ["Annual Volume:", f"{calc.get('harvestable_m3', 0):,.2f} m³"],
    ]
    elements.append(_make_info_table(harvest_data, label_style, value_style))

    # ── Readiness Assessment ──────────────────────────────
    elements.append(Paragraph("Readiness Assessment", section_style))
    score = assessment.get("score", {})
    score_total = score.get("total", 0)
    category = score.get("category", "N/A")

    score_color = GREEN if score_total >= 80 else (AMBER if score_total >= 50 else HexColor("#EF4444"))
    score_style = ParagraphStyle(
        "ScoreValue", parent=value_style,
        fontSize=18, textColor=score_color,
    )
    elements.append(Paragraph(f"{score_total}/100 — {category}", score_style))
    elements.append(Spacer(1, 3 * mm))

    # Score breakdown
    breakdown = score.get("breakdown", {})
    if breakdown:
        elements.append(Paragraph("Score Breakdown:", label_style))
        bd_data = [
            ["Factor", "Score", "Max"],
            ["Roof Area", str(breakdown.get("roof_area", 0)), "25"],
            ["Rainfall", str(breakdown.get("rainfall", 0)), "25"],
            ["Roof Material", str(breakdown.get("roof_material", 0)), "20"],
            ["Roof Condition", str(breakdown.get("roof_condition", 0)), "15"],
            ["Obstacles", str(breakdown.get("obstacles", 0)), "15"],
        ]
        bd_table = Table(bd_data, colWidths=[200, 80, 80])
        bd_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
            ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ]))
        elements.append(bd_table)
        elements.append(Spacer(1, 3 * mm))

    # ── Recommendations ───────────────────────────────────
    elements.append(Paragraph("Recommendations", section_style))
    recs = assessment.get("recommendations", {})
    elements.append(Paragraph(
        f"<b>Suggested Storage:</b> {recs.get('storage_litres', 0):,.0f} litres",
        body_style
    ))
    elements.append(Paragraph(recs.get("storage_description", ""), label_style))
    elements.append(Spacer(1, 2 * mm))

    components = recs.get("components", [])
    if components:
        comp_data = [["Component", "Priority", "Est. Cost (₹)"]]
        for c in components:
            comp_data.append([
                c.get("name", ""),
                c.get("priority", "").title(),
                f"₹{c.get('estimated_cost', 0):,.0f}",
            ])
        comp_table = Table(comp_data, colWidths=[200, 100, 100])
        comp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ]))
        elements.append(comp_table)

    # ── Financial Estimate ────────────────────────────────
    elements.append(Paragraph("Financial Estimate", section_style))
    fin_data = [
        ["Estimated Installation Cost:", f"₹{recs.get('total_estimated_cost', 0):,.0f}"],
        ["Estimated Annual Savings:", f"₹{recs.get('annual_savings', 0):,.0f}"],
        ["Estimated Payback:", recs.get("payback_description", "N/A")],
    ]
    elements.append(_make_info_table(fin_data, label_style, value_style))

    # ── Environmental Impact ──────────────────────────────
    elements.append(Paragraph("Environmental Impact", section_style))
    elements.append(Paragraph(
        f"Estimated annual water captured: <b>{calc.get('harvestable_litres', 0):,.0f} litres</b>",
        body_style
    ))

    # ── Disclaimer ────────────────────────────────────────
    elements.append(Spacer(1, 8 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=GRAY, spaceAfter=3 * mm))
    disclaimer_style = ParagraphStyle(
        "Disclaimer", parent=label_style, fontSize=8, textColor=GRAY, leading=10,
    )
    elements.append(Paragraph(
        "<b>Disclaimer:</b> This report is generated by RainSense AI for informational "
        "and educational purposes. The readiness score is an assessment aid and does not "
        "substitute professional structural, plumbing, or site evaluation. Cost estimates "
        "are approximate and may vary by location and market conditions. Rainfall data may "
        "be based on historical averages or demo values. Always consult a qualified "
        "professional before undertaking rainwater harvesting installation.",
        disclaimer_style
    ))
    elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph(
        f"Generated by RainSense AI on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        disclaimer_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def _make_info_table(data, label_style, value_style):
    """Create a styled two-column info table."""
    table_data = []
    for row in data:
        table_data.append([
            Paragraph(row[0], label_style),
            Paragraph(row[1], value_style),
        ])
    table = Table(table_data, colWidths=[160, 300])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return table
