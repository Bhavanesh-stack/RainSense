import { Link } from 'react-router-dom';
import { 
  Droplets, CloudRain, BarChart3, Brain, Upload, MapPin, 
  Cpu, Cloud, Calculator, Award, Lightbulb, ArrowRight,
  CheckCircle2, Shield, Leaf, TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-primary-900 to-rain-900" />
        
        {/* Rain effect overlay */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                height: `${15 + Math.random() * 25}px`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-rain-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-primary-200 mb-8">
              <Brain className="w-4 h-4" />
              AI-Powered Water Conservation
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white leading-tight">
              Turn Your Rooftop Into a{' '}
              <span className="text-gradient bg-gradient-to-r from-primary-300 via-cyan-300 to-eco-300 bg-clip-text text-transparent">
                Water Resource
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-primary-100/80 max-w-2xl mx-auto leading-relaxed">
              AI-powered rooftop analysis and rainwater harvesting recommendations 
              for smarter and more sustainable water management.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/assessment" className="btn-primary !py-4 !px-8 !text-base !rounded-2xl group">
                Analyze My Rooftop
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white/90 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all">
                Learn How It Works
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Brain className="w-6 h-6" />, label: 'AI Rooftop Analysis', desc: 'Computer vision' },
                { icon: <CloudRain className="w-6 h-6" />, label: 'Rainfall Intelligence', desc: 'Location-based data' },
                { icon: <Calculator className="w-6 h-6" />, label: 'Water Harvest Estimation', desc: 'Scientific formulas' },
                { icon: <Lightbulb className="w-6 h-6" />, label: 'Smart Recommendations', desc: 'Tailored solutions' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
                  <div className="text-primary-300 mb-2">{stat.icon}</div>
                  <p className="text-sm font-semibold text-white">{stat.label}</p>
                  <p className="text-xs text-primary-200/60 mt-0.5">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle mx-auto">
              From rooftop image to actionable recommendations in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, icon: <Upload className="w-7 h-7" />, title: 'Upload Rooftop Image', desc: 'Take a photo or upload an aerial view of your rooftop', color: 'from-primary-500 to-primary-600' },
              { step: 2, icon: <MapPin className="w-7 h-7" />, title: 'Enter Location & Details', desc: 'Provide your city, roof area, material, and type', color: 'from-rain-500 to-rain-600' },
              { step: 3, icon: <Cpu className="w-7 h-7" />, title: 'AI Analyzes Rooftop', desc: 'Our AI detects roof features and potential obstacles', color: 'from-violet-500 to-violet-600' },
              { step: 4, icon: <Cloud className="w-7 h-7" />, title: 'Rainfall Data Retrieved', desc: 'Location-specific rainfall patterns are fetched', color: 'from-sky-500 to-sky-600' },
              { step: 5, icon: <Calculator className="w-7 h-7" />, title: 'Water Potential Calculated', desc: 'Annual harvestable rainwater is computed using V = A × R × C', color: 'from-eco-500 to-eco-600' },
              { step: 6, icon: <Award className="w-7 h-7" />, title: 'Readiness Score Generated', desc: 'A transparent 0–100 score with full breakdown', color: 'from-amber-500 to-amber-600' },
              { step: 7, icon: <Lightbulb className="w-7 h-7" />, title: 'Recommendations Provided', desc: 'Storage, components, cost estimates, and payback period', color: 'from-rose-500 to-rose-600' },
            ].map((item) => (
              <div key={item.step} className="card p-6 group hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg mb-4`}>
                  {item.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                    {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Features</h2>
            <p className="section-subtitle mx-auto">
              Everything you need for a comprehensive rainwater harvesting assessment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Brain />, title: 'YOLOv8 AI Detection', desc: 'Advanced object detection identifies roof features, solar panels, tanks, and obstacles using computer vision.' },
              { icon: <CloudRain />, title: 'Rainfall Intelligence', desc: 'Location-aware rainfall data with monthly breakdowns and historical averages for accurate estimation.' },
              { icon: <BarChart3 />, title: 'Interactive Charts', desc: 'Monthly rainfall, water collection potential, and score breakdown visualized with beautiful charts.' },
              { icon: <Shield />, title: 'Transparent Scoring', desc: 'See exactly how your 0–100 readiness score was calculated — no black box AI.' },
              { icon: <Leaf />, title: 'Sustainability Focus', desc: 'Environmental impact tracking with estimated annual water savings and conservation metrics.' },
              { icon: <TrendingUp />, title: 'Financial Analysis', desc: 'Cost estimation, annual savings calculation, and payback period to make informed decisions.' },
            ].map((feature, i) => (
              <div key={i} className="card p-8 group hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-800 to-rain-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-eco-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Harvest Rain?
          </h2>
          <p className="text-primary-100/80 text-lg mb-8">
            Start your free assessment today and discover your rooftop's water harvesting potential.
          </p>
          <Link to="/register" className="btn-primary !py-4 !px-10 !text-lg !rounded-2xl !bg-white !text-primary-700 hover:!bg-gray-100 !shadow-xl">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
