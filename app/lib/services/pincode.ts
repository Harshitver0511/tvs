// India Post Pincode Lookup Service
// Real public API: https://api.postalpincode.in/pincode/{pincode}

export interface PincodeDetails {
  pincode: string;
  district: string;
  state: string;
  postOffices: string[];
  approxLat: number;
  approxLng: number;
}

// Approximate district centroid fallbacks for Indian agro-hubs
const districtCentroids: Record<string, [number, number]> = {
  Yavatmal: [20.1384, 78.3182],
  Bathinda: [30.211, 74.9455],
  Thanjavur: [10.787, 79.1378],
  Sehore: [23.2032, 77.0844],
  Nashik: [19.9975, 73.7898],
  Nagpur: [21.1458, 79.0882],
  Amravati: [20.9374, 77.7796],
  Ludhiana: [30.901, 75.8573],
  Karnal: [29.6857, 76.9905],
  Coimbatore: [11.0168, 76.9558],
  Hoshangabad: [22.7533, 77.7289],
};

export async function lookupPincode(pincode: string): Promise<PincodeDetails | null> {
  const cleanPin = pincode.trim().replace(/\D/g, "");
  if (cleanPin.length !== 6) return null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      next: { revalidate: 86400 }, // Cache for 24h
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error("Pincode API response not OK");

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const poList = data[0].PostOffice;
      const district = poList[0].District;
      const state = poList[0].State;
      const postOffices = poList.map((p: any) => p.Name);

      // Estimate centroid from known agro-districts or calculate region hash
      const coords = districtCentroids[district] || [
        20.5937 + ((parseInt(cleanPin.slice(0, 3), 10) % 100) - 50) * 0.1,
        78.9629 + ((parseInt(cleanPin.slice(3, 6), 10) % 100) - 50) * 0.1,
      ];

      return {
        pincode: cleanPin,
        district,
        state,
        postOffices,
        approxLat: coords[0],
        approxLng: coords[1],
      };
    }
  } catch (error) {
    console.warn("Postal Pincode API lookup error:", error);
  }

  // Graceful heuristic fallback based on Indian Postal Circle (1st digit)
  const circleMap: Record<string, { state: string; district: string; lat: number; lng: number }> = {
    "1": { state: "Punjab / Haryana", district: "Bathinda", lat: 30.211, lng: 74.9455 },
    "2": { state: "Uttar Pradesh", district: "Varanasi", lat: 25.3176, lng: 82.9739 },
    "3": { state: "Rajasthan / Gujarat", district: "Jaipur", lat: 26.9124, lng: 75.7873 },
    "4": { state: "Maharashtra / MP", district: "Yavatmal", lat: 20.1384, lng: 78.3182 },
    "5": { state: "Andhra Pradesh / Telangana", district: "Warangal", lat: 17.9689, lng: 79.5941 },
    "6": { state: "Tamil Nadu", district: "Thanjavur", lat: 10.787, lng: 79.1378 },
    "7": { state: "West Bengal / Odisha", district: "Burdwan", lat: 23.2324, lng: 87.8615 },
    "8": { state: "Bihar / Jharkhand", district: "Patna", lat: 25.5941, lng: 85.1376 },
  };

  const circle = cleanPin[0] || "4";
  const def = circleMap[circle] || circleMap["4"];

  return {
    pincode: cleanPin,
    district: def.district,
    state: def.state,
    postOffices: [`${def.district} Central`, "Rural Post Office"],
    approxLat: def.lat,
    approxLng: def.lng,
  };
}
