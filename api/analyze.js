// Vercel Serverless Function for /api/analyze
export default function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const area = 120;
  const annualRainfall = 970;
  const coeff = 0.85;
  const harvestableLitres = Math.round(area * annualRainfall * coeff);
  const harvestableM3 = +(harvestableLitres / 1000).toFixed(1);

  const assessmentId = 'rs_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);

  const result = {
    id: assessmentId,
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      latitude: 12.9716,
      longitude: 77.5946,
    },
    roof: {
      area_m2: area,
      material: 'RCC / Concrete',
      type: 'Flat',
      condition: 'Good',
    },
    ai_analysis: {
      roof_detected: true,
      confidence: 0.94,
      analysis_mode: 'ai',
      obstacles: ['Solar PV Panel Array', 'Overhead Water Storage Tank', 'Plumbing Vent Pipe'],
      model_info: 'YOLOv8 Aerial Rooftop Detection Model',
    },
    rainfall: {
      annual_mm: annualRainfall,
      monthly_mm: [3, 8, 19, 46, 112, 82, 118, 149, 198, 182, 62, 16],
      source: 'RainSense_Climate_Intelligence',
    },
    calculation: {
      formula: 'V = A × R × C',
      harvestable_litres: harvestableLitres,
      harvestable_m3: harvestableM3,
      monthly_harvest_litres: [255, 680, 1615, 3910, 9520, 6970, 10030, 12665, 16830, 15470, 5270, 1360],
      runoff_coefficient: coeff,
    },
    score: {
      total: 82,
      category: 'Excellent',
      breakdown: {
        roof_area: 22,
        rainfall: 20,
        roof_material: 18,
        roof_condition: 15,
        obstacles: 7,
      },
      explanation: {
        positive: [
          'Generous catchment area of 120 m² enables harvesting ~98,940 L/year',
          'RCC / Concrete roofing provides high runoff efficiency with a 0.85 coefficient',
          'Good structural roof condition supports mounting',
        ],
        attention: [
          'Periodic gutter cleaning recommended before monsoon onset',
          'Obstacles detected (Solar Array, Water Tank) — gutters should route around clearance paths',
        ],
      },
    },
    recommendations: {
      storage_litres: 15000,
      storage_description: 'Recommended 15,000 Litres storage capacity based on peak monsoon precipitation.',
      total_estimated_cost: 45000,
      annual_savings: 9894,
      payback_years: 4.5,
      components: [
        {
          name: 'Modular Storage Tank',
          description: '15,000L Triple-Layer UV-Stabilized Polyethylene Tank with brass outlet & overflow',
          priority: 'essential',
          estimated_cost: 15000,
        },
        {
          name: 'Rooftop Catchment Gutters',
          description: 'Heavy-duty PVC U-profile gutters (~38m) with secure roof mounting brackets',
          priority: 'essential',
          estimated_cost: 13300,
        },
        {
          name: 'Automatic First-Flush Diverter',
          description: 'Float-ball diverter chamber to discard first 1-2mm of contaminated rainwater',
          priority: 'essential',
          estimated_cost: 2500,
        },
        {
          name: 'Dual Stage Rainwater Filter',
          description: 'Self-cleaning stainless steel wire mesh filter (120 micron) for leaf & sediment removal',
          priority: 'recommended',
          estimated_cost: 3500,
        },
        {
          name: 'PVC Downpipes & Fittings',
          description: 'UV-resistant downpipes (~19m) connecting gutters to storage',
          priority: 'recommended',
          estimated_cost: 4750,
        },
      ],
    },
    created_at: new Date().toISOString(),
    demo_mode: true,
  };

  res.status(200).json(result);
}
