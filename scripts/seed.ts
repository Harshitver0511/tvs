#!/usr/bin/env tsx
/**
 * TVS Credit — Database Seed Script
 * Populates the database with sample farmer applications for demo/testing.
 * 
 * Usage: npx tsx scripts/seed.ts
 */

import { latLngRingToEwkt, sphericalAreaAcres } from "../app/lib/db/geometry";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sampleFarmers = [
  {
    name: "Ramesh Kumar Patel",
    phone: "9876543210",
    state: "Maharashtra",
    district: "Nagpur",
    village: "Wardha",
    pincode: "440001",
    cropType: "Cotton (Bt)",
    irrigation: "Borewell & Rainfed",
    areaAcres: 5.2,
    lat: 21.1458,
    lng: 79.0882,
    requestedAmount: 350000,
    product: "Kharif Crop Loan",
    ndviScore: 0.72,
    rainfallMm: 340,
    soilType: "Black Cotton (Vertisol)",
  },
  {
    name: "Sunita Devi Yadav",
    phone: "8765432109",
    state: "Madhya Pradesh",
    district: "Sagar",
    village: "Banda",
    pincode: "470001",
    cropType: "Soybean",
    irrigation: "Canal & Rainfed",
    areaAcres: 8.0,
    lat: 23.8388,
    lng: 78.7378,
    requestedAmount: 500000,
    product: "Kharif Crop Loan",
    ndviScore: 0.68,
    rainfallMm: 280,
    soilType: "Red Laterite",
  },
  {
    name: "Arjun Singh Rajput",
    phone: "7654321098",
    state: "Rajasthan",
    district: "Kota",
    village: "Bundi",
    pincode: "324001",
    cropType: "Wheat",
    irrigation: "Tube-well",
    areaAcres: 12.5,
    lat: 25.2138,
    lng: 75.8648,
    requestedAmount: 750000,
    product: "Rabi Crop Loan",
    ndviScore: 0.78,
    rainfallMm: 190,
    soilType: "Alluvial Sandy Loam",
  },
  {
    name: "Lakshmi Bai Gowda",
    phone: "6543210987",
    state: "Karnataka",
    district: "Dharwad",
    village: "Hubli",
    pincode: "580001",
    cropType: "Jowar (Sorghum)",
    irrigation: "Rainfed only",
    areaAcres: 3.8,
    lat: 15.3647,
    lng: 75.1240,
    requestedAmount: 200000,
    product: "Kharif Crop Loan",
    ndviScore: 0.55,
    rainfallMm: 420,
    soilType: "Red Sandy Loam",
  },
  {
    name: "Mohammad Ismail Khan",
    phone: "9988776655",
    state: "Uttar Pradesh",
    district: "Gorakhpur",
    village: "Deoria",
    pincode: "273001",
    cropType: "Rice (Paddy)",
    irrigation: "Canal Irrigated",
    areaAcres: 6.0,
    lat: 26.7606,
    lng: 83.3732,
    requestedAmount: 400000,
    product: "Kharif Crop Loan",
    ndviScore: 0.81,
    rainfallMm: 560,
    soilType: "Alluvial Clay Loam",
  },
];

async function seedDatabase() {
  console.log("🌱 TVS Credit Seed Script — Starting...\n");

  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes("xxxx")) {
    console.log("⚠️  No Supabase credentials found. Seeding via API route instead.\n");
    // Seed via local API
    for (const farmer of sampleFarmers) {
      try {
        const polygon: [number, number][] = [
          [farmer.lat - 0.002, farmer.lng - 0.002],
          [farmer.lat + 0.002, farmer.lng - 0.002],
          [farmer.lat + 0.002, farmer.lng + 0.002],
          [farmer.lat - 0.002, farmer.lng + 0.002],
        ];

        const res = await fetch("http://localhost:3000/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: farmer.name,
            phone: farmer.phone,
            state: farmer.state,
            district: farmer.district,
            village: farmer.village,
            pincode: farmer.pincode,
            product: farmer.product,
            requestedAmount: farmer.requestedAmount,
            cropType: farmer.cropType,
            irrigation: farmer.irrigation,
            areaAcres: farmer.areaAcres,
            plotPolygon: polygon,
            source: "drawn",
            consents: [
              { purpose: "ekyc", granted: true },
              { purpose: "satellite_analysis", granted: true },
              { purpose: "mandi_financial", granted: true },
            ],
          }),
        });

        const data = await res.json();
        if (data.success) {
          console.log(`  ✅ ${farmer.name} → ${data.applicationId} (${farmer.district}, ${farmer.state})`);
        } else {
          console.log(`  ❌ ${farmer.name} — ${data.error || "Failed"}`);
        }
      } catch (err: any) {
        console.log(`  ❌ ${farmer.name} — ${err.message}`);
      }
    }
    console.log("\n🏁 Seed complete. Run the app and check /staff to see the data.");
    return;
  }

  // Direct Supabase REST seeding
  const headers = {
    apikey: SUPABASE_KEY!,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal,resolution=merge-duplicates",
  };

  for (const farmer of sampleFarmers) {
    const userId = `USR-SEED-${farmer.phone.slice(-4)}`;
    const plotId = `PLT-SEED-${farmer.phone.slice(-4)}`;
    const appId = `APP-SEED-${farmer.phone.slice(-4)}`;

    try {
      // Insert user
      await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST", headers,
        body: JSON.stringify({ id: userId, name: farmer.name, phone: farmer.phone, role: "farmer", preferred_lang: "hi" }),
      });

      // Insert farmer profile
      await fetch(`${SUPABASE_URL}/rest/v1/farmers`, {
        method: "POST", headers,
        body: JSON.stringify({ user_id: userId, state: farmer.state, district: farmer.district, village: farmer.village, pincode: farmer.pincode }),
      });

      // Insert plot: a square sized so its measured area matches the declared acres
      const half = Math.sqrt((farmer.areaAcres * 4046.8564224)) / 2 / 111320; // degrees latitude
      const halfLng = half / Math.cos((farmer.lat * Math.PI) / 180);
      const ring: [number, number][] = [
        [farmer.lat - half, farmer.lng - halfLng],
        [farmer.lat + half, farmer.lng - halfLng],
        [farmer.lat + half, farmer.lng + halfLng],
        [farmer.lat - half, farmer.lng + halfLng],
      ];
      await fetch(`${SUPABASE_URL}/rest/v1/plots`, {
        method: "POST", headers,
        body: JSON.stringify({
          id: plotId, farmer_id: userId,
          // PostGIS geometry(Polygon,4326) accepts EWKT; axis order is lng lat
          geom: latLngRingToEwkt(ring),
          declared_area_acres: farmer.areaAcres,
          area_acres: Math.round(sphericalAreaAcres(ring) * 100) / 100, crop_type: farmer.cropType,
          irrigation: farmer.irrigation, soil_type: farmer.soilType, source: "drawn",
        }),
      });

      // Insert application
      await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
        method: "POST", headers,
        body: JSON.stringify({
          id: appId, farmer_id: userId, plot_id: plotId,
          product: farmer.product, requested_amount: farmer.requestedAmount,
          status: "decided", bureau_status: "Verified via Alternative Data & Geospatial AI",
        }),
      });

      console.log(`  ✅ ${farmer.name} → ${appId}`);
    } catch (err: any) {
      console.log(`  ❌ ${farmer.name} — ${err.message}`);
    }
  }

  console.log("\n🏁 Supabase seed complete.");
}

seedDatabase().catch(console.error);
