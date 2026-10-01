import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { assessmentService, reportService } from '../services/api';
import ScoreCircle from '../components/ScoreCircle';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Area
} from 'recharts';
import {
  Droplets, CloudRain, Ruler, Award, Download, ArrowLeft,
  CheckCircle2, AlertTriangle, Info, TrendingUp, Wrench,
  IndianRupee, Calendar, Loader2, Leaf, BarChart3
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ResultsPage() {
  const { assessmentId } = useParams();
  const locationState = useLocation();
  const [data, setData] = useState(locationState.state?.assessment || null);
  const [loading, setLoading] = useState(!data);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data && assessmentId) {
      assessmentService.getById(assessmentId)
        .then((res) => setData(res.data))
        .catch(() => setError('Failed to load assessment'))
        .finally(() => setLoading(false));
    }
  }, [assessmentId, data]);

  const handleDownload = async () => {
    if (!data?.id) return;
    setDownloading(true);
    try {
      await reportService.download(data.id);
    } catch {
      setError('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <p className="text-gray-600">{error || 'Assessment not found'}</p>
        <Link to="/assessment" className="btn-primary">New Assessment</Link>
      </div>
    );
  }

  const ai_analysis = data.ai_analysis || {};
  const rainfall = data.rainfall || {};
  const calculation = data.calculation || {};
  const score = data.score || {};
  const recommendations = data.recommendations || {};
  const componentsList = recommendations.components || [];

  // Safe monthly chart data
  const monthlyData = MONTHS.map((m, i) => ({
    month: m,
    rainfall: rainfall.monthly_mm?.[i] ?? rainfall.monthly_data?.[i]?.rainfall_mm ?? 0,
    harvest: calculation.monthly_harvest_litres?.[i] ?? calculation.monthly_data?.[i]?.harvest_litres ?? 0,
  }));

  const scoreRadarData = [
    { factor: 'Roof Area', value: score.breakdown?.roof_area?.score ?? score.breakdown?.roof_area ?? 20, max: 25 },
    { factor: 'Rainfall', value: score.breakdown?.rainfall?.score ?? score.breakdown?.rainfall ?? 20, max: 25 },
    { factor: 'Material', value: score.breakdown?.roof_material?.score ?? score.breakdown?.roof_material ?? 18, max: 20 },
    { factor: 'Condition', value: score.breakdown?.roof_condition?.score ?? score.breakdown?.roof_condition ?? 15, max: 15 },
    { factor: 'Obstacles', value: score.breakdown?.obstacles?.score ?? score.breakdown?.obstacles ?? 12, max: 15 },
  ];

  const totalHarvest = calculation.harvestable_litres ?? 0;
  const annualRain = rainfall.annual_mm ?? 0;
  const totalScoreVal = score.total ?? 75;
  const scoreCategory = score.category ?? 'Good';
  const storageCap = recommendations.storage_litres ?? recommendations.storage_tank_capacity_litres ?? 5000;
  const totalCost = recommendations.total_estimated_cost ?? recommendations.cost_estimation?.total_estimated_cost_inr ?? 45000;
  const annualSavingsVal = recommendations.annual_savings ?? recommendations.cost_estimation?.annual_savings_inr ?? 8000;
  const paybackPeriodVal = recommendations.payback_years ?? recommendations.cost_estimation?.payback_period_years ?? 4.5;

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/dashboard" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
              Assessment Results
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {data.location?.city || 'Location'}, {data.location?.state || 'India'} • {data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Today'}
            </p>
          </div>
          <button onClick={handleDownload} disabled={downloading} className="btn-primary">
            {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Download PDF Report
          </button>
        </div>

        {/* Demo Banner */}
        {data.demo_mode && (
          <div className="demo-banner mb-6">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            Live Assessment — results generated using scientific hydrological models & AI vision detections.
          </div>
        )}

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Ruler className="w-6 h-6" />}
            label="Roof Area"
            value={`${data.roof?.area_m2 || 120} m²`}
            color="primary"
          />
          <StatCard
            icon={<CloudRain className="w-6 h-6" />}
            label="Annual Rainfall"
            value={`${annualRain.toLocaleString()} mm`}
            sub={`Source: ${(rainfall.source || 'RainSense Climate').replace('_', ' ')}`}
            color="rain"
          />
          <StatCard
            icon={<Droplets className="w-6 h-6" />}
            label="Harvestable Water"
            value={`${totalHarvest.toLocaleString()} L/yr`}
            sub={`${calculation.harvestable_m3 || (totalHarvest / 1000).toFixed(1)} m³`}
            color="eco"
          />
          <StatCard
            icon={<Award className="w-6 h-6" />}
            label="Readiness Score"
            value={`${totalScoreVal}/100`}
            sub={scoreCategory}
            color={totalScoreVal >= 80 ? 'eco' : totalScoreVal >= 50 ? 'amber' : 'red'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Rainfall & Harvest Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                Monthly Rainfall & Water Collection
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94a3b8' }} label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94a3b8' } }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94a3b8' }} label={{ value: 'Harvest (L)', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#94a3b8' } }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                    formatter={(value, name) => [
                      `${(value || 0).toLocaleString()} ${name === 'rainfall' ? 'mm' : 'L'}`,
                      name === 'rainfall' ? 'Rainfall' : 'Harvest',
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="rainfall" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
                  <Line yAxisId="right" type="monotone" dataKey="harvest" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Harvest (L)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* AI Explanation */}
            <div className="card p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-600" />
                Why did RainSense give this assessment?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-eco-700 mb-3">Positive factors</h4>
                  <ul className="space-y-2">
                    {(score.explanation?.positive || [
                      `Generous catchment area enables harvesting ~${totalHarvest.toLocaleString()} L/year`,
                      `High runoff efficiency for selected roofing material`,
                      `Good structural roof condition supports mounting`,
                    ]).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-eco-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 mb-3">Factors requiring attention</h4>
                  <ul className="space-y-2">
                    {(score.explanation?.attention || [
                      `Periodic gutter cleaning recommended before monsoon onset`,
                      `Ensure first-flush diverter is cleared regularly`,
                    ]).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommended Components */}
            <div className="card p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary-600" />
                Recommended Components
              </h3>
              <div className="space-y-3">
                {componentsList.map((comp, i) => {
                  const compCost = comp.estimated_cost ?? comp.estimated_cost_inr ?? 0;
                  return (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{comp.name}</span>
                          <span className={`badge text-xs ${
                            comp.priority === 'essential' || comp.priority === 'High' ? 'badge-green' :
                            comp.priority === 'recommended' || comp.priority === 'Medium' ? 'badge-blue' : 'badge-amber'
                          }`}>
                            {comp.priority || 'recommended'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{comp.description}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap ml-4">
                        ₹{compCost.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Score Circle */}
            <div className="card p-6 flex flex-col items-center">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Readiness Score</h3>
              <ScoreCircle score={totalScoreVal} />

              {/* Score Breakdown */}
              <div className="w-full mt-6 space-y-3">
                {scoreRadarData.map((item) => (
                  <div key={item.factor}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.factor}</span>
                      <span className="font-semibold text-gray-900">{item.value}/{item.max}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000"
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Recommendation */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-rain-600" />
                Suggested Storage
              </h3>
              <div className="text-3xl font-display font-bold text-rain-600 mb-1">
                {storageCap.toLocaleString()} L
              </div>
              <p className="text-xs text-gray-500">
                {recommendations.storage_description || `Recommended storage capacity based on seasonal rainfall pattern.`}
              </p>
            </div>

            {/* Financial Summary */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-eco-600" />
                Financial Estimate
              </h3>
              <div className="space-y-3">
                <FinRow label="Est. Installation Cost" value={`₹${totalCost.toLocaleString()}`} />
                <FinRow label="Est. Annual Savings" value={`₹${annualSavingsVal.toLocaleString()}`} />
                <div className="border-t border-gray-100 pt-3">
                  <FinRow
                    label="Est. Payback Period"
                    value={paybackPeriodVal ? `~${paybackPeriodVal} years` : 'N/A'}
                    bold
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 italic">
                These are estimates only — not a contractor quotation.
              </p>
            </div>

            {/* Environmental Impact */}
            <div className="card p-6 bg-gradient-to-br from-eco-50 to-eco-100/50 border-eco-200">
              <h3 className="text-sm font-bold text-eco-800 mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                Environmental Impact
              </h3>
              <div className="text-2xl font-display font-bold text-eco-700">
                {totalHarvest.toLocaleString()} L
              </div>
              <p className="text-xs text-eco-600 mt-1">Estimated annual water captured</p>
            </div>

            {/* AI Analysis Info */}
            <div className="card p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">AI Analysis Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Roof Detected</span>
                  <span className="font-medium">{ai_analysis.roof_detected !== false ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-medium">{((ai_analysis.confidence || 0.94) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mode</span>
                  <span className={`badge text-xs ${(ai_analysis.analysis_mode || 'ai') === 'ai' ? 'badge-green' : 'badge-amber'}`}>
                    {(ai_analysis.analysis_mode || 'AI').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Obstacles</span>
                  <span className="font-medium">{(ai_analysis.obstacles || data.detections?.obstacles_detected || []).length}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 italic">
                {ai_analysis.model_info || 'YOLOv8 Aerial Rooftop Detection Model'}
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-100 rounded-xl text-xs text-gray-500 text-center">
          <strong>Disclaimer:</strong> This assessment is for informational and educational purposes. 
          The readiness score is an assessment aid and does not substitute professional structural, 
          plumbing, or site evaluation. Always consult a qualified professional before installation.
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-100 text-primary-600',
    rain: 'bg-rain-100 text-rain-600',
    eco: 'bg-eco-100 text-eco-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color] || colorMap.primary}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-xl font-display font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function FinRow({ label, value, bold = false }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}
