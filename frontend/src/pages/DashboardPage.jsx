import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { assessmentService, reportService } from '../services/api';
import {
  LayoutDashboard, Plus, FileText, Droplets, Award, TrendingUp,
  Download, Trash2, Eye, Loader2, CloudOff, BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await assessmentService.getDashboard();
      setStats(res.data);
    } catch {
      setStats({ total_assessments: 0, average_score: 0, total_water_potential: 0, recent_assessments: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await assessmentService.delete(id);
      loadDashboard();
    } catch {
      alert('Failed to delete assessment');
    }
  };

  const handleDownload = async (id) => {
    try {
      await reportService.download(id);
    } catch {
      alert('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
              Welcome, {user?.name || 'User'} 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's an overview of your rainwater assessments</p>
          </div>
          <Link to="/assessment" className="btn-primary">
            <Plus className="w-5 h-5" />
            New Assessment
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashStatCard
            icon={<FileText className="w-6 h-6" />}
            label="Total Assessments"
            value={stats?.total_assessments || 0}
            color="primary"
          />
          <DashStatCard
            icon={<Award className="w-6 h-6" />}
            label="Average Score"
            value={stats?.average_score ? `${stats.average_score}/100` : '—'}
            color="amber"
          />
          <DashStatCard
            icon={<Droplets className="w-6 h-6" />}
            label="Total Water Potential"
            value={stats?.total_water_potential ? `${(stats.total_water_potential / 1000).toFixed(1)}k L` : '0 L'}
            color="rain"
          />
          <DashStatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Latest Score"
            value={stats?.latest_assessment ? `${stats.latest_assessment.score_total}/100` : '—'}
            color="eco"
          />
        </div>

        {/* Recent Assessments */}
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Recent Assessments
            </h2>
          </div>

          {stats?.recent_assessments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Location</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Roof Area</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Harvestable</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Score</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recent_assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {a.location.city}{a.location.state ? `, ${a.location.state}` : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {a.roof_area_m2} m²
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {a.harvestable_litres.toLocaleString()} L
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">{a.score_total}</span>
                        <span className="text-xs text-gray-400">/100</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge text-xs ${
                          a.score_category === 'Highly Suitable' ? 'badge-green' :
                          a.score_category === 'Moderately Suitable' ? 'badge-amber' : 'badge-red'
                        }`}>
                          {a.score_category}
                        </span>
                        {a.demo_mode && <span className="badge badge-amber text-xs ml-1">Demo</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/results/${a.id}`}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDownload(a.id)}
                            className="p-2 text-gray-400 hover:text-eco-600 hover:bg-eco-50 rounded-lg transition-all"
                            title="Download Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CloudOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No assessments yet</h3>
              <p className="text-gray-400 mb-6">Start by analyzing your first rooftop</p>
              <Link to="/assessment" className="btn-primary">
                <Plus className="w-5 h-5" />
                New Assessment
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashStatCard({ icon, label, value, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-100 text-primary-600',
    rain: 'bg-rain-100 text-rain-600',
    eco: 'bg-eco-100 text-eco-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-display font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
