// Comprehensive APMC Mandi directory covering major agricultural belts.
// Locations are also loaded into the PostGIS `mandis` table by scripts/migrate-postgis.ts.
export const apmcDirectory: Record<
  string,
  { name: string; lat: number; lng: number; commodityRates: Record<string, number> }
> = {
  Yavatmal: {
    name: "Yavatmal APMC Market Yard",
    lat: 20.3888,
    lng: 78.1204,
    commodityRates: { Cotton: 7150, Soybean: 4420, Wheat: 2650, Gram: 5200, Paddy: 2300, Maize: 2100 },
  },
  Bathinda: {
    name: "Bathinda Grain Market",
    lat: 30.211,
    lng: 74.9455,
    commodityRates: { Wheat: 2325, Paddy: 2280, Cotton: 6980, Mustard: 5650, Maize: 2150, Gram: 5100 },
  },
  Thanjavur: {
    name: "Thanjavur Uzhavar Sandhai & APMC",
    lat: 10.787,
    lng: 79.1378,
    commodityRates: { Paddy: 2350, Sugarcane: 3200, Groundnut: 6750, Cotton: 7000, Maize: 2200, Wheat: 2600 },
  },
  Sehore: {
    name: "Sehore Krishi Upaj Mandi",
    lat: 23.2032,
    lng: 77.0844,
    commodityRates: { Soybean: 4580, Wheat: 2540, Gram: 5850, Cotton: 7100, Paddy: 2350, Maize: 2180 },
  },
  Nashik: {
    name: "Lasalgaon / Nashik APMC",
    lat: 20.0063,
    lng: 74.2281,
    commodityRates: { Onion: 2100, Soybean: 4500, Grapes: 6200, Cotton: 7050, Wheat: 2550, Paddy: 2300 },
  },
  Indore: {
    name: "Indore Mandi Board",
    lat: 22.7196,
    lng: 75.8577,
    commodityRates: { Soybean: 4650, Wheat: 2580, Gram: 5900, Cotton: 7200, Maize: 2200, Paddy: 2350 },
  },
  Ludhiana: {
    name: "Ludhiana Grain Market",
    lat: 30.901,
    lng: 75.8573,
    commodityRates: { Wheat: 2350, Paddy: 2310, Cotton: 6950, Maize: 2180, Mustard: 5700, Gram: 5150 },
  },
  Nagpur: {
    name: "Nagpur Kalamna APMC",
    lat: 21.1458,
    lng: 79.0882,
    commodityRates: { Cotton: 7180, Soybean: 4480, Wheat: 2600, Gram: 5350, Paddy: 2280, Maize: 2120 },
  },
  Guntur: {
    name: "Guntur Mirchi Yard & APMC",
    lat: 16.3067,
    lng: 80.4365,
    commodityRates: { Cotton: 7100, Paddy: 2320, Groundnut: 6800, Maize: 2250, Wheat: 2580, Sugarcane: 3150 },
  },
  Kota: {
    name: "Kota Mandi Samiti",
    lat: 25.2138,
    lng: 75.8648,
    commodityRates: { Soybean: 4550, Wheat: 2530, Gram: 5750, Mustard: 5600, Cotton: 7050, Paddy: 2350 },
  },
};
