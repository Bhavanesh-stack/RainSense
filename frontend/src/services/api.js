import axios from 'axios';
import {
  processClientAssessment,
  getAssessmentsFromLocalStorage,
  getAssessmentById,
  deleteAssessmentFromLocalStorage,
  getClientDashboardStats,
} from './clientAssessment';

// External backend URL (only used if explicitly configured with an external https://... host)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Detect if we are running in frontend-only mode (e.g. Vercel deployment or without backend)
const isFrontendOnly =
  !API_BASE_URL ||
  (typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('netlify.app') ||
      window.location.hostname.includes('github.io')));

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function fallbackCalculation(formData) {
  let location = {};
  let roof = {};
  try {
    location = JSON.parse(formData.get('location_json') || '{}');
  } catch (e) {
    location = { city: 'Bangalore', state: 'Karnataka', country: 'India' };
  }
  try {
    roof = JSON.parse(formData.get('roof_json') || '{}');
  } catch (e) {
    roof = { area_m2: 120, material: 'RCC / Concrete', condition: 'Good' };
  }
  const image = formData.get('image');
  const result = processClientAssessment(location, roof, image);
  return { data: result, status: 200 };
}

// ─── Assessments Service (Zero 405 Errors on Vercel) ─────────────────
export const assessmentService = {
  analyze: async (formData) => {
    // If deployed on Vercel or frontend-only mode, run client engine directly to prevent 405 errors
    if (isFrontendOnly || !API_BASE_URL.startsWith('http')) {
      return fallbackCalculation(formData);
    }

    try {
      const res = await api.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000,
      });
      if (res.data && typeof res.data === 'object' && res.data.id && res.data.score) {
        return res;
      }
      return fallbackCalculation(formData);
    } catch (err) {
      return fallbackCalculation(formData);
    }
  },

  getAll: async () => {
    if (isFrontendOnly || !API_BASE_URL.startsWith('http')) {
      return { data: getAssessmentsFromLocalStorage(), status: 200 };
    }
    try {
      const res = await api.get('/api/assessments');
      if (Array.isArray(res.data)) {
        return res;
      }
      return { data: getAssessmentsFromLocalStorage(), status: 200 };
    } catch (err) {
      return { data: getAssessmentsFromLocalStorage(), status: 200 };
    }
  },

  getById: async (id) => {
    if (isFrontendOnly || !API_BASE_URL.startsWith('http')) {
      const item = getAssessmentById(id);
      if (item) return { data: item, status: 200 };
      throw new Error('Assessment not found');
    }
    try {
      const res = await api.get(`/api/assessments/${id}`);
      if (res.data && typeof res.data === 'object' && res.data.id) {
        return res;
      }
      const item = getAssessmentById(id);
      if (item) return { data: item, status: 200 };
      throw new Error('Assessment not found');
    } catch (err) {
      const item = getAssessmentById(id);
      if (item) return { data: item, status: 200 };
      throw err;
    }
  },

  delete: async (id) => {
    if (!isFrontendOnly && API_BASE_URL.startsWith('http')) {
      try {
        await api.delete(`/api/assessments/${id}`);
      } catch (err) {
        // ignore
      }
    }
    deleteAssessmentFromLocalStorage(id);
    return { data: { success: true }, status: 200 };
  },

  getDashboard: async () => {
    if (isFrontendOnly || !API_BASE_URL.startsWith('http')) {
      return { data: getClientDashboardStats(), status: 200 };
    }
    try {
      const res = await api.get('/api/dashboard');
      if (res.data && typeof res.data === 'object' && typeof res.data.total_assessments === 'number') {
        return res;
      }
      return { data: getClientDashboardStats(), status: 200 };
    } catch (err) {
      return { data: getClientDashboardStats(), status: 200 };
    }
  },
};

// ─── Reports Service ──────────────────────────────────────────────
export const reportService = {
  download: async (assessmentId) => {
    if (!isFrontendOnly && API_BASE_URL.startsWith('http')) {
      try {
        const response = await api.get(`/api/reports/${assessmentId}`, {
          responseType: 'blob',
          timeout: 10000,
        });
        if (response.data && response.data.size > 1000) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `RainSense_Report_${assessmentId.slice(0, 8)}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          return;
        }
      } catch (err) {
        // Fallback
      }
    }

    const assessment = getAssessmentById(assessmentId);
    if (assessment) {
      generateClientReport(assessment);
    } else {
      throw new Error('Assessment report could not be generated.');
    }
  },
};

function generateClientReport(assessment) {
  const content = `
========================================================================
                      RAINSENSE AI ASSESSMENT REPORT
========================================================================
Assessment ID: ${assessment.id}
Date: ${new Date(assessment.created_at).toLocaleDateString()}
Location: ${assessment.location.city}, ${assessment.location.state}, ${assessment.location.country}

------------------------------------------------------------------------
1. PROPERTY & ROOFTOP DETAILS
------------------------------------------------------------------------
Catchment Area: ${assessment.roof.area_m2} sq. meters
Roofing Material: ${assessment.roof.material}
Runoff Coefficient (C): ${assessment.calculation.runoff_coefficient}
Roof Condition: ${assessment.roof.condition}
Detected Obstacles: ${(assessment.detections?.obstacles_detected || []).join(', ') || 'None'}

------------------------------------------------------------------------
2. RAINWATER HARVESTING POTENTIAL
------------------------------------------------------------------------
Formula: V = Area (A) × Rainfall (R) × Coefficient (C)
Annual Rainfall: ${assessment.rainfall.annual_mm} mm
ESTIMATED ANNUAL HARVESTABLE WATER: ${assessment.calculation.harvestable_litres.toLocaleString()} LITRES

------------------------------------------------------------------------
3. READINESS SCORE: ${assessment.score.total} / 100 (${assessment.score.category})
------------------------------------------------------------------------
- Catchment Area Score: ${assessment.score.breakdown.roof_area.score} / 25
- Rainfall Potential Score: ${assessment.score.breakdown.rainfall.score} / 25
- Material Efficiency Score: ${assessment.score.breakdown.roof_material.score} / 20
- Structural Condition Score: ${assessment.score.breakdown.roof_condition.score} / 15
- Rooftop Clearance Score: ${assessment.score.breakdown.obstacles.score} / 15

------------------------------------------------------------------------
4. RECOMMENDED COMPONENTS & SIZING
------------------------------------------------------------------------
Recommended Storage Tank: ${assessment.recommendations.storage_tank_capacity_litres.toLocaleString()} Litres

Components Breakdown:
${(assessment.recommendations.components || []).map((c) => `• ${c.name} (${c.capacity}) - ₹${c.estimated_cost_inr.toLocaleString()}\n  ${c.description}`).join('\n')}

------------------------------------------------------------------------
5. FINANCIAL FEASIBILITY ESTIMATE
------------------------------------------------------------------------
Total Hardware Cost: ₹${assessment.recommendations.cost_estimation.hardware_cost.toLocaleString()}
Estimated Labour Cost: ₹${assessment.recommendations.cost_estimation.labour_cost.toLocaleString()}
TOTAL ESTIMATED INVESTMENT: ₹${assessment.recommendations.cost_estimation.total_estimated_cost_inr.toLocaleString()}
Estimated Annual Water Bill Savings: ₹${assessment.recommendations.cost_estimation.annual_savings_inr.toLocaleString()} / year
Estimated Payback Period: ${assessment.recommendations.cost_estimation.payback_period_years} Years

========================================================================
Generated by RainSense AI - Smart Rooftop Rainwater Harvesting System
========================================================================
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `RainSense_Report_${assessment.id.slice(0, 8)}.txt`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// ─── Health ───────────────────────────────────────────────
export const healthService = {
  check: () => api.get('/api/health'),
};

export default api;
