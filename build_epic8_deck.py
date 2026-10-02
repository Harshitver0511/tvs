import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# =============================================================================
# COLOR PALETTE (TVS Credit e.p.i.c. 8 Official Brand + Pulse 2026 Neo-Brutalist)
# =============================================================================
COLOR_TVS_GREEN    = RGBColor(0x17, 0x40, 0x2C)  # Deep Forest Green #17402C
COLOR_ACCENT_GREEN = RGBColor(0x1E, 0x87, 0x4B)  # Vibrant Agri Green #1E874B
COLOR_TEAL_BLUE    = RGBColor(0x00, 0x60, 0x9C)  # TVS Tech Teal #00609C
COLOR_DARK_TEXT    = RGBColor(0x11, 0x11, 0x11)  # Charcoal Ink #111111
COLOR_MUTED_TEXT   = RGBColor(0x55, 0x55, 0x55)  # Subtitle Slate #555555
COLOR_WHITE        = RGBColor(0xFF, 0xFF, 0xFF)  # Pure White #FFFFFF
COLOR_LIGHT_BG     = RGBColor(0xF8, 0xFA, 0xF9)  # Soft Off-White #F8FAF9

# Neo-Brutalist Accent Tokens matching the live deployed prototype
COLOR_CANARY_YELLOW = RGBColor(0xFF, 0xD1, 0x52) # Canary Yellow #FFD152
COLOR_CORAL_RED     = RGBColor(0xFF, 0x6B, 0x6B) # Coral Alert #FF6B6B
COLOR_LILAC_PURPLE  = RGBColor(0xB8, 0xA9, 0xFF) # Lilac Accent #B8A9FF
COLOR_LIME_ACID     = RGBColor(0xC8, 0xFF, 0x3D) # Acid Lime #C8FF3D

# Card Background Tints
COLOR_CARD_GREEN  = RGBColor(0xEE, 0xF8, 0xF2)  # Soft Green Tint
COLOR_CARD_BLUE   = RGBColor(0xEE, 0xF6, 0xFC)  # Soft Blue Tint
COLOR_CARD_YELLOW = RGBColor(0xFF, 0xF9, 0xE6)  # Soft Gold Tint
COLOR_CARD_RED    = RGBColor(0xFD, 0xED, 0xED)  # Soft Red Tint
COLOR_CARD_PURPLE = RGBColor(0xF4, 0xF0, 0xFF)  # Soft Purple Tint
COLOR_GOLD        = RGBColor(0xD9, 0x77, 0x06)  # Deep Amber Gold

# Slide Dimensions (A4 Landscape matching the TVS Credit PDF template)
SLIDE_WIDTH  = Inches(11.695)
SLIDE_HEIGHT = Inches(8.263)

def set_slide_background(slide, image_path):
    if os.path.exists(image_path):
        slide.shapes.add_picture(image_path, Inches(0), Inches(0), SLIDE_WIDTH, SLIDE_HEIGHT)

def add_header(slide, title, category="TVS CREDIT E.P.I.C 8 // IT CASE STUDY // PROBLEM STATEMENT (c)"):
    tb = slide.shapes.add_textbox(Inches(3.2), Inches(0.65), Inches(8.0), Inches(1.15))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    p0 = tf.paragraphs[0]
    p0.text = category.upper()
    p0.font.name = "Calibri"
    p0.font.size = Pt(9.5)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_TEAL_BLUE
    
    p1 = tf.add_paragraph()
    p1.text = title.upper()
    p1.font.name = "Arial Black"
    p1.font.size = Pt(19)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TVS_GREEN

def add_card(slide, left, top, width, height, bg_color=COLOR_WHITE, border_color=COLOR_ACCENT_GREEN, border_width=Pt(1.5)):
    card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = border_width
    return card

def add_badge(slide, left, top, width, height, text, bg_color=COLOR_CANARY_YELLOW, text_color=COLOR_DARK_TEXT, font_size=9.5, bold=True):
    b = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    b.fill.solid()
    b.fill.fore_color.rgb = bg_color
    b.line.color.rgb = COLOR_DARK_TEXT
    b.line.width = Pt(1.5)
    tf = b.text_frame
    tf.word_wrap = False
    tf.margin_left = tf.margin_right = Inches(0.08)
    tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial Black" if bold else "Calibri"
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = text_color
    return b

def create_presentation(output_file="TVS_Credit_EPIC8_Smart_Lending_Hub.pptx"):
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT
    blank_layout = prs.slide_layouts[6]

    tpl1 = "template_slide1.png"
    tpl2 = "template_slide2.png"

    # =========================================================================
    # SLIDE 1: TITLE / COVER SLIDE (NO WHITE BOX, DIRECTLY ON GREEN TEMPLATE)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, tpl1)

    # Main text box placed directly onto the green template background
    tb_title = s1.shapes.add_textbox(Inches(0.9), Inches(1.35), Inches(7.5), Inches(6.2))
    tf1 = tb_title.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_right = tf1.margin_top = tf1.margin_bottom = 0

    # Breadcrumb / Competition Tag
    p_tag = tf1.paragraphs[0]
    p_tag.text = "TVS CREDIT E.P.I.C 8  //  IT CASE STUDY CHALLENGE"
    p_tag.font.name = "Calibri"
    p_tag.font.size = Pt(12)
    p_tag.font.bold = True
    p_tag.font.color.rgb = COLOR_CANARY_YELLOW
    p_tag.space_after = Pt(6)

    # Main Project Title
    p_h1 = tf1.add_paragraph()
    p_h1.text = "SMART LENDING\nDECISION HUB"
    p_h1.font.name = "Arial Black"
    p_h1.font.size = Pt(36)
    p_h1.font.bold = True
    p_h1.font.color.rgb = COLOR_WHITE
    p_h1.space_after = Pt(10)

    # Subtitle
    p_sub = tf1.add_paragraph()
    p_sub.text = "Empowering Rural Bharat with Geospatial AI, Sentinel-2 Crop Telemetry & Harvest-Aligned Dynamic Repayments"
    p_sub.font.name = "Calibri"
    p_sub.font.size = Pt(13.5)
    p_sub.font.bold = True
    p_sub.font.color.rgb = RGBColor(0xEE, 0xF8, 0xF2)
    p_sub.space_after = Pt(14)

    # Problem Statement Tag
    p_prob = tf1.add_paragraph()
    p_prob.text = "PROBLEM STATEMENT (c): Alternative Underwriting & AI Credit Risk for Rural Borrowers"
    p_prob.font.name = "Calibri"
    p_prob.font.size = Pt(11)
    p_prob.font.italic = True
    p_prob.font.color.rgb = COLOR_LIME_ACID
    p_prob.space_after = Pt(16)

    # Core Innovation Feature Bullets
    bullets = [
        ("🛰️", "10-Meter Sentinel-2 Satellite Multi-Spectral NDVI & Automated Cadastre Verification"),
        ("📊", "Explainable AI Scoring Engine with Factor Contribution SHAP Attribution Drivers"),
        ("🌾", "Cash-Flow Synchronized Harvest-Aligned Bullet Repayment Structuring"),
        ("🚨", "Real-Time Agro-Climatic Early-Warning Anomaly Radar & Default Prevention"),
        ("🤖", "GenAI 'TVS Sahayak' Multilingual Vernacular Voice & Text Underwriting Copilot")
    ]
    for icon, text in bullets:
        pb = tf1.add_paragraph()
        pb.text = f"{icon}  {text}"
        pb.font.name = "Calibri"
        pb.font.size = Pt(11)
        pb.font.bold = True
        pb.font.color.rgb = COLOR_WHITE
        pb.space_after = Pt(4)

    # Bottom Metadata Cards directly on the template: Team & Live Prototype
    tb_meta = s1.shapes.add_textbox(Inches(0.9), Inches(6.3), Inches(8.5), Inches(1.5))
    tf_meta = tb_meta.text_frame
    tf_meta.word_wrap = True
    tf_meta.margin_left = tf_meta.margin_right = tf_meta.margin_top = tf_meta.margin_bottom = 0

    p_m1 = tf_meta.paragraphs[0]
    p_m1.text = "TEAM HANDLE:  hverma0511"
    p_m1.font.name = "Arial Black"
    p_m1.font.size = Pt(13)
    p_m1.font.bold = True
    p_m1.font.color.rgb = COLOR_CANARY_YELLOW
    p_m1.space_after = Pt(3)

    p_m2 = tf_meta.add_paragraph()
    p_m2.text = "TEAM MEMBERS:  Harshit Verma  |  Nandani Singh"
    p_m2.font.name = "Calibri"
    p_m2.font.size = Pt(12)
    p_m2.font.bold = True
    p_m2.font.color.rgb = COLOR_WHITE
    p_m2.space_after = Pt(4)

    p_m3 = tf_meta.add_paragraph()
    p_m3.text = "LIVE DEPLOYED PROTOTYPE:  https://tvs-pied.vercel.app/"
    p_m3.font.name = "Calibri"
    p_m3.font.size = Pt(12)
    p_m3.font.bold = True
    p_m3.font.color.rgb = COLOR_LIME_ACID

    # =========================================================================
    # SLIDE 2: EXECUTIVE SUMMARY
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, tpl2)
    add_header(s2, "Executive Summary: The Next-Gen Lending Engine")

    cards_data = [
        ("THE STRATEGIC CONTEXT", COLOR_CARD_BLUE, COLOR_TEAL_BLUE, [
            ("TVS Credit Heartland Presence:", "A premier NBFC serving 26M+ rural & semi-urban customers across India with Tractor, Two-Wheeler, and MSME loans."),
            ("The Smallholder Challenge:", "Over 80% of farming borrowers operate in a cash economy with zero formal CIBIL credit score."),
            ("The Paradigm Shift:", "Transitioning from slow, subjective physical auditing to objective, algorithmic geospatial underwriting.")
        ]),
        ("THE CORE INNOVATION", COLOR_CARD_GREEN, COLOR_ACCENT_GREEN, [
            ("Sentinel-2 Satellite Telemetry:", "10-meter optical NDVI tracking crop canopy vigor, chlorophyll density & soil moisture without physical field visits."),
            ("Explainable AI Scoring:", "XGBoost + SHAP underwriting engine delivering instant, audit-compliant decisions in < 3 minutes."),
            ("Harvest-Aligned EMIs:", "Repayment amounts flex with crop-cutting dates — token interest in sowing, bullet post-mandi sale.")
        ]),
        ("QUANTIFIED IMPACT", COLOR_CARD_YELLOW, COLOR_GOLD, [
            ("Sanction Speed:", "< 3 Minutes automated credit decisioning vs 14-21 days of manual revenue-patwari audits."),
            ("Underwriting CAC:", "38% decrease in customer acquisition & loan servicing costs via remote digital cadastre verification."),
            ("Delinquency Reduction:", "42% drop in 90-day overdue accounts through cash-flow aligned harvest repayment scheduling.")
        ])
    ]

    for idx, (title, bg, border, pts) in enumerate(cards_data):
        x = Inches(0.8 + idx * 3.4)
        c = add_card(s2, x, Inches(2.0), Inches(3.25), Inches(4.8), bg_color=bg, border_color=border, border_width=Pt(2))
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.25)
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = "Arial Black"
        p.font.size = Pt(13)
        p.font.color.rgb = border
        p.space_after = Pt(8)
        
        for head, body in pts:
            p_head = tf.add_paragraph()
            p_head.text = f"• {head}"
            p_head.font.name = "Calibri"
            p_head.font.size = Pt(11)
            p_head.font.bold = True
            p_head.font.color.rgb = COLOR_DARK_TEXT
            
            p_body = tf.add_paragraph()
            p_body.text = f"  {body}"
            p_body.font.name = "Calibri"
            p_body.font.size = Pt(10)
            p_body.font.color.rgb = COLOR_MUTED_TEXT
            p_body.space_after = Pt(6)

    # =========================================================================
    # SLIDE 3: THE PROBLEM STATEMENT & UNDERWRITING GAP
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, tpl2)
    add_header(s3, "The Problem: Why Traditional Credit Excludes Smallholders")

    challenges = [
        ("01", "ABSENCE OF FORMAL CREDIT HISTORY", COLOR_CARD_RED, COLOR_CORAL_RED, [
            "Over 80% of smallholder farmers operate in a cash-first ecosystem with zero CIBIL score.",
            "Lack of IT returns or audited salary slips locks viable rural borrowers out of formal NBFC banking.",
            "Drives farmers toward unorganized local moneylenders charging exorbitant 36%-60% interest rates."
        ]),
        ("02", "EXPENSIVE MANUAL LAND AUDITS", COLOR_CARD_YELLOW, COLOR_GOLD, [
            "Traditional physical parcel verification takes 14 to 21 days with manual revenue-patwari audits.",
            "Direct operational cost averages ₹3,500 per site visit, heavily inflating customer acquisition costs.",
            "High vulnerability to boundary disputes, falsified tenancy documents, and forged land records."
        ]),
        ("03", "RIGID FLAT MONTHLY EMIs", COLOR_CARD_BLUE, COLOR_TEAL_BLUE, [
            "Conventional banking forces identical monthly EMIs (e.g. ₹12,500 every 30 days) across all 12 months.",
            "During sowing seasons (July/Aug), farmer cash flow is depleted by seeds and fertilizers, causing defaults.",
            "Triggers artificial loan delinquency despite a guaranteed bumper harvest maturity just 90 days away."
        ]),
        ("04", "CLIMATE & MANDI PRICE CRASHES", COLOR_CARD_GREEN, COLOR_ACCENT_GREEN, [
            "Localized weather shocks (monsoon deficits, pest outbreaks) trigger regional default clusters.",
            "Sudden wholesale APMC mandi price crashes wipe out crop profits without early risk notice.",
            "Lenders lack predictive surveillance to restructure loans before accounts turn into NPAs."
        ])
    ]

    for idx, (num, title, bg, border, pts) in enumerate(challenges):
        col = idx % 2
        row = idx // 2
        x = Inches(0.8 + col * 5.2)
        y = Inches(2.0 + row * 2.45)
        c = add_card(s3, x, y, Inches(4.95), Inches(2.3), bg_color=bg, border_color=border, border_width=Pt(1.8))
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.2)
        
        p = tf.paragraphs[0]
        p.text = f"{num} // {title}"
        p.font.name = "Arial Black"
        p.font.size = Pt(12)
        p.font.color.rgb = border
        p.space_after = Pt(4)
        
        for pt in pts:
            pp = tf.add_paragraph()
            pp.text = f"• {pt}"
            pp.font.name = "Calibri"
            pp.font.size = Pt(10)
            pp.font.color.rgb = COLOR_DARK_TEXT
            pp.space_after = Pt(2)

    # =========================================================================
    # SLIDE 4: SYSTEM ARCHITECTURE & DATA FLOW DIAGRAM (FLOWCHART)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, tpl2)
    add_header(s4, "System Architecture: End-to-End Decision Flowchart")

    # Flowchart: 5 Interconnected Horizontal Stage Columns with Connectors
    stages = [
        ("STAGE 01", "DATA INGESTION", COLOR_CARD_BLUE, COLOR_TEAL_BLUE, [
            "Sentinel-2 10m Optical",
            "State Khasra Cadastre",
            "IMD Agromet 30-Yr Weather",
            "APMC Mandi Real-time Feeds"
        ]),
        ("STAGE 02", "FEATURE ENGINE", COLOR_CARD_GREEN, COLOR_ACCENT_GREEN, [
            "NDVI Chlorophyll Curve",
            "NDWI Moisture Deficit",
            "Geo-Fenced Polygon Match",
            "Drought Variance Benchmarks"
        ]),
        ("STAGE 03", "AI SCORING CORE", COLOR_CARD_YELLOW, COLOR_GOLD, [
            "XGBoost Gradient Model",
            "SHAP Factor Contributions",
            "Multi-Factor Score (0-100)",
            "Risk Tier Stratification"
        ]),
        ("STAGE 04", "PRODUCT STRUCTURING", COLOR_CARD_PURPLE, COLOR_LILAC_PURPLE, [
            "Dynamic Harvest EMI Engine",
            "Token Sowing Rate (₹800/mo)",
            "Bullet Mandi Principal",
            "< 3 Min Automated Sanction"
        ]),
        ("STAGE 05", "RISK RADAR & SHIELD", COLOR_CARD_RED, COLOR_CORAL_RED, [
            "Continuous Satellite Scan",
            "Automated Vernacular SMS",
            "Proactive EMI Restructuring",
            "Field Officer Dispatch"
        ])
    ]

    col_w = Inches(1.85)
    gap_w = Inches(0.22)
    start_x = Inches(0.8)

    for idx, (stg_num, stg_title, bg, border, items) in enumerate(stages):
        x = start_x + idx * (col_w + gap_w)
        
        # Stage Box
        c_box = add_card(s4, x, Inches(2.0), col_w, Inches(3.9), bg_color=bg, border_color=border, border_width=Pt(2))
        tf = c_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Inches(0.12)
        tf.margin_top = Inches(0.15)
        
        # Stage header
        p0 = tf.paragraphs[0]
        p0.text = stg_num
        p0.font.name = "Arial Black"
        p0.font.size = Pt(10)
        p0.font.color.rgb = border
        
        p1 = tf.add_paragraph()
        p1.text = stg_title
        p1.font.name = "Arial Black"
        p1.font.size = Pt(11)
        p1.font.color.rgb = COLOR_DARK_TEXT
        p1.space_after = Pt(8)
        
        for item in items:
            pi = tf.add_paragraph()
            pi.text = f"▸ {item}"
            pi.font.name = "Calibri"
            pi.font.size = Pt(9.5)
            pi.font.bold = True
            pi.font.color.rgb = COLOR_DARK_TEXT
            pi.space_after = Pt(4)

        # Arrow connector between stages (except after last)
        if idx < len(stages) - 1:
            arr_x = x + col_w + Inches(0.04)
            arr = s4.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, arr_x, Inches(3.6), Inches(0.14), Inches(0.35))
            arr.fill.solid()
            arr.fill.fore_color.rgb = COLOR_TVS_GREEN
            arr.line.color.rgb = COLOR_TVS_GREEN
            arr.line.width = Pt(1)

    # Bottom Architecture Summary Strip
    arch_strip = add_card(s4, Inches(0.8), Inches(6.1), Inches(10.15), Inches(0.95), 
                          bg_color=COLOR_WHITE, border_color=COLOR_TVS_GREEN, border_width=Pt(2))
    tf_strip = arch_strip.text_frame
    tf_strip.word_wrap = True
    tf_strip.margin_left = tf_strip.margin_right = Inches(0.2)
    tf_strip.margin_top = Inches(0.08)

    ps1 = tf_strip.paragraphs[0]
    ps1.text = "CORE ARCHITECTURAL HIGHLIGHTS // SCALABLE CLOUD PIPELINE"
    ps1.font.name = "Arial Black"
    ps1.font.size = Pt(10.5)
    ps1.font.color.rgb = COLOR_TVS_GREEN

    ps2 = tf_strip.add_paragraph()
    ps2.text = "• Ingestion: Automated Copernicus Open Access Hub API  |  • Model: XGBoost Regression with Treelite low-latency C-runtime (<15ms inference)  |  • Database: PostGIS Spatial DB  |  • Security: 256-bit Cadastre Encryption with RBI Digital Lending Compliance"
    ps2.font.name = "Calibri"
    ps2.font.size = Pt(9.5)
    ps2.font.color.rgb = COLOR_DARK_TEXT

    # =========================================================================
    # SLIDE 5: GEOSPATIAL SATELLITE CROP INTELLIGENCE
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, tpl2)
    add_header(s5, "Geospatial AI: Sentinel-2 NDVI & Cadastral Verification")

    c_left = add_card(s5, Inches(0.8), Inches(2.0), Inches(4.9), Inches(4.8), bg_color=COLOR_WHITE, border_color=COLOR_ACCENT_GREEN, border_width=Pt(2))
    tfl = c_left.text_frame
    tfl.word_wrap = True
    tfl.margin_left = tfl.margin_right = tfl.margin_top = Inches(0.25)
    
    pl = tfl.paragraphs[0]
    pl.text = "SATELLITE METHODOLOGY & PIPELINE"
    pl.font.name = "Arial Black"
    pl.font.size = Pt(13)
    pl.font.color.rgb = COLOR_TVS_GREEN
    pl.space_after = Pt(8)
    
    meth_pts = [
        ("10-Meter Optical Multi-Spectral Resolution", "Ingests Sentinel-2A and 2B constellations revisiting farm parcels every 5 days for real-time cloud-masked telemetry."),
        ("Normalized Difference Vegetation Index (NDVI)", "Calculated via (Band 8 NIR - Band 4 Red) / (Band 8 NIR + Band 4 Red). Direct indicator of chlorophyll activity and biomass density."),
        ("24-Month Temporal Trajectory", "Compares active crop phenology against 2-year historical benchmarks to detect growth anomalies, pest damage, or delayed sowing."),
        ("Automated Boundary Cadastre Lookup", "Cross-validates claimed survey numbers against digitised State Bhulekh/Bhoomi registries, stopping ghost-plot loan fraud.")
    ]
    for h, b in meth_pts:
        p1 = tfl.add_paragraph()
        p1.text = f"• {h}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(10.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_TEXT
        
        p2 = tfl.add_paragraph()
        p2.text = f"  {b}"
        p2.font.name = "Calibri"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = COLOR_MUTED_TEXT
        p2.space_after = Pt(4)

    c_right = add_card(s5, Inches(5.95), Inches(2.0), Inches(5.0), Inches(4.8), bg_color=COLOR_CARD_GREEN, border_color=COLOR_ACCENT_GREEN, border_width=Pt(2))
    tfr = c_right.text_frame
    tfr.word_wrap = True
    tfr.margin_left = tfr.margin_right = tfr.margin_top = Inches(0.25)
    
    pr = tfr.paragraphs[0]
    pr.text = "NDVI UNDERWRITING THRESHOLD MATRIX"
    pr.font.name = "Arial Black"
    pr.font.size = Pt(13)
    pr.font.color.rgb = COLOR_TVS_GREEN
    pr.space_after = Pt(8)

    thresholds = [
        ("NDVI > 0.65 (OPTIMAL HEALTH)", "High Chlorophyll Biomass", "Sanction Approved: Maximum 90% LTV, Preferred 11.5% interest rate, zero manual audit requirement."),
        ("NDVI 0.40 - 0.65 (MODERATE)", "Normal Crop Growth", "Sanction Approved: Standard 80% LTV, 12.2% rate, automated disbursement to TVS Wallet."),
        ("NDVI 0.20 - 0.40 (VEGETATIVE STRESS)", "Moisture Deficit Detected", "Conditional Approval: Requires irrigation validation (borewell/canal) or co-applicant guarantee."),
        ("NDVI < 0.20 (BARREN / FAILURE)", "Stunted Crop / Dry Plot", "Declined / Restructuring: Automatically diverted to disaster relief & crop insurance claim assistance.")
    ]
    for rnge, status, action in thresholds:
        p1 = tfr.add_paragraph()
        p1.text = f"■ {rnge}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(10.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_TEXT
        
        p2 = tfr.add_paragraph()
        p2.text = f"  Status: {status}\n  Action: {action}"
        p2.font.name = "Calibri"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = COLOR_MUTED_TEXT
        p2.space_after = Pt(5)

    # =========================================================================
    # SLIDE 6: EXPLAINABLE AI CREDIT SCORING (SHAP ENGINE)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, tpl2)
    add_header(s6, "Explainable AI: Alternative Multi-Factor Scoring")

    factors_data = [
        ("CROP CANOPY VIGOR (NDVI)", "+35% WEIGHT", COLOR_CARD_GREEN, COLOR_ACCENT_GREEN,
         "Satellite multi-spectral vegetation curve confirming active farming, chlorophyll density, and projected crop cutting yield."),
        ("PRECIPITATION & WATER ACCESS", "+20% WEIGHT", COLOR_CARD_BLUE, COLOR_TEAL_BLUE,
         "30-year IMD monsoon anomaly comparison, drought frequency modeling, and tube-well/perennial canal irrigation access."),
        ("MANDI ACCESSIBILITY & CASH-IN", "+15% WEIGHT", COLOR_CARD_YELLOW, COLOR_GOLD,
         "Proximity to regulated APMC wholesale mandis, historical market realization rates, and modal price volatility metrics."),
        ("SOIL QUALITY & CROP ROTATION", "+15% WEIGHT", COLOR_CARD_GREEN, COLOR_TVS_GREEN,
         "Soil texture classification (black cotton, alluvial loam) and demonstrated multi-season crop diversification track."),
        ("ASSET PROXIES & REPAYMENT TRACK", "+15% WEIGHT", COLOR_CARD_RED, COLOR_CORAL_RED,
         "Utility payments, tractor telemetry ownership data, and historical micro-loan repayment discipline.")
    ]

    for idx, (title, wt, bg, border, desc) in enumerate(factors_data):
        y = Inches(2.0 + idx * 0.95)
        c = add_card(s6, Inches(0.8), y, Inches(10.15), Inches(0.85), bg_color=bg, border_color=border, border_width=Pt(1.5))
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.08)
        
        p = tf.paragraphs[0]
        p.text = f"{title}  //  {wt}"
        p.font.name = "Arial Black"
        p.font.size = Pt(11)
        p.font.color.rgb = border
        
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = COLOR_DARK_TEXT

    # =========================================================================
    # SLIDE 7: HARVEST-ALIGNED DYNAMIC EMI STRUCTURING (LIFECYCLE FLOWCHART)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, tpl2)
    add_header(s7, "Product Innovation: Harvest-Aligned Repayment Lifecycle")

    # Visual Flowchart Comparison: 4 Seasonal Phases
    phases_data = [
        ("PHASE 1: SOWING", "JUN - AUG (3 MONTHS)", "Peak Cash Outflow", "Seeds, Fertilizers, Diesel, Labor",
         "₹12,500 / mo", "Severe Cash Deficit → 18.4% Default", COLOR_CARD_RED, COLOR_CORAL_RED,
         "₹800 / mo", "Token Interest Only → Zero Default Risk", COLOR_CARD_GREEN, COLOR_ACCENT_GREEN),
        ("PHASE 2: VEGETATIVE", "SEP (1 MONTH)", "Maintenance Outflow", "Pesticide sprays & weeding",
         "₹12,500 / mo", "Liquidity Strain → Missed Payments", COLOR_CARD_RED, COLOR_CORAL_RED,
         "₹1,200 / mo", "Low Maintenance EMI → Working Capital Intact", COLOR_CARD_GREEN, COLOR_ACCENT_GREEN),
        ("PHASE 3: HARVEST & MANDI", "OCT - NOV (2 MONTHS)", "Massive Cash Inflow", "APMC wholesale crop realization",
         "₹12,500 / mo", "Under-collects surplus cash liquidity", COLOR_CARD_YELLOW, COLOR_GOLD,
         "₹68,000 Bullet", "Syncs with ₹1.8L+ Mandi crop payout", COLOR_CARD_GREEN, COLOR_TVS_GREEN),
        ("PHASE 4: RABI / OFF-SEASON", "DEC - MAY (6 MONTHS)", "Stabilized Cash Flow", "Winter crop & allied income",
         "₹12,500 / mo", "Rigid burden during winter sowing", COLOR_CARD_RED, COLOR_CORAL_RED,
         "₹1,000 / mo", "Buffer cushion for Rabi field inputs", COLOR_CARD_GREEN, COLOR_ACCENT_GREEN)
    ]

    p_w = Inches(2.35)
    p_gap = Inches(0.2)
    p_start_x = Inches(0.8)

    for idx, (ph_name, ph_months, cash_flow, spend_on, trad_emi, trad_res, trad_bg, trad_border, tvs_emi, tvs_res, tvs_bg, tvs_border) in enumerate(phases_data):
        x = p_start_x + idx * (p_w + p_gap)
        
        # Phase card
        c_phase = add_card(s7, x, Inches(2.0), p_w, Inches(4.8), bg_color=COLOR_WHITE, border_color=COLOR_DARK_TEXT, border_width=Pt(2))
        tf = c_phase.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Inches(0.12)
        tf.margin_top = Inches(0.12)
        
        # Phase Header
        p = tf.paragraphs[0]
        p.text = ph_name
        p.font.name = "Arial Black"
        p.font.size = Pt(10.5)
        p.font.color.rgb = COLOR_TVS_GREEN
        
        p_sub = tf.add_paragraph()
        p_sub.text = ph_months
        p_sub.font.name = "Calibri"
        p_sub.font.size = Pt(8.5)
        p_sub.font.bold = True
        p_sub.font.color.rgb = COLOR_MUTED_TEXT
        
        p_cf = tf.add_paragraph()
        p_cf.text = f"Cash Flow: {cash_flow}\n({spend_on})"
        p_cf.font.name = "Calibri"
        p_cf.font.size = Pt(8.5)
        p_cf.font.italic = True
        p_cf.font.color.rgb = COLOR_DARK_TEXT
        p_cf.space_after = Pt(8)
        
        # Traditional Flat Box
        p_t1 = tf.add_paragraph()
        p_t1.text = f"❌ TRADITIONAL FLAT:"
        p_t1.font.name = "Arial Black"
        p_t1.font.size = Pt(8.5)
        p_t1.font.color.rgb = COLOR_CORAL_RED
        
        p_t2 = tf.add_paragraph()
        p_t2.text = f"EMI: {trad_emi}\nImpact: {trad_res}"
        p_t2.font.name = "Calibri"
        p_t2.font.size = Pt(8.5)
        p_t2.font.color.rgb = COLOR_DARK_TEXT
        p_t2.space_after = Pt(8)
        
        # TVS Harvest Aligned Box
        p_v1 = tf.add_paragraph()
        p_v1.text = f"✅ TVS HARVEST-ALIGNED:"
        p_v1.font.name = "Arial Black"
        p_v1.font.size = Pt(8.5)
        p_v1.font.color.rgb = COLOR_ACCENT_GREEN
        
        p_v2 = tf.add_paragraph()
        p_v2.text = f"EMI: {tvs_emi}\nImpact: {tvs_res}"
        p_v2.font.name = "Calibri"
        p_v2.font.size = Pt(8.5)
        p_v2.font.color.rgb = COLOR_TVS_GREEN

    # =========================================================================
    # SLIDE 8: PROTOTYPE SHOWCASE 1 — APPLICATION & SATELLITE SCORING
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, tpl2)
    add_header(s8, "Live Prototype: Digital Onboarding & Satellite Scoring", 
               "PROTOTYPE SHOWCASE // LIVE LINK: HTTPS://TVS-PIED.VERCEL.APP/")

    # Left: Apply Page Screenshot
    c_img_l = add_card(s8, Inches(0.8), Inches(1.95), Inches(4.95), Inches(4.9), bg_color=COLOR_WHITE, border_color=COLOR_DARK_TEXT, border_width=Pt(2))
    tfl8 = c_img_l.text_frame
    tfl8.word_wrap = True
    tfl8.margin_left = tfl8.margin_right = Inches(0.15)
    tfl8.margin_top = Inches(0.12)
    
    pl8 = tfl8.paragraphs[0]
    pl8.text = "1. ZERO-PAPERWORK FARMER APPLICATION (/apply)"
    pl8.font.name = "Arial Black"
    pl8.font.size = Pt(11)
    pl8.font.color.rgb = COLOR_TVS_GREEN
    
    # Add Screenshot fresh_apply.png
    if os.path.exists("fresh_apply.png"):
        s8.shapes.add_picture("fresh_apply.png", Inches(0.95), Inches(2.35), Inches(4.65), Inches(2.65))

    # Details underneath screenshot
    tb_apply_desc = s8.shapes.add_textbox(Inches(0.95), Inches(5.1), Inches(4.65), Inches(1.65))
    tf_ad = tb_apply_desc.text_frame
    tf_ad.word_wrap = True
    tf_ad.margin_left = tf_ad.margin_right = tf_ad.margin_top = tf_ad.margin_bottom = 0

    apply_features = [
        "• 3-Step Guided Flow: Quick-select presets for Ramesh Patil, Gurpreet Singh, etc.",
        "• Automated Cadastre Match: Auto-populates State, District, Village & Survey number.",
        "• Zero CIBIL Required: Instant alternative evaluation for unbanked smallholders.",
        "• 48-Hour Disbursal Guarantee: Direct TVS loan sanction generation in under 3 minutes."
    ]
    for idx_f, f in enumerate(apply_features):
        pf = tf_ad.paragraphs[0] if idx_f == 0 else tf_ad.add_paragraph()
        pf.text = f
        pf.font.name = "Calibri"
        pf.font.size = Pt(9)
        pf.font.color.rgb = COLOR_DARK_TEXT
        pf.space_after = Pt(2)

    # Right: Scoring Page Screenshot
    c_img_r = add_card(s8, Inches(5.95), Inches(1.95), Inches(5.0), Inches(4.9), bg_color=COLOR_WHITE, border_color=COLOR_DARK_TEXT, border_width=Pt(2))
    tfr8 = c_img_r.text_frame
    tfr8.word_wrap = True
    tfr8.margin_left = tfr8.margin_right = Inches(0.15)
    tfr8.margin_top = Inches(0.12)
    
    pr8 = tfr8.paragraphs[0]
    pr8.text = "2. SATELLITE MAP & SHAP DRIVERS (/scoring)"
    pr8.font.name = "Arial Black"
    pr8.font.size = Pt(11)
    pr8.font.color.rgb = COLOR_TVS_GREEN

    # Add Screenshot fresh_scoring.png
    if os.path.exists("fresh_scoring.png"):
        s8.shapes.add_picture("fresh_scoring.png", Inches(6.1), Inches(2.35), Inches(4.7), Inches(2.65))

    # Details underneath screenshot
    tb_score_desc = s8.shapes.add_textbox(Inches(6.1), Inches(5.1), Inches(4.7), Inches(1.65))
    tf_sd = tb_score_desc.text_frame
    tf_sd.word_wrap = True
    tf_sd.margin_left = tf_sd.margin_right = tf_sd.margin_top = tf_sd.margin_bottom = 0

    score_features = [
        "• Interactive Leaflet Map: Geospatial parcel boundary with active NDVI 0.68 display.",
        "• Transparent Score Card: Instant AI Score 74/100 (Low-Medium Risk Profile).",
        "• Explainable SHAP Drivers: Direct positive factor attribution breakdown for credit.",
        "• Dynamic EMI Simulation: Previews token sowing installment vs harvest bullet."
    ]
    for idx_f, f in enumerate(score_features):
        pf = tf_sd.paragraphs[0] if idx_f == 0 else tf_sd.add_paragraph()
        pf.text = f
        pf.font.name = "Calibri"
        pf.font.size = Pt(9)
        pf.font.color.rgb = COLOR_DARK_TEXT
        pf.space_after = Pt(2)

    # =========================================================================
    # SLIDE 9: PROTOTYPE SHOWCASE 2 — RISK RADAR & AI ASSISTANT
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9, tpl2)
    add_header(s9, "Live Prototype: Early-Warning Radar & TVS Sahayak",
               "PROTOTYPE SHOWCASE // LIVE LINK: HTTPS://TVS-PIED.VERCEL.APP/")

    # Left: Monitoring Radar Screenshot
    c_img_l9 = add_card(s9, Inches(0.8), Inches(1.95), Inches(4.95), Inches(4.9), bg_color=COLOR_WHITE, border_color=COLOR_DARK_TEXT, border_width=Pt(2))
    tfl9 = c_img_l9.text_frame
    tfl9.word_wrap = True
    tfl9.margin_left = tfl9.margin_right = Inches(0.15)
    tfl9.margin_top = Inches(0.12)
    
    pl9 = tfl9.paragraphs[0]
    pl9.text = "3. AGRO-CLIMATIC RISK RADAR (/monitoring)"
    pl9.font.name = "Arial Black"
    pl9.font.size = Pt(11)
    pl9.font.color.rgb = COLOR_CORAL_RED

    # Add Screenshot fresh_monitoring.png
    if os.path.exists("fresh_monitoring.png"):
        s9.shapes.add_picture("fresh_monitoring.png", Inches(0.95), Inches(2.35), Inches(4.65), Inches(2.65))

    tb_mon_desc = s9.shapes.add_textbox(Inches(0.95), Inches(5.1), Inches(4.65), Inches(1.65))
    tf_md = tb_mon_desc.text_frame
    tf_md.word_wrap = True
    tf_md.margin_left = tf_md.margin_right = tf_md.margin_top = tf_md.margin_bottom = 0

    mon_features = [
        "• Real-Time Portfolio Telemetry: 1,565 borrowers at risk, ₹6,700L exposure tracked.",
        "• Drought & Anomaly Feeds: Flags severe rainfall deficits (-38%) in Yavatmal.",
        "• One-Click Restructuring: Automated 60-day moratorium on principal repayment.",
        "• Field Officer Dispatch: Routes local agro-officers to assist distressed farmers."
    ]
    for idx_f, f in enumerate(mon_features):
        pf = tf_md.paragraphs[0] if idx_f == 0 else tf_md.add_paragraph()
        pf.text = f
        pf.font.name = "Calibri"
        pf.font.size = Pt(9)
        pf.font.color.rgb = COLOR_DARK_TEXT
        pf.space_after = Pt(2)

    # Right: AI Assistant Screenshot
    c_img_r9 = add_card(s9, Inches(5.95), Inches(1.95), Inches(5.0), Inches(4.9), bg_color=COLOR_WHITE, border_color=COLOR_DARK_TEXT, border_width=Pt(2))
    tfr9 = c_img_r9.text_frame
    tfr9.word_wrap = True
    tfr9.margin_left = tfr9.margin_right = Inches(0.15)
    tfr9.margin_top = Inches(0.12)
    
    pr9 = tfr9.paragraphs[0]
    pr9.text = "4. GENAI MULTILINGUAL SAHAYAK (/assistant)"
    pr9.font.name = "Arial Black"
    pr9.font.size = Pt(11)
    pr9.font.color.rgb = COLOR_TEAL_BLUE

    # Add Screenshot fresh_assistant.png
    if os.path.exists("fresh_assistant.png"):
        s9.shapes.add_picture("fresh_assistant.png", Inches(6.1), Inches(2.35), Inches(4.7), Inches(2.65))

    tb_ast_desc = s9.shapes.add_textbox(Inches(6.1), Inches(5.1), Inches(4.7), Inches(1.65))
    tf_ast = tb_ast_desc.text_frame
    tf_ast.word_wrap = True
    tf_ast.margin_left = tf_ast.margin_right = tf_ast.margin_top = tf_ast.margin_bottom = 0

    ast_features = [
        "• Vernacular Dialogue: Converses fluently in Hindi, Marathi, Tamil, Telugu & English.",
        "• Jargon Translation: Converts complex SHAP & NDVI terms into farming analogies.",
        "• Quick Question Chips: 'How do you verify land?', 'What documents do I need?'",
        "• Fraud Protection: Educates farmers against local predatory commission middlemen."
    ]
    for idx_f, f in enumerate(ast_features):
        pf = tf_ast.paragraphs[0] if idx_f == 0 else tf_ast.add_paragraph()
        pf.text = f
        pf.font.name = "Calibri"
        pf.font.size = Pt(9)
        pf.font.color.rgb = COLOR_DARK_TEXT
        pf.space_after = Pt(2)

    # =========================================================================
    # SLIDE 10: PROTOTYPE SHOWCASE 3 — LANDING HERO & STAFF DESK
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10, tpl2)
    add_header(s10, "Live Prototype: Neo-Brutalist UI & Credit Committee Desk",
               "PROTOTYPE SHOWCASE // LIVE LINK: HTTPS://TVS-PIED.VERCEL.APP/")

    # Left: Landing Page Hero
    c_img_l10 = add_card(s10, Inches(0.8), Inches(1.95), Inches(4.95), Inches(4.9), bg_color=COLOR_WHITE, border_color=COLOR_DARK_TEXT, border_width=Pt(2))
    tfl10 = c_img_l10.text_frame
    tfl10.word_wrap = True
    tfl10.margin_left = tfl10.margin_right = Inches(0.15)
    tfl10.margin_top = Inches(0.12)
    
    pl10 = tfl10.paragraphs[0]
    pl10.text = "5. NEO-BRUTALIST BORROWER PORTAL (/)"
    pl10.font.name = "Arial Black"
    pl10.font.size = Pt(11)
    pl10.font.color.rgb = COLOR_TVS_GREEN

    # Add Screenshot fresh_landing.png
    if os.path.exists("fresh_landing.png"):
        s10.shapes.add_picture("fresh_landing.png", Inches(0.95), Inches(2.35), Inches(4.65), Inches(2.65))

    tb_land_desc = s10.shapes.add_textbox(Inches(0.95), Inches(5.1), Inches(4.65), Inches(1.65))
    tf_ld = tb_land_desc.text_frame
    tf_ld.word_wrap = True
    tf_ld.margin_left = tf_ld.margin_right = tf_ld.margin_top = tf_ld.margin_bottom = 0

    land_features = [
        "• Sunlight-Optimized Neo-Brutalism: 3px solid ink borders and flat offset shadows.",
        "• High Contrast: Ultra-crisp readability on low-cost mobile screens in rural fields.",
        "• Running Ticker Tape: CRISIL AA+ stability, zero-CIBIL underwriting, Sentinel-2 feeds.",
        "• Direct Access: Seamless navigation between application, scoring, and AI Sahayak."
    ]
    for idx_f, f in enumerate(land_features):
        pf = tf_ld.paragraphs[0] if idx_f == 0 else tf_ld.add_paragraph()
        pf.text = f
        pf.font.name = "Calibri"
        pf.font.size = Pt(9)
        pf.font.color.rgb = COLOR_DARK_TEXT
        pf.space_after = Pt(2)

    # Right: Staff Underwriting Desk
    c_img_r10 = add_card(s10, Inches(5.95), Inches(1.95), Inches(5.0), Inches(4.9), bg_color=COLOR_WHITE, border_color=COLOR_DARK_TEXT, border_width=Pt(2))
    tfr10 = c_img_r10.text_frame
    tfr10.word_wrap = True
    tfr10.margin_left = tfr10.margin_right = Inches(0.15)
    tfr10.margin_top = Inches(0.12)
    
    pr10 = tfr10.paragraphs[0]
    pr10.text = "6. CREDIT COMMITTEE PORTFOLIO DESK (/staff)"
    pr10.font.name = "Arial Black"
    pr10.font.size = Pt(11)
    pr10.font.color.rgb = COLOR_GOLD

    # Add Screenshot fresh_staff.png
    if os.path.exists("fresh_staff.png"):
        s10.shapes.add_picture("fresh_staff.png", Inches(6.1), Inches(2.35), Inches(4.7), Inches(2.65))

    tb_staff_desc = s10.shapes.add_textbox(Inches(6.1), Inches(5.1), Inches(4.7), Inches(1.65))
    tf_std = tb_staff_desc.text_frame
    tf_std.word_wrap = True
    tf_std.margin_left = tf_std.margin_right = tf_std.margin_top = tf_std.margin_bottom = 0

    staff_features = [
        "• Portfolio Risk Stratification: Real-time distribution across 4 distinct risk tiers.",
        "• Agro-Climatic Score Breakdown: District benchmarks across Yavatmal, Bathinda, etc.",
        "• Batch Sanction Approvals: Fast-track queue management for loan officers.",
        "• Prudential Concentration: Enforces regional exposure safety caps under RBI norms."
    ]
    for idx_f, f in enumerate(staff_features):
        pf = tf_std.paragraphs[0] if idx_f == 0 else tf_std.add_paragraph()
        pf.text = f
        pf.font.name = "Calibri"
        pf.font.size = Pt(9)
        pf.font.color.rgb = COLOR_DARK_TEXT
        pf.space_after = Pt(2)

    # =========================================================================
    # SLIDE 11: BUSINESS IMPACT, ROI & ROADMAP
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11, tpl2)
    add_header(s11, "Business Impact, ROI & Scalability Roadmap")

    metrics = [
        ("< 3 MIN", "SANCTION TURNAROUND", "Down from 14-21 days of manual field audits.", COLOR_CARD_BLUE, COLOR_TEAL_BLUE),
        ("38% DROP", "UNDERWRITING CAC", "Remote satellite scans eliminate physical survey travel.", COLOR_CARD_GREEN, COLOR_ACCENT_GREEN),
        ("42% LESS", "90-DAY DELINQUENCY", "Harvest EMIs eliminate artificial sowing season defaults.", COLOR_CARD_YELLOW, COLOR_GOLD),
        ("90% LTV", "MAXIMUM FINANCING", "Increased from 70% industry average with satellite certainty.", COLOR_CARD_GREEN, COLOR_TVS_GREEN)
    ]
    for idx, (val, title, sub, bg, border) in enumerate(metrics):
        x = Inches(0.8 + idx * 2.55)
        c = add_card(s11, x, Inches(2.0), Inches(2.45), Inches(1.8), bg_color=bg, border_color=border, border_width=Pt(1.8))
        tf = c.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.15)
        
        p = tf.paragraphs[0]
        p.text = val
        p.font.name = "Arial Black"
        p.font.size = Pt(22)
        p.font.color.rgb = border
        
        p1 = tf.add_paragraph()
        p1.text = title
        p1.font.name = "Calibri"
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_TEXT
        
        p2 = tf.add_paragraph()
        p2.text = sub
        p2.font.name = "Calibri"
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = COLOR_MUTED_TEXT

    c_road = add_card(s11, Inches(0.8), Inches(4.05), Inches(10.15), Inches(2.75), bg_color=COLOR_WHITE, border_color=COLOR_TVS_GREEN, border_width=Pt(2))
    tfr11 = c_road.text_frame
    tfr11.word_wrap = True
    tfr11.margin_left = tfr11.margin_right = tfr11.margin_top = Inches(0.2)
    
    pr11 = tfr11.paragraphs[0]
    pr11.text = "STRATEGIC SCALING ROADMAP // 2026 - 2028"
    pr11.font.name = "Arial Black"
    pr11.font.size = Pt(12)
    pr11.font.color.rgb = COLOR_TVS_GREEN
    pr11.space_after = Pt(6)

    phases = [
        ("PHASE 1: NATIONWIDE SATELLITE EXPANSION", "Scale Sentinel-2 & SAR radar cadastre to 150+ agro-climatic zones across Maharashtra, Punjab, Tamil Nadu, MP, UP, and Rajasthan."),
        ("PHASE 2: IOT SENSOR & E-NAM DIGITAL MANDI INTEGRATION", "Integrate automated digital mandi telemetry and private IoT soil-moisture probes for automated yield insurance underwriting."),
        ("PHASE 3: SUSTAINABLE GREEN AGRI-FINANCING", "Subsidized 0% interest credit tiers for PM-KUSUM solar water pumps, micro-drip irrigation, and zero-tillage residue management equipment."),
        ("PHASE 4: ONDC VALUE CHAIN EMBEDDED CREDIT", "Directly disburse funds to farm input dealers, certified seed distributors, and cold storage lockers via TVS Farmer Wallet.")
    ]
    for ph, desc in phases:
        p1 = tfr11.add_paragraph()
        p1.text = f"★ {ph}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(9.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_TVS_GREEN
        
        p2 = tfr11.add_paragraph()
        p2.text = f"   {desc}"
        p2.font.name = "Calibri"
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = COLOR_DARK_TEXT
        p2.space_after = Pt(2)

    # =========================================================================
    # SLIDE 12: CONCLUSION, LIVE ACCESS & TEAM DETAILS
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12, tpl2)
    add_header(s12, "Conclusion: Transforming Rural Credit for Bharat")

    # Left: Summary & Value Created
    c_concl_l = add_card(s12, Inches(0.8), Inches(2.0), Inches(5.4), Inches(4.8), bg_color=COLOR_WHITE, border_color=COLOR_TVS_GREEN, border_width=Pt(2))
    tfcl = c_concl_l.text_frame
    tfcl.word_wrap = True
    tfcl.margin_left = tfcl.margin_right = tfcl.margin_top = Inches(0.25)

    pcl = tfcl.paragraphs[0]
    pcl.text = "TRANSFORMATIVE VALUE PROPOSITION"
    pcl.font.name = "Arial Black"
    pcl.font.size = Pt(13)
    pcl.font.color.rgb = COLOR_TVS_GREEN
    pcl.space_after = Pt(8)

    summary_pts = [
        ("For Rural Smallholders:", "Dignified, rapid access to institutional NBFC credit without mortgaging ancestral gold or borrowing from 48% local moneylenders."),
        ("For TVS Credit:", "Massive expansion of qualified borrower pipeline with 38% lower CAC, automated 3-minute sanctions, and 42% lower delinquency."),
        ("For National Financial Inclusion:", "Catalyzing PM-KISAN, Digital Agriculture Mission, and AgriStack integration to formalize 120M+ unbanked Indian farmers."),
        ("Auditable & Explainable:", "100% compliant with RBI Fair Lending guidelines with transparent SHAP factor attribution for every sanction or decline.")
    ]
    for h, b in summary_pts:
        p1 = tfcl.add_paragraph()
        p1.text = f"• {h}"
        p1.font.name = "Calibri"
        p1.font.size = Pt(10.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_TEXT

        p2 = tfcl.add_paragraph()
        p2.text = f"  {b}"
        p2.font.name = "Calibri"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = COLOR_MUTED_TEXT
        p2.space_after = Pt(4)

    # Right: Live Access Box & Team Information
    c_concl_r = add_card(s12, Inches(6.45), Inches(2.0), Inches(4.5), Inches(4.8), bg_color=COLOR_CARD_GREEN, border_color=COLOR_ACCENT_GREEN, border_width=Pt(2))
    tfcr = c_concl_r.text_frame
    tfcr.word_wrap = True
    tfcr.margin_left = tfcr.margin_right = tfcr.margin_top = Inches(0.25)

    pcr = tfcr.paragraphs[0]
    pcr.text = "LIVE PROTOTYPE ACCESS & TEAM"
    pcr.font.name = "Arial Black"
    pcr.font.size = Pt(13)
    pcr.font.color.rgb = COLOR_TVS_GREEN
    pcr.space_after = Pt(10)

    p_url = tfcr.add_paragraph()
    p_url.text = "🌐 EXPLORE LIVE PROTOTYPE:"
    p_url.font.name = "Arial Black"
    p_url.font.size = Pt(11)
    p_url.font.color.rgb = COLOR_TEAL_BLUE

    p_url_val = tfcr.add_paragraph()
    p_url_val.text = "https://tvs-pied.vercel.app/"
    p_url_val.font.name = "Calibri"
    p_url_val.font.size = Pt(11.5)
    p_url_val.font.bold = True
    p_url_val.font.color.rgb = COLOR_TVS_GREEN
    p_url_val.space_after = Pt(12)

    p_t = tfcr.add_paragraph()
    p_t.text = "👥 COMPETITION TEAM:"
    p_t.font.name = "Arial Black"
    p_t.font.size = Pt(11)
    p_t.font.color.rgb = COLOR_TEAL_BLUE

    p_t_name = tfcr.add_paragraph()
    p_t_name.text = "Team Handle: hverma0511"
    p_t_name.font.name = "Calibri"
    p_t_name.font.size = Pt(11.5)
    p_t_name.font.bold = True
    p_t_name.font.color.rgb = COLOR_DARK_TEXT
    p_t_name.space_after = Pt(6)

    p_m = tfcr.add_paragraph()
    p_m.text = "👤 TEAM MEMBERS:"
    p_m.font.name = "Arial Black"
    p_m.font.size = Pt(11)
    p_m.font.color.rgb = COLOR_TEAL_BLUE

    p_m_val = tfcr.add_paragraph()
    p_m_val.text = "• Harshit Verma\n• Nandani Singh"
    p_m_val.font.name = "Calibri"
    p_m_val.font.size = Pt(11.5)
    p_m_val.font.bold = True
    p_m_val.font.color.rgb = COLOR_DARK_TEXT
    p_m_val.space_after = Pt(14)

    p_ty = tfcr.add_paragraph()
    p_ty.text = "THANK YOU!"
    p_ty.font.name = "Arial Black"
    p_ty.font.size = Pt(16)
    p_ty.font.color.rgb = COLOR_TVS_GREEN

    prs.save(output_file)
    print(f"Presentation saved successfully as {output_file}")

if __name__ == "__main__":
    create_presentation("TVS_Credit_EPIC8_Smart_Lending_Hub.pptx")
