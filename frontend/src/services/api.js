import axios from 'axios';
import {
  processClientAssessment,
  getAssessmentsFromLocalStorage,
  getAssessmentById,
  deleteAssessmentFromLocalStorage,
  getClientDashboardStats,
} from './clientAssessment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rainsense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to check if error is connection/offline
function isNetworkOrOfflineError(error) {
  return (
    !error.response ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('Network Error') ||
    error.message?.includes('Failed to fetch') ||
    error.response?.status === 404 ||
    error.response?.status === 502 ||
    error.response?.status === 503
  );
}

// ─── Assessments Service with Automatic Vercel/Client Fallback ───────
export const assessmentService = {
  analyze: async (formData) => {
    // If no external backend URL is configured or when deployed frontend-only
    if (!API_BASE_URL || API_BASE_URL === 'http://localhost:8000') {
      try {
        const res = await api.post('/api/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 8000,
        });
        return res;
      } catch (err) {
        if (isNetworkOrOfflineError(err)) {
          console.info('RainSense: Backend offline/unreachable on Vercel. Running client-side assessment engine.');
          // Parse formData
          const location = JSON.parse(formData.get('location_json') || '{}');
          const roof = JSON.parse(formData.get('roof_json') || '{}');
          const image = formData.get('image');
          const result = processClientAssessment(location, roof, image);
          return { data: result, status: 200 };
        }
        throw err;
      }
    }

    try {
      return await api.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
    } catch (err) {
      if (isNetworkOrOfflineError(err)) {
        console.info('RainSense: Falling back to client-side calculation.');
        const location = JSON.parse(formData.get('location_json') || '{}');
        const roof = JSON.parse(formData.get('roof_json') || '{}');
        const image = formData.get('image');
        const result = processClientAssessment(location, roof, image);
        return { data: result, status: 200 };
      }
      throw err;
    }
  },

  getAll: async () => {
    try {
      return await api.get('/api/assessments');
    } catch (err) {
      const list = getAssessmentsFromLocalStorage();
      return { data: list, status: 200 };
    }
  },

  getById: async (id) => {
    try {
      return await api.get(`/api/assessments/${id}`);
    } catch (err) {
      const item = getAssessmentById(id);
      if (item) {
        return { data: item, status: 200 };
      }
      throw err;
    }
  },

  delete: async (id) => {
    try {
      return await api.delete(`/api/assessments/${id}`);
    } catch (err) {
      deleteAssessmentFromLocalStorage(id);
      return { data: { success: true }, status: 200 };
    }
  },

  getDashboard: async () => {
    try {
      return await api.get('/api/dashboard');
    } catch (err) {
      const stats = getClientDashboardStats();
      return { data: stats, status: 200 };
    }
  },
};

// ─── Reports Service ──────────────────────────────────────────────
export const reportService = {
  download: async (assessmentId) => {
    try {
      const response = await api.get(`/api/reports/${assessmentId}`, {
        responseType: 'blob',
        timeout: 10000,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RainSense_Report_${assessmentId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Client-side report export fallback
      const assessment = getAssessmentById(assessmentId);
      if (assessment) {
        generateClientReport(assessment);
      } else {
        throw new Error('Assessment report could not be generated.');
      }
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
Detected Obstacles: ${assessment.detections.obstacles_detected.join(', ') || 'None'}

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
${assessment.recommendations.components.map((c) => `• ${c.name} (${c.capacity}) - ₹${c.estimated_cost_inr.toLocaleString()}\n  ${c.description}`).join('\n')}

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
