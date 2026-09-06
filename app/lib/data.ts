// TVS Credit Smart Lending Decision Hub — Complete data store
// Real-world Indian agricultural districts, satellite NDVI, weather anomalies, credit profiles

export interface Applicant {
  id: string;
  name: string;
  phone: string;
  state: string;
  district: string;
  village: string;
  lat: number;
  lng: number;
  landSizeAcres: number;
  cropType: string;
  soilType: string;
  irrigation: string;
  loanProduct: string;
  requestedAmount: number;
  bureauStatus: string;
  mandiDistanceKm: number;
  last90DaysRainfallMm: number;
  districtAvgRainfallMm: number;
  rainfallAnomalyPct: number;
  ndviScore: number;
  satelliteVegetationIndex: number[];
  plotPolygon: [number, number][];
  scoring: {
    score: number;
    riskTier: string;
    recommendation: string;
    factors: {
      name: string;
      contribution: number;
      status: "Positive" | "Warning" | "Alert" | "Neutral";
      detail: string;
    }[];
    offer: {
      approvedAmount: number;
      tenureMonths: number;
      flatEmi: number;
      interestRatePct: number;
      harvestEmiSchedule: {
        month: string;
        amount: number;
        type: string;
      }[];
    };
  };
}

export interface EarlyWarning {
  id: string;
  district: string;
  state: string;
  crop: string;
  activeLoansCount: number;
  totalExposureLakhs: number;
  warningType: string;
  severity: "High" | "Medium" | "Low";
  impactDescription: string;
  recommendedAction: string;
}

export const applicants: Applicant[] = [
  {
    id: "APP-1042",
    name: "Ramesh Patil",
    phone: "+91 98231 44521",
    state: "Maharashtra",
    district: "Yavatmal",
    village: "Ghatanji",
    lat: 20.1384,
    lng: 78.3182,
    landSizeAcres: 6.5,
    cropType: "Cotton (Bt)",
    soilType: "Black Cotton Soil",
    irrigation: "Borewell & Rainfed",
    loanProduct: "Tractor Loan (50 HP)",
    requestedAmount: 450000,
    bureauStatus: "Thin File (Score: 610)",
    mandiDistanceKm: 14,
    last90DaysRainfallMm: 310,
    districtAvgRainfallMm: 480,
    rainfallAnomalyPct: -35.4,
    ndviScore: 0.68,
    satelliteVegetationIndex: [0.35, 0.42, 0.58, 0.68, 0.71, 0.65],
    plotPolygon: [[20.136, 78.315],[20.141, 78.316],[20.140, 78.322],[20.135, 78.320]],
    scoring: {
      score: 74,
      riskTier: "Low-Medium",
      recommendation: "Approved with Harvest-Aligned EMI",
      factors: [
        { name: "Satellite NDVI Crop Health", contribution: 0.28, status: "Positive", detail: "Vibrant vegetative index (0.68) indicates strong standing crop" },
        { name: "Rainfall Anomaly vs 10-Yr Avg", contribution: -0.14, status: "Warning", detail: "35% deficit in Yavatmal; mitigated by borewell irrigation" },
        { name: "Land Holding Size (6.5 Acres)", contribution: 0.18, status: "Positive", detail: "Above district average; eligible for 45-50 HP tractor" },
        { name: "Proximity to Mandi (14 km)", contribution: 0.08, status: "Positive", detail: "Good logistics connectivity reduces post-harvest spoilage" },
        { name: "TVS Alternative Proxy Score", contribution: 0.12, status: "Positive", detail: "Consistent fertilizer purchases via UPI & high utility bill consistency" },
      ],
      offer: {
        approvedAmount: 425000,
        tenureMonths: 48,
        flatEmi: 11850,
        interestRatePct: 11.75,
        harvestEmiSchedule: [
          { month: "Nov (Picking)", amount: 24500, type: "Harvest Surge" },
          { month: "Dec (Mandi Sale)", amount: 28000, type: "Harvest Surge" },
          { month: "Jan", amount: 4500, type: "Off-Season Min" },
          { month: "Feb", amount: 4500, type: "Off-Season Min" },
          { month: "Mar", amount: 4500, type: "Off-Season Min" },
          { month: "Apr (Rabi Sale)", amount: 22000, type: "Rabi Harvest" },
        ],
      },
    },
  },
  {
    id: "APP-1088",
    name: "Gurpreet Singh Dhillon",
    phone: "+91 94172 88910",
    state: "Punjab",
    district: "Bathinda",
    village: "Talwandi Sabo",
    lat: 29.9864,
    lng: 75.0883,
    landSizeAcres: 12.0,
    cropType: "Wheat & Paddy",
    soilType: "Alluvial Loam",
    irrigation: "Canal + Tube Well (100% Irrigated)",
    loanProduct: "Heavy Tractor (55 HP)",
    requestedAmount: 650000,
    bureauStatus: "Existing Bureau (Score: 745)",
    mandiDistanceKm: 6,
    last90DaysRainfallMm: 190,
    districtAvgRainfallMm: 210,
    rainfallAnomalyPct: -9.5,
    ndviScore: 0.84,
    satelliteVegetationIndex: [0.45, 0.60, 0.78, 0.84, 0.88, 0.82],
    plotPolygon: [[29.984, 75.084],[29.990, 75.085],[29.989, 75.093],[29.982, 75.091]],
    scoring: {
      score: 88,
      riskTier: "Very Low",
      recommendation: "Instant Auto-Approval with Top-up Eligible",
      factors: [
        { name: "Satellite NDVI Crop Health", contribution: 0.35, status: "Positive", detail: "Near-optimal NDVI 0.84 indicates top-tier crop density" },
        { name: "Canal & Tubewell Resilience", contribution: 0.22, status: "Positive", detail: "Zero drought vulnerability; 100% assured irrigation" },
        { name: "Land Holding Size (12 Acres)", contribution: 0.20, status: "Positive", detail: "Substantial acreage with dual-crop rotation" },
        { name: "Distance to Mandi (6 km)", contribution: 0.11, status: "Positive", detail: "Immediate access to Bathinda grain mandi" },
      ],
      offer: {
        approvedAmount: 650000,
        tenureMonths: 60,
        flatEmi: 14200,
        interestRatePct: 10.5,
        harvestEmiSchedule: [
          { month: "Apr (Wheat)", amount: 48000, type: "Bumper Harvest" },
          { month: "May", amount: 6000, type: "Maintenance" },
          { month: "Jun", amount: 6000, type: "Maintenance" },
          { month: "Oct (Paddy)", amount: 52000, type: "Bumper Harvest" },
        ],
      },
    },
  },
  {
    id: "APP-1104",
    name: "Murugan Selvam",
    phone: "+91 97890 12345",
    state: "Tamil Nadu",
    district: "Thanjavur",
    village: "Orathanadu",
    lat: 10.6256,
    lng: 79.2564,
    landSizeAcres: 4.2,
    cropType: "Paddy (Kuruvai)",
    soilType: "Cauvery Delta Clay Alluvium",
    irrigation: "River Canal / Sluice",
    loanProduct: "Used Tractor (35 HP) + Tiller",
    requestedAmount: 280000,
    bureauStatus: "New to Credit (NTC)",
    mandiDistanceKm: 18,
    last90DaysRainfallMm: 420,
    districtAvgRainfallMm: 390,
    rainfallAnomalyPct: 7.7,
    ndviScore: 0.72,
    satelliteVegetationIndex: [0.30, 0.48, 0.65, 0.72, 0.74, 0.70],
    plotPolygon: [[10.623, 79.253],[10.628, 79.254],[10.627, 79.260],[10.622, 79.258]],
    scoring: {
      score: 79,
      riskTier: "Low",
      recommendation: "Approved – Special Rural Delta Co-applicant",
      factors: [
        { name: "Cauvery Delta Water Stability", contribution: 0.25, status: "Positive", detail: "Abundant water flow; predictable Kuruvai yields" },
        { name: "Satellite NDVI Crop Health", contribution: 0.24, status: "Positive", detail: "Healthy spectral index across paddy nursery" },
        { name: "Alternative Digital Footprint", contribution: 0.16, status: "Positive", detail: "Regular milk cooperative dairy deposits at PACCS" },
        { name: "Market Distance (18 km)", contribution: -0.04, status: "Neutral", detail: "Moderate transport costs factored into cashflow" },
      ],
      offer: {
        approvedAmount: 275000,
        tenureMonths: 36,
        flatEmi: 9100,
        interestRatePct: 11.2,
        harvestEmiSchedule: [
          { month: "Sep (Kuruvai)", amount: 28000, type: "Harvest Surge" },
          { month: "Oct", amount: 3500, type: "Off-Season" },
          { month: "Nov", amount: 3500, type: "Off-Season" },
          { month: "Feb (Samba)", amount: 32000, type: "Harvest Surge" },
        ],
      },
    },
  },
  {
    id: "APP-1135",
    name: "Suresh Chandra Yadav",
    phone: "+91 99812 67843",
    state: "Madhya Pradesh",
    district: "Sehore",
    village: "Ashta",
    lat: 23.0184,
    lng: 76.8712,
    landSizeAcres: 3.5,
    cropType: "Soybean & Chana",
    soilType: "Deep Black Loam",
    irrigation: "Rainfed (No Borewell)",
    loanProduct: "Two Wheeler (Rural Utility)",
    requestedAmount: 85000,
    bureauStatus: "Thin File",
    mandiDistanceKm: 22,
    last90DaysRainfallMm: 240,
    districtAvgRainfallMm: 410,
    rainfallAnomalyPct: -41.4,
    ndviScore: 0.44,
    satelliteVegetationIndex: [0.28, 0.35, 0.42, 0.44, 0.41, 0.38],
    plotPolygon: [[23.016, 76.868],[23.021, 76.870],[23.019, 76.875],[23.014, 76.873]],
    scoring: {
      score: 53,
      riskTier: "Elevated",
      recommendation: "Conditional Approval with Co-Guarantor / Lower LTV",
      factors: [
        { name: "Severe Monsoon Deficit (-41%)", contribution: -0.28, status: "Alert", detail: "Dry spell in Sehore significantly threatens rainfed soybean" },
        { name: "Satellite NDVI Moisture Stress", contribution: -0.18, status: "Alert", detail: "Vegetation index (0.44) indicates stunted growth" },
        { name: "Alternative Telecom & Utility", contribution: 0.12, status: "Positive", detail: "Continuous 3-year prompt prepaid recharge history" },
        { name: "Small Land Size (3.5 Acres)", contribution: -0.07, status: "Warning", detail: "Sub-optimal surplus margin under climate stress" },
      ],
      offer: {
        approvedAmount: 62000,
        tenureMonths: 24,
        flatEmi: 3100,
        interestRatePct: 13.5,
        harvestEmiSchedule: [
          { month: "Oct (Post-Kharif)", amount: 9500, type: "Post-Harvest" },
          { month: "Nov", amount: 2000, type: "Min" },
          { month: "Dec", amount: 2000, type: "Min" },
          { month: "Mar (Post-Rabi)", amount: 8500, type: "Post-Harvest" },
        ],
      },
    },
  },
];

export const earlyWarnings: EarlyWarning[] = [
  {
    id: "EW-901",
    district: "Yavatmal",
    state: "Maharashtra",
    crop: "Cotton",
    activeLoansCount: 420,
    totalExposureLakhs: 1890,
    warningType: "Severe Rainfall Deficit (-38%)",
    severity: "High",
    impactDescription: "Prolonged 24-day dry spell during boll formation stage. High probability of yield contraction by 25-30%.",
    recommendedAction: "Offer 60-day moratorium on principal; trigger vernacular SMS/WhatsApp advisory on drip micro-irrigation subsidies.",
  },
  {
    id: "EW-902",
    district: "Kurnool",
    state: "Andhra Pradesh",
    crop: "Groundnut",
    activeLoansCount: 295,
    totalExposureLakhs: 1140,
    warningType: "Satellite NDVI Vegetative Dip (-22%)",
    severity: "Medium",
    impactDescription: "Late blight pest infestation identified through multi-spectral red-edge band reflection.",
    recommendedAction: "Dispatch TVS Credit field officer for sample crop inspection; restructure Q3 harvest repayment installment.",
  },
  {
    id: "EW-903",
    district: "Surendranagar",
    state: "Gujarat",
    crop: "Castor / Cotton",
    activeLoansCount: 340,
    totalExposureLakhs: 1520,
    warningType: "Mandi Price Slump (-18% below MSP)",
    severity: "Medium",
    impactDescription: "Glut in local APMC yard has depressed realized wholesale prices for uncleaned cotton.",
    recommendedAction: "Adjust automated collection mandates; offer extended tenure by 6 months to reduce monthly EMI burden.",
  },
  {
    id: "EW-904",
    district: "Thanjavur",
    state: "Tamil Nadu",
    crop: "Paddy",
    activeLoansCount: 510,
    totalExposureLakhs: 2150,
    warningType: "Mettur Dam Storage Surplus (+18%)",
    severity: "Low",
    impactDescription: "Optimal canal irrigation ensures bumper Kuruvai and Samba harvests. Delinquency risk near 0.8%.",
    recommendedAction: "Activate pre-approved Tractor Upgrade & Harvester Loan campaigns via WhatsApp bot.",
  },
];

export const assistantQA = {
  en: [
    { triggers: ["document", "docs", "paper", "aadhaar", "pan", "what do i need"], answer: "As a farmer, you need very minimal paperwork! Just:\n\n1️⃣ Aadhaar Card\n2️⃣ Land 7/12 extract / Patta passbook or Khasra\n3️⃣ Bank account passbook copy\n\nWe do NOT ask for complex income tax returns or formal CIBIL scores." },
    { triggers: ["satellite", "land", "verify", "ndvi", "map", "how do you check"], answer: "Our Sentinel-2 satellite system scans your farm plot from space! 🛰️ It checks your crop health (NDVI) and water availability. This allows TVS Credit to approve your tractor or vehicle loan in minutes — without waiting weeks for physical patwari verification." },
    { triggers: ["harvest", "emi", "repayment", "season", "crop sale", "payment"], answer: "We offer 'Harvest-Aligned EMIs'! 🌾 You only pay larger loan amounts after your harvest (Nov-Dec or Apr-May) when you sell your crop at the Mandi. During lean growing months, your EMI is reduced to almost zero — no financial stress!" },
    { triggers: ["tractor", "amount", "eligibility", "how much", "limit", "loan amount"], answer: "Tractor loan eligibility depends on your land holding and crop type:\n\n• 3-5 acres → 35-45 HP tractors (up to ₹4.5 Lakhs)\n• 5+ acres → 50+ HP tractors (up to ₹7.5 Lakhs)\n\nWe fund up to 90% on-road price! 🚜" },
    { triggers: ["time", "disbursement", "how long", "speed", "fast", "when"], answer: "With our AI Decision Hub, in-principle sanction is generated in under 3 minutes ⚡. Physical machine delivery at your local TVS Credit dealership can be completed within 24 to 48 hours." },
    { triggers: ["interest", "rate", "cost"], answer: "Our interest rates start from 10.5% p.a. for top-tier applicants with strong land and crop profiles. Rates are personalized based on your AI-generated credit score, satellite crop health data, and repayment history." },
  ],
  hi: [
    { triggers: ["दस्तावेज", "कागजात", "डॉक्यूमेंट", "आधार", "खसरा", "क्या चाहिए"], answer: "किसान भाइयों के लिए बहुत कम कागजात चाहिए! सिर्फ:\n\n1️⃣ आधार कार्ड\n2️⃣ ज़मीन की खतौनी / 7/12 या पावती (पट्टा)\n3️⃣ बैंक पासबुक\n\nहमें किसी ITR या सिबिल स्कोर की जरूरत नहीं है।" },
    { triggers: ["सैटेलाइट", "जमीन", "खेत", "नक्शा", "जांच"], answer: "हमारा सैटेलाइट सिस्टम अंतरिक्ष से आपके खेत का मुआयना करता है! 🛰️ यह फसल की हरियाली (NDVI) और नमी देखता है। इससे बिना पटवारी के चक्कर काटे 3 मिनट में आपका लोन अप्रूव हो जाता है।" },
    { triggers: ["किश्त", "ईएमआई", "फसल", "मंडी", "चुकाना", "भुगतान"], answer: "हम 'फसल अनुसार किश्त' (Harvest-Aligned EMI) देते हैं! 🌾 जब आपकी फसल कटकर मंडी में बिकती है, तब बड़ी किश्त। बुवाई के समय किश्त नाममात्र या शून्य — कोई तनाव नहीं!" },
    { triggers: ["ट्रैक्टर", "कितना लोन", "राशि", "पात्रता"], answer: "लोन आपकी ज़मीन और फसल पर निर्भर करता है:\n\n• 3-5 एकड़ → 35-45 HP ट्रैक्टर (₹4.5 लाख तक)\n• 5+ एकड़ → 50+ HP ट्रैक्टर (₹7.5 लाख तक)\n\nहम 90% तक फाइनेंस करते हैं! 🚜" },
    { triggers: ["समय", "कब मिलेगा", "कितनी देर"], answer: "ऑनलाइन स्वीकृति सिर्फ 3 मिनट में! ⚡ डीलर से ट्रैक्टर की डिलीवरी 24-48 घंटे में।" },
  ],
};
