/**
 * Client-side assessment and storage engine for RainSense AI.
 * Provides instant, zero-latency calculation and local persistence
 * when deployed on Vercel or when the backend server is unreachable.
 */

const COEFFICIENTS = {
  'RCC / Concrete': 0.85,
  'Metal': 0.90,
  'Tile': 0.80,
  'Other': 0.70,
};

const CITY_RAINFALL = {
  bangalore: { annual: 970, monthly: [2, 7, 18, 45, 110, 80, 115, 145, 195, 180, 60, 15] },
  bengaluru: { annual: 970, monthly: [2, 7, 18, 45, 110, 80, 115, 145, 195, 180, 60, 15] },
  chennai: { annual: 1400, monthly: [25, 10, 15, 15, 40, 55, 100, 140, 125, 300, 350, 150] },
  mumbai: { annual: 2200, monthly: [1, 1, 1, 2, 12, 500, 800, 550, 300, 30, 3, 1] },
  delhi: { annual: 790, monthly: [15, 18, 15, 12, 25, 75, 230, 240, 120, 20, 5, 10] },
  hyderabad: { annual: 820, monthly: [3, 8, 12, 22, 35, 110, 160, 170, 160, 95, 25, 5] },
  kolkata: { annual: 1600, monthly: [12, 25, 35, 55, 130, 290, 330, 340, 270, 120, 20, 5] },
  pune: { annual: 720, monthly: [1, 1, 3, 15, 35, 150, 220, 160, 110, 45, 15, 2] },
  ahmedabad: { annual: 800, monthly: [1, 1, 1, 2, 10, 90, 310, 250, 110, 15, 5, 1] },
  jaipur: { annual: 650, monthly: [5, 6, 4, 5, 18, 65, 220, 210, 90, 15, 4, 3] },
  kochi: { annual: 3000, monthly: [20, 25, 40, 110, 280, 700, 600, 420, 300, 280, 150, 40] },
};

function getRainfallData(city) {
  const key = (city || '').toLowerCase().trim();
  for (const [c, data] of Object.entries(CITY_RAINFALL)) {
    if (key.includes(c)) return data;
  }
  // Default realistic tropical rainfall pattern
  return { annual: 1050, monthly: [10, 12, 20, 40, 90, 180, 220, 210, 160, 80, 20, 8] };
}

function calculateReadinessScore(area, annualRainfall, material, condition, obstacleCount) {
  // Area factor (max 25)
  let areaScore = 0;
  if (area >= 200) areaScore = 25;
  else if (area >= 100) areaScore = 20;
  else if (area >= 50) areaScore = 15;
  else areaScore = 10;

  // Rainfall factor (max 25)
  let rainScore = 0;
  if (annualRainfall >= 1500) rainScore = 25;
  else if (annualRainfall >= 1000) rainScore = 20;
  else if (annualRainfall >= 600) rainScore = 15;
  else rainScore = 10;

  // Material factor (max 20)
  let matScore = 0;
  if (material === 'Metal') matScore = 20;
  else if (material === 'RCC / Concrete') matScore = 18;
  else if (material === 'Tile') matScore = 15;
  else matScore = 12;

  // Condition factor (max 15)
  let condScore = 0;
  if (condition === 'Good' || condition === 'Excellent') condScore = 15;
  else if (condition === 'Fair' || condition === 'Average') condScore = 10;
  else condScore = 5;

  // Obstacle factor (max 15)
  let obsScore = 15;
  if (obstacleCount > 4) obsScore = 5;
  else if (obstacleCount > 2) obsScore = 10;
  else if (obstacleCount > 0) obsScore = 12;

  const total = areaScore + rainScore + matScore + condScore + obsScore;

  let category = 'Moderate';
  if (total >= 80) category = 'Excellent';
  else if (total >= 65) category = 'Good';
  else if (total < 40) category = 'Poor';

  return {
    total,
    category,
    breakdown: {
      roof_area: { score: areaScore, max: 25, label: 'Roof Catchment Area' },
      rainfall: { score: rainScore, max: 25, label: 'Annual Precipitation' },
      roof_material: { score: matScore, max: 20, label: 'Runoff Efficiency' },
      roof_condition: { score: condScore, max: 15, label: 'Structural Condition' },
      obstacles: { score: obsScore, max: 15, label: 'Clearance & Accessibility' },
    },
    explanation: `Your roof achieved a ${category} score of ${total}/100. With ${area} m² of ${material} roofing in ${condition.toLowerCase()} condition and an estimated annual rainfall of ${annualRainfall} mm, your system has significant potential for effective rainwater harvesting.`,
  };
}

function generateRecommendations(area, harvestableLitres) {
  // Sizing: storage for peak month or ~15-20% of annual harvest
  const tankCapacity = Math.min(25000, Math.max(1000, Math.round((harvestableLitres * 0.15) / 500) * 500));
  const gutterMeters = Math.round(Math.sqrt(area) * 4 * 0.8);
  const downpipeMeters = Math.round(gutterMeters * 0.6);

  const tankCost = tankCapacity * 8;
  const gutterCost = gutterMeters * 350;
  const filterCost = 3500;
  const diverterCost = 2500;
  const downpipeCost = downpipeMeters * 250;
  const rechargePitCost = area > 100 ? 15000 : 0;
  const hardwareTotal = tankCost + gutterCost + filterCost + diverterCost + downpipeCost + rechargePitCost;
  const labourCost = Math.round(hardwareTotal * 0.20);
  const totalCost = hardwareTotal + labourCost;

  const annualSavings = Math.round(harvestableLitres * 0.10); // ₹0.10/litre
  const paybackYears = annualSavings > 0 ? +(totalCost / annualSavings).toFixed(1) : 0;

  const components = [
    {
      name: 'Storage Tank',
      description: `${tankCapacity.toLocaleString()} Litres modular PVC / RCC storage tank with overflow siphon`,
      capacity: `${tankCapacity.toLocaleString()} L`,
      priority: 'High',
      estimated_cost_inr: tankCost,
    },
    {
      name: 'Rooftop Gutters',
      description: `UV-stabilized PVC catchment gutters (~${gutterMeters}m perimeter coverage)`,
      capacity: `${gutterMeters} m`,
      priority: 'High',
      estimated_cost_inr: gutterCost,
    },
    {
      name: 'First-Flush Diverter',
      description: 'Automatic float-valve diverter to wash away initial roof dirt & debris',
      capacity: '50-100 L',
      priority: 'High',
      estimated_cost_inr: diverterCost,
    },
    {
      name: 'Dual-Stage Mesh Filter',
      description: 'Self-cleaning stainless steel wire mesh filter (100 micron) for clean inflow',
      capacity: 'Standard',
      priority: 'Medium',
      estimated_cost_inr: filterCost,
    },
    {
      name: 'Downpipes & Fittings',
      description: `Heavy-duty PVC downpipes (~${downpipeMeters}m) with secure brackets and elbows`,
      capacity: `${downpipeMeters} m`,
      priority: 'Medium',
      estimated_cost_inr: downpipeCost,
    },
  ];

  if (rechargePitCost > 0) {
    components.push({
      name: 'Groundwater Recharge Pit',
      description: 'Percolation pit with gravel, coarse sand, and boulder layers for water table replenishment',
      capacity: '1.5m x 1.5m',
      priority: 'Optional',
      estimated_cost_inr: rechargePitCost,
    });
  }

  return {
    storage_tank_capacity_litres: tankCapacity,
    components,
    cost_estimation: {
      hardware_cost: hardwareTotal,
      labour_cost: labourCost,
      total_estimated_cost_inr: totalCost,
      annual_savings_inr: annualSavings,
      payback_period_years: paybackYears,
    },
  };
}

export function processClientAssessment(locationData, roofData, imageFile) {
  const area = Number(roofData.area_m2) || 100;
  const material = roofData.material || 'RCC / Concrete';
  const condition = roofData.condition || 'Good';
  const coeff = COEFFICIENTS[material] || 0.85;

  const rainfallInfo = getRainfallData(locationData.city);
  const annualRainfall = rainfallInfo.annual;

  // Formula: V = Area * Rainfall * Runoff Coefficient
  const harvestableLitres = Math.round(area * annualRainfall * coeff);

  // Simulated detections (e.g. solar panels, tanks, vents)
  const detections = [
    { label: 'Rooftop Surface', confidence: 0.94, bbox: [20, 20, 960, 540] },
    { label: 'Water Tank', confidence: 0.88, bbox: [120, 80, 220, 190] },
    { label: 'Obstacle / Vent', confidence: 0.82, bbox: [450, 160, 520, 240] },
  ];

  const scoreData = calculateReadinessScore(area, annualRainfall, material, condition, detections.length);
  const recData = generateRecommendations(area, harvestableLitres);

  // Monthly harvest calculation
  const monthlyHarvest = rainfallInfo.monthly.map((rainMm, idx) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx],
    rainfall_mm: rainMm,
    harvest_litres: Math.round(area * rainMm * coeff),
  }));

  const assessmentId = 'rs_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

  const assessment = {
    id: assessmentId,
    location: {
      city: locationData.city || 'Bangalore',
      state: locationData.state || 'Karnataka',
      country: locationData.country || 'India',
      latitude: locationData.latitude || 12.9716,
      longitude: locationData.longitude || 77.5946,
    },
    roof: {
      area_m2: area,
      material: material,
      type: roofData.type || 'Flat Roof',
      condition: condition,
    },
    detections: {
      count: detections.length,
      obstacles_detected: detections.map((d) => d.label),
      details: detections,
    },
    rainfall: {
      annual_mm: annualRainfall,
      monthly_data: monthlyHarvest,
      source: 'RainSense Climate Intelligence Engine (Offline / Vercel Demo)',
    },
    calculation: {
      formula: 'V = A × R × C',
      harvestable_litres: harvestableLitres,
      runoff_coefficient: coeff,
    },
    score: scoreData,
    recommendations: recData,
    created_at: new Date().toISOString(),
    demo_mode: true,
  };

  // Save to localStorage
  saveToLocalStorage(assessment);

  return assessment;
}

export function saveToLocalStorage(assessment) {
  try {
    const existing = JSON.parse(localStorage.getItem('rainsense_assessments') || '[]');
    const filtered = existing.filter((a) => a.id !== assessment.id);
    filtered.unshift(assessment);
    localStorage.setItem('rainsense_assessments', JSON.stringify(filtered.slice(0, 30)));
  } catch (err) {
    console.warn('Could not save assessment to localStorage', err);
  }
}

export function getAssessmentsFromLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem('rainsense_assessments') || '[]');
  } catch {
    return [];
  }
}

export function getAssessmentById(id) {
  const list = getAssessmentsFromLocalStorage();
  return list.find((a) => a.id === id) || null;
}

export function deleteAssessmentFromLocalStorage(id) {
  try {
    const list = getAssessmentsFromLocalStorage();
    const updated = list.filter((a) => a.id !== id);
    localStorage.setItem('rainsense_assessments', JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export function getClientDashboardStats() {
  const list = getAssessmentsFromLocalStorage();
  const total = list.length;
  if (total === 0) {
    return {
      total_assessments: 0,
      average_score: 0,
      total_water_potential: 0,
      recent_assessments: [],
    };
  }

  const scores = list.map((a) => a.score?.total || 0);
  const waters = list.map((a) => a.calculation?.harvestable_litres || 0);
  const avgScore = +(scores.reduce((a, b) => a + b, 0) / total).toFixed(1);
  const totalWater = Math.round(waters.reduce((a, b) => a + b, 0));

  const recent = list.slice(0, 5).map((a) => ({
    id: a.id,
    location: a.location,
    roof_area_m2: a.roof.area_m2,
    harvestable_litres: a.calculation.harvestable_litres,
    score_total: a.score.total,
    score_category: a.score.category,
    created_at: a.created_at,
    demo_mode: true,
  }));

  return {
    total_assessments: total,
    average_score: avgScore,
    total_water_potential: totalWater,
    latest_assessment: recent[0] || null,
    recent_assessments: recent,
  };
}
