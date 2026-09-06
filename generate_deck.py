import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# --- COLOR PALETTE (Pulse Neo-Brutalist) ---
COLOR_BG = RGBColor(0xFA, 0xF8, 0xF5)       # #FAF8F5 Warm Cream
COLOR_BLACK = RGBColor(0x00, 0x00, 0x00)    # #000000 Ink Black
COLOR_YELLOW = RGBColor(0xFF, 0xD1, 0x52)   # #FFD152 Canary Yellow
COLOR_PINK = RGBColor(0xFF, 0x6B, 0x6B)     # #FF6B6B Coral Pink
COLOR_LILAC = RGBColor(0xB8, 0xA9, 0xFF)    # #B8A9FF Lavender Purple
COLOR_GREEN = RGBColor(0x2E, 0xD5, 0x73)    # #2ED573 Mint Green
COLOR_WHITE = RGBColor(0xFF, 0xFF, 0xFF)    # #FFFFFF Crisp White
COLOR_DARK_HEADER = RGBColor(0x11, 0x11, 0x11)

def apply_text(paragraph, text, font_name="Arial Black", font_size=Pt(14), font_color=COLOR_BLACK, bold=True, align=PP_ALIGN.LEFT):
    paragraph.text = text
    paragraph.font.name = font_name
    paragraph.font.size = font_size
    paragraph.font.color.rgb = font_color
    paragraph.font.bold = bold
    paragraph.alignment = align

def add_box(slide, left, top, width, height, fill_color, border_color=COLOR_BLACK, border_width=Pt(3), shadow=True):
    # If shadow requested, draw an offset black rectangle behind it
    if shadow:
        offset = Inches(0.08)
        s_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left + offset, top + offset, width, height)
        s_shape.fill.solid()
        s_shape.fill.fore_color.rgb = COLOR_BLACK
        s_shape.line.color.rgb = COLOR_BLACK
        s_shape.line.width = Pt(1)

    # Main shape
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.color.rgb = border_color
    shape.line.width = border_width
    return shape

def create_deck(filename="TVS_Credit_Smart_Lending_Deck.pptx"):
    prs = Presentation()
    # 16:9 Widescreen (13.333 x 7.5 inches)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Helper for slide header
    def make_header(slide, title_text, category_text="TVS CREDIT'26 // SMART LENDING DECISION HUB", bg_tag=COLOR_YELLOW):
        # Top banner background
        top_bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15))
        top_bg.fill.solid()
        top_bg.fill.fore_color.rgb = COLOR_WHITE
        top_bg.line.color.rgb = COLOR_BLACK
        top_bg.line.width = Pt(3)

        # Logo pill
        logo_box = add_box(slide, Inches(0.8), Inches(0.2), Inches(2.2), Inches(0.7), COLOR_YELLOW, shadow=True)
        tf = logo_box.text_frame
        tf.word_wrap = True
        apply_text(tf.paragraphs[0], "TVS CREDIT'26", font_size=Pt(14), font_color=COLOR_BLACK, align=PP_ALIGN.CENTER)

        # Header Title
        title_box = slide.shapes.add_textbox(Inches(3.3), Inches(0.15), Inches(7.2), Inches(0.8))
        tf2 = title_box.text_frame
        tf2.word_wrap = True
        p1 = tf2.paragraphs[0]
        apply_text(p1, title_text, font_size=Pt(20), font_color=COLOR_BLACK)
        p2 = tf2.add_paragraph()
        apply_text(p2, category_text, font_name="Consolas", font_size=Pt(10), font_color=RGBColor(0x66, 0x66, 0x66), bold=False)

        # Right badge
        tag_box = add_box(slide, Inches(10.8), Inches(0.25), Inches(1.8), Inches(0.55), bg_tag, shadow=True)
        tf3 = tag_box.text_frame
        apply_text(tf3.paragraphs[0], "AI PLATFORM", font_size=Pt(11), align=PP_ALIGN.CENTER)

    # -------------------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_slide_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = COLOR_BG
    bg1.line.fill.background()

    # Top Pill Tags
    tag1 = add_box(s1, Inches(0.9), Inches(0.8), Inches(2.3), Inches(0.5), COLOR_PINK, shadow=True)
    apply_text(tag1.text_frame.paragraphs[0], "✦ 2026 EDITION", font_size=Pt(11), align=PP_ALIGN.CENTER)

    tag2 = add_box(s1, Inches(3.4), Inches(0.8), Inches(3.2), Inches(0.5), COLOR_YELLOW, shadow=True)
    apply_text(tag2.text_frame.paragraphs[0], "EPIC 8 IT CASE STUDY", font_size=Pt(11), align=PP_ALIGN.CENTER)

    tag3 = add_box(s1, Inches(6.8), Inches(0.8), Inches(2.6), Inches(0.5), COLOR_WHITE, shadow=True)
    apply_text(tag3.text_frame.paragraphs[0], "● AI ENGINE LIVE", font_size=Pt(11), align=PP_ALIGN.CENTER)

    # Huge Main Headline Box
    card_title = add_box(s1, Inches(0.9), Inches(1.6), Inches(11.5), Inches(4.2), COLOR_WHITE, shadow=True)
    tf = card_title.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    apply_text(p, "TVS CREDIT", font_size=Pt(46), font_color=COLOR_PINK)
    p2 = tf.add_paragraph()
    apply_text(p2, "SMART LENDING DECISION HUB", font_size=Pt(40), font_color=COLOR_BLACK)
    p3 = tf.add_paragraph()
    apply_text(p3, "Revolutionising Rural Bharat Lending with Geospatial AI, Satellite Telemetry & Harvest-Aligned EMIs", 
               font_name="Calibri", font_size=Pt(16), font_color=RGBColor(0x33, 0x33, 0x33), bold=False)

    # Sub-bullets inside title box
    bullets = [
        "🛰️ Sentinel-2 10m Optical Vegetation Scoring (NDVI)",
        "📊 Explainable AI Underwriting (SHAP Decision Drivers)",
        "🌾 Dynamic Cash-Flow Aligned Harvest Repayments",
        "🚨 Real-Time Anomaly & Early Warning Radar"
    ]
    for b in bullets:
        bp = tf.add_paragraph()
        apply_text(bp, f"  {b}", font_name="Consolas", font_size=Pt(13), font_color=COLOR_BLACK, bold=True)

    # Bottom Black Ticker
    bot_ticker = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(6.3), Inches(13.333), Inches(1.2))
    bot_ticker.fill.solid()
    bot_ticker.fill.fore_color.rgb = COLOR_BLACK
    bot_ticker.line.fill.background()
    t_tf = bot_ticker.text_frame
    apply_text(t_tf.paragraphs[0], "★ 26M+ CUSTOMERS SERVED  ★  AA+ CRISIL RATING  ★  <3 MIN SANCTION TIME  ★  90% FINANCE COVERAGE",
               font_size=Pt(13), font_color=COLOR_WHITE, align=PP_ALIGN.CENTER)

    # -------------------------------------------------------------
    # SLIDE 2: THE PROBLEM (RURAL CREDIT CHASM)
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_slide_layout)
    make_header(s2, "THE RURAL CREDIT PARADOX & CHALLENGES", "PROBLEM STATEMENT // TIER 3 & 4 UNDERWRITING GAP", COLOR_PINK)

    problems = [
        ("NO CIBIL TRACK RECORD", "80%+ of smallholder farmers operate in a cash economy with zero formal banking records. Traditional credit bureaus systematically exclude them.", COLOR_PINK),
        ("MANUAL LAND AUDITS", "Physical land inspections take 14-21 days, require manual field officers, cost ~₹3,500/visit, and remain highly susceptible to fraud and boundary disputes.", COLOR_YELLOW),
        ("RIGID MONTHLY EMIs", "Fixed monthly installments force default during sowing seasons when farmer liquidity is zero, leading to artificial defaults despite healthy crops.", COLOR_LILAC),
        ("CLIMATE & MARKET SHOCKS", "Droughts, unseasonal rains, and sudden Mandi price crashes trigger regional default cascades without warning for financial institutions.", COLOR_WHITE)
    ]
    for idx, (head, desc, bg) in enumerate(problems):
        x = Inches(0.8 + idx * 2.95)
        box = add_box(s2, x, Inches(1.7), Inches(2.8), Inches(4.9), bg, shadow=True)
        btf = box.text_frame
        btf.word_wrap = True
        apply_text(btf.paragraphs[0], f"0{idx+1}", font_size=Pt(28), font_color=COLOR_BLACK)
        p1 = btf.add_paragraph()
        apply_text(p1, head, font_size=Pt(16), font_color=COLOR_BLACK)
        p2 = btf.add_paragraph()
        apply_text(p2, desc, font_name="Calibri", font_size=Pt(13), font_color=RGBColor(0x22, 0x22, 0x22), bold=False)

    # -------------------------------------------------------------
    # SLIDE 3: THE SOLUTION ARCHITECTURE
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_slide_layout)
    make_header(s3, "THE AI-POWERED SMART LENDING ARCHITECTURE", "FULL-STACK TECHNICAL WORKFLOW // FIELD TO FINANCE", COLOR_YELLOW)

    pillars = [
        ("1. SATELLITE CADASTRE", "European Space Agency Sentinel-2 10m bands 4 & 8 provide automated parcel boundary verification and multi-season NDVI health.", COLOR_WHITE),
        ("2. AGROMET ENGINES", "30-year IMD weather anomaly tracking, rainfall deficits, and irrigation accessibility scoring to predict yield resilience.", COLOR_YELLOW),
        ("3. EXPLAINABLE AI", "Gradient-boosted decision trees with SHAP transparency score applicants instantly (< 3 mins), eliminating CIBIL dependencies.", COLOR_PINK),
        ("4. HARVEST EMIs", "Dynamic non-linear cash flow matching: token ₹800 EMIs during sowing, balloon payments post-mandi harvest sale.", COLOR_LILAC),
        ("5. EARLY WARNING RADAR", "Real-time automated district-level surveillance for weather stress and mandi price crash mitigation.", COLOR_WHITE)
    ]
    for idx, (title, text, bg) in enumerate(pillars):
        y = Inches(1.5 + idx * 1.1)
        row = add_box(s3, Inches(0.8), y, Inches(11.7), Inches(0.95), bg, shadow=True)
        rtf = row.text_frame
        rtf.word_wrap = True
        p1 = rtf.paragraphs[0]
        apply_text(p1, title, font_size=Pt(15), font_color=COLOR_BLACK)
        p2 = rtf.add_paragraph()
        apply_text(p2, text, font_name="Calibri", font_size=Pt(12), font_color=RGBColor(0x33, 0x33, 0x33), bold=False)

    # -------------------------------------------------------------
    # SLIDE 4: SATELLITE TELEMETRY & NDVI ANALYSIS
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_slide_layout)
    make_header(s4, "GEOSPATIAL SATELLITE CROP INTELLIGENCE", "SENTINEL-2 MULTISPECTRAL IMAGERY & CADASTRAL LOOKUP", COLOR_GREEN)

    # Left: NDVI Explanation Box
    left_box = add_box(s4, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.1), COLOR_WHITE, shadow=True)
    ltf = left_box.text_frame
    ltf.word_wrap = True
    apply_text(ltf.paragraphs[0], "SPECTRAL VEGETATION SCORING", font_size=Pt(18), font_color=COLOR_BLACK)
    
    pts = [
        ("10-Meter Optical Resolution", "Captures farm-level NIR (Near-Infrared) and Red bands every 5 days via Sentinel-2 constellation."),
        ("NDVI Index Formula", "NDVI = (NIR - RED) / (NIR + RED). Range 0.0 to 1.0 indicates chlorophyll density and plant vigor."),
        ("Historical Temporal Curve", "Compares current crop health trajectory against 24-month baseline to detect drought or stunted growth."),
        ("Boundary Fraud Detection", "GPS cadastral polygons ensure claimed land matches actual cultivable acreage without disputes.")
    ]
    for h, d in pts:
        p1 = ltf.add_paragraph()
        apply_text(p1, f"• {h}:", font_size=Pt(12), font_color=COLOR_BLACK)
        p2 = ltf.add_paragraph()
        apply_text(p2, f"  {d}", font_name="Calibri", font_size=Pt(11), font_color=RGBColor(0x44, 0x44, 0x44), bold=False)

    # Right: Benchmark Table / Matrix
    right_box = add_box(s4, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.1), COLOR_YELLOW, shadow=True)
    rtf = right_box.text_frame
    rtf.word_wrap = True
    apply_text(rtf.paragraphs[0], "NDVI UNDERWRITING THRESHOLDS", font_size=Pt(18), font_color=COLOR_BLACK)
    
    tiers = [
        ("NDVI > 0.65 (Dense Biomass)", "High Yield Probability", "Approved: Max 90% LTV, Lowest Interest Rate (11.5%)"),
        ("NDVI 0.40 - 0.65 (Moderate)", "Normal Health", "Approved: Standard 80% LTV, Market Rate (12.2%)"),
        ("NDVI 0.20 - 0.40 (Sparse)", "Vegetative Stress", "Conditional: Requires Co-applicant or Drip Irrigation verification"),
        ("NDVI < 0.20 (Barren/Fallow)", "Drought / Failed Sowing", "Declined / Referred for Emergency Distress Relief")
    ]
    for t_range, status, action in tiers:
        p1 = rtf.add_paragraph()
        apply_text(p1, f"■ {t_range}", font_size=Pt(12), font_color=COLOR_BLACK)
        p2 = rtf.add_paragraph()
        apply_text(p2, f"  {status} → {action}", font_name="Calibri", font_size=Pt(11), font_color=RGBColor(0x22, 0x22, 0x22), bold=False)

    # -------------------------------------------------------------
    # SLIDE 5: EXPLAINABLE AI SCORING (SHAP ENGINE)
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_slide_layout)
    make_header(s5, "EXPLAINABLE AI CREDIT SCORING & SHAP ENGINE", "TRANSPARENT, COMPLIANT, ZERO-BIAS UNDERWRITING", COLOR_PINK)

    # 4 Score factor cards
    factors = [
        ("CROP CANOPY VIGOR (NDVI)", "+35% WEIGHT", "Live chlorophyll spectral density confirming active cultivation and strong expected biomass harvest yields.", COLOR_GREEN),
        ("PRECIPITATION ANOMALY", "+20% WEIGHT", "Deviation against 10-year monsoon average and access to tube-well/perennial river irrigation.", COLOR_YELLOW),
        ("MANDI MARKET ACCESS", "+15% WEIGHT", "Proximity to regulated APMC mandis, historical wholesale crop realizations, and price stability.", COLOR_LILAC),
        ("SOIL & ROTATION RESILIENCE", "+15% WEIGHT", "Soil type (black cotton, alluvial loam) and multi-cropping history (Kharif, Rabi, Zaid rotation).", COLOR_WHITE),
    ]
    for idx, (title, weight, desc, bg) in enumerate(factors):
        x = Inches(0.8 + (idx % 2) * 5.9)
        y = Inches(1.6 + (idx // 2) * 2.6)
        card = add_box(s5, x, y, Inches(5.6), Inches(2.3), bg, shadow=True)
        ctf = card.text_frame
        ctf.word_wrap = True
        apply_text(ctf.paragraphs[0], title, font_size=Pt(16), font_color=COLOR_BLACK)
        p1 = ctf.add_paragraph()
        apply_text(p1, weight, font_size=Pt(13), font_color=RGBColor(0x00, 0x55, 0x00))
        p2 = ctf.add_paragraph()
        apply_text(p2, desc, font_name="Calibri", font_size=Pt(12), font_color=RGBColor(0x33, 0x33, 0x33), bold=False)

    # -------------------------------------------------------------
    # SLIDE 6: HARVEST-ALIGNED REPAYMENT ENGINE
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_slide_layout)
    make_header(s6, "HARVEST-ALIGNED DYNAMIC EMI STRUCTURING", "CROP CYCLE CASH-FLOW MATCHING VS RIGID BANK EMIs", COLOR_YELLOW)

    # Left: Traditional vs Dynamic comparison
    left = add_box(s6, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.1), COLOR_PINK, shadow=True)
    ltf = left.text_frame
    ltf.word_wrap = True
    apply_text(ltf.paragraphs[0], "TRADITIONAL FLAT BANK EMI (FLAWED)", font_size=Pt(16), font_color=COLOR_WHITE)
    comp_old = [
        "Fixed ₹12,500/month regardless of crop cycle",
        "Forces farmer into local moneylender debt during sowing",
        "Defaults occur during fertilizer purchase peak (July/Aug)",
        "Artificial NPA generation despite bumper harvest in Nov",
        "High collection costs and legal repossession overhead"
    ]
    for c in comp_old:
        p = ltf.add_paragraph()
        apply_text(p, f"❌ {c}", font_name="Calibri", font_size=Pt(13), font_color=COLOR_WHITE, bold=False)

    # Right: TVS Dynamic Harvest EMI
    right = add_box(s6, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.1), COLOR_YELLOW, shadow=True)
    rtf = right.text_frame
    rtf.word_wrap = True
    apply_text(rtf.paragraphs[0], "TVS HARVEST-ALIGNED MODEL (INNOVATION)", font_size=Pt(16), font_color=COLOR_BLACK)
    comp_new = [
        "Sowing Season (Jun-Aug): Nominal ₹800/mo token interest",
        "Growing Season (Sep): ₹1,200/mo low-load payment",
        "Harvest Season (Oct/Nov): ₹68,000 bullet payment post-mandi",
        "Rabi Sowing (Dec-Feb): Reduced ₹1,000/mo liquidity relief",
        "42% Drop in 90-day delinquency and zero repossession friction"
    ]
    for c in comp_new:
        p = rtf.add_paragraph()
        apply_text(p, f"✅ {c}", font_name="Calibri", font_size=Pt(13), font_color=COLOR_BLACK, bold=True)

    # -------------------------------------------------------------
    # SLIDE 7: PORTFOLIO EARLY WARNING RADAR
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_slide_layout)
    make_header(s7, "PORTFOLIO EARLY WARNING RADAR & DEFAULTER PREVENTION", "PROACTIVE SATELLITE SURVEILLANCE & RESTRUCTURING ENGINE", COLOR_PINK)

    districts = [
        ("YAVATMAL, MH", "HIGH SEVERITY", "Drought stress: -34% rainfall deficit. 1,420 loans (₹180L exposure). Protocol: Automatic 60-day EMI extension & SMS alert.", COLOR_PINK),
        ("BATHINDA, PB", "HIGH SEVERITY", "Pest outbreak & mandi crash in Cotton belt. 890 loans (₹145L exposure). Protocol: Restructure to Rabi wheat bullet harvest.", COLOR_YELLOW),
        ("THANJAVUR, TN", "MEDIUM SEVERITY", "Kuruvai harvest delay due to unseasonal rain. 1,150 loans (₹190L exposure). Protocol: 30-day grace period without penalty.", COLOR_LILAC),
        ("SEHORE, MP", "LOW SEVERITY", "Optimal soybean biomass (+14% yield). 650 loans (₹95L exposure). Protocol: Pre-approved tractor implement upgrade offer.", COLOR_WHITE)
    ]
    for idx, (dist, sev, details, bg) in enumerate(districts):
        y = Inches(1.5 + idx * 1.3)
        box = add_box(s7, Inches(0.8), y, Inches(11.7), Inches(1.15), bg, shadow=True)
        btf = box.text_frame
        btf.word_wrap = True
        apply_text(btf.paragraphs[0], f"📍 {dist} — [{sev}]", font_size=Pt(15), font_color=COLOR_BLACK)
        p = btf.add_paragraph()
        apply_text(p, details, font_name="Calibri", font_size=Pt(12), font_color=RGBColor(0x22, 0x22, 0x22), bold=False)

    # -------------------------------------------------------------
    # SLIDE 8: GENAI 'TVS SAHAYAK'
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_slide_layout)
    make_header(s8, "GENAI 'TVS SAHAYAK' — VERNACULAR LOAN COPILOT", "MULTILINGUAL CONVERSATIONAL AI FOR RURAL FINANCIAL INCLUSION", COLOR_LILAC)

    left_box = add_box(s8, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.1), COLOR_WHITE, shadow=True)
    ltf = left_box.text_frame
    ltf.word_wrap = True
    apply_text(ltf.paragraphs[0], "AI ARCHITECTURE & CAPABILITIES", font_size=Pt(18), font_color=COLOR_BLACK)
    features = [
        ("Multilingual NLP", "Supports Hindi, Tamil, Punjabi, Marathi, Telugu & English with voice recognition."),
        ("Simplified Explainability", "Translates complex SHAP credit scores and satellite NDVI jargon into simple rural analogies."),
        ("Zero-Paperwork Onboarding", "Guides farmer through Aadhaar KYC, crop details, and harvest cycle selection via audio dialogue."),
        ("Fraud & Scam Protection", "Alerts farmers against predatory middleman rates and explains exact government subsidy tie-ups.")
    ]
    for h, d in features:
        p1 = ltf.add_paragraph()
        apply_text(p1, f"• {h}:", font_size=Pt(12), font_color=COLOR_BLACK)
        p2 = ltf.add_paragraph()
        apply_text(p2, f"  {d}", font_name="Calibri", font_size=Pt(11), font_color=RGBColor(0x44, 0x44, 0x44), bold=False)

    # Right: Sample Dialog Box
    right_box = add_box(s8, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.1), COLOR_YELLOW, shadow=True)
    rtf = right_box.text_frame
    rtf.word_wrap = True
    apply_text(rtf.paragraphs[0], "LIVE SAHAYAK INTERACTION SAMPLE", font_size=Pt(18), font_color=COLOR_BLACK)
    
    dialogue = [
        ("Farmer (Voice/Hindi)", "'भैया, मुझे 45 HP का ट्रैक्टर लेना है, मेरी 6 एकड़ कपास की खेती है, लोन कैसे मिलेगा?'"),
        ("TVS Sahayak (Hindi)", "'नमस्ते रमेश जी! हमने सैटेलाइट से आपका खेत देखा — कपास की फसल हरी और स्वस्थ है (NDVI 0.68)। आपको ₹4.5 लाख का ट्रैक्टर लोन बिना किसी गारंटी के मंजूर है! बुआई के 4 महीने किश्त सिर्फ ₹800 लगेगी, बाकी फसल बिकने पर।'"),
        ("Farmer (Voice/Hindi)", "'क्या मुझे बैंक के चक्कर लगाने पड़ेंगे?'"),
        ("TVS Sahayak (Hindi)", "'बिल्कुल नहीं! आपका आधार और खतौनी ऑनलाइन जांची गई है। 24 घंटे में पैसा सीधे आपके TVS खाते में आएगा!'")
    ]
    for speaker, text in dialogue:
        p1 = rtf.add_paragraph()
        apply_text(p1, f"💬 {speaker}:", font_size=Pt(12), font_color=COLOR_BLACK)
        p2 = rtf.add_paragraph()
        apply_text(p2, f"   {text}", font_name="Calibri", font_size=Pt(11), font_color=RGBColor(0x22, 0x22, 0x22), bold=False)

    # -------------------------------------------------------------
    # SLIDE 9: BUSINESS IMPACT & TRACTION METRICS
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_slide_layout)
    make_header(s9, "BUSINESS IMPACT, ROI & PERFORMANCE METRICS", "QUANTIFIABLE METRICS DELIVERED BY TVS DECISION HUB", COLOR_GREEN)

    metrics = [
        ("< 3 MIN", "SANCTION TURNAROUND", "Reduced from 14-21 days of manual physical audits to instant AI sanction.", COLOR_YELLOW),
        ("38% DROP", "UNDERWRITING CAC", "Eliminated redundant manual field-inspection trips with satellite cadastral scans.", COLOR_PINK),
        ("42% LESS", "90-DAY DELINQUENCY", "Harvest-aligned EMIs eliminate artificial defaults during cash-strapped sowing months.", COLOR_LILAC),
        ("90% LTV", "MAXIMUM FINANCING", "Increased from industry avg of 70% due to real-time satellite crop yield certainty.", COLOR_WHITE),
        ("26 MILLION+", "RURAL CUSTOMERS", "Cumulative lives empowered across Tier 3, Tier 4 towns and agricultural heartlands.", COLOR_YELLOW),
        ("AA+ CRISIL", "CREDIT STABILITY", "Highest industry credit rating driven by resilient, diversified agri-portfolio risk.", COLOR_GREEN)
    ]
    for idx, (val, label, subtext, bg) in enumerate(metrics):
        col = idx % 3
        row = idx // 3
        x = Inches(0.8 + col * 3.9)
        y = Inches(1.6 + row * 2.6)
        card = add_box(s9, x, y, Inches(3.7), Inches(2.4), bg, shadow=True)
        mtf = card.text_frame
        mtf.word_wrap = True
        apply_text(mtf.paragraphs[0], val, font_size=Pt(28), font_color=COLOR_BLACK)
        p1 = mtf.add_paragraph()
        apply_text(p1, label, font_size=Pt(13), font_color=COLOR_BLACK)
        p2 = mtf.add_paragraph()
        apply_text(p2, subtext, font_name="Calibri", font_size=Pt(11), font_color=RGBColor(0x33, 0x33, 0x33), bold=False)

    # -------------------------------------------------------------
    # SLIDE 10: CONCLUSION & FUTURE ROADMAP
    # -------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_slide_layout)
    make_header(s10, "THE FUTURE ROADMAP & SCALING VISION", "TVS CREDIT — EMPOWERING INDIA. ONE FARMER AT A TIME.", COLOR_YELLOW)

    roadmap = [
        ("PHASE 1: NATIONWIDE SATELLITE EXPANSION", "Extend Sentinel-2 & SAR radar coverage to 150+ agro-climatic zones across Maharashtra, Punjab, Tamil Nadu, MP, UP & Rajasthan.", COLOR_WHITE),
        ("PHASE 2: IOT & SOIL SENSOR SYNDICATION", "Integrate automated digital mandi telemetry and private IoT soil-moisture probes for hyper-local yield insurance linkage.", COLOR_YELLOW),
        ("PHASE 3: SUSTAINABLE GREEN FINANCING", "Subsidized 0% interest credit tiers for solar water pumps, micro-drip irrigation, and zero-tillage residue management.", COLOR_PINK),
        ("PHASE 4: ONDC & AGRI-VALUE CHAIN NETWORK", "Directly disburse funds to farm input dealers, seed distributors, and cold storage lockers with automated warehouse receipt loans.", COLOR_LILAC)
    ]
    for idx, (title, desc, bg) in enumerate(roadmap):
        y = Inches(1.5 + idx * 1.25)
        card = add_box(s10, Inches(0.8), y, Inches(11.7), Inches(1.1), bg, shadow=True)
        ctf = card.text_frame
        ctf.word_wrap = True
        apply_text(ctf.paragraphs[0], f"★ {title}", font_size=Pt(15), font_color=COLOR_BLACK)
        p = ctf.add_paragraph()
        apply_text(p, desc, font_name="Calibri", font_size=Pt(12), font_color=RGBColor(0x22, 0x22, 0x22), bold=False)

    # Save presentation
    prs.save(filename)
    print(f"Presentation saved successfully to {filename}")

if __name__ == "__main__":
    create_deck("TVS_Credit_Smart_Lending_Deck.pptx")
