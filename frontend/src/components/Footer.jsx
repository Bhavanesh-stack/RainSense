import { Droplets } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-rain-500 rounded-lg flex items-center justify-center">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">
                RainSense AI
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              AI-powered rooftop analysis and rainwater harvesting recommendations 
              for smarter, more sustainable water management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-primary-400 transition-colors">Home</a></li>
              <li><a href="/#how-it-works" className="hover:text-primary-400 transition-colors">How It Works</a></li>
              <li><a href="/#features" className="hover:text-primary-400 transition-colors">Features</a></li>
              <li><a href="/dashboard" className="hover:text-primary-400 transition-colors">Dashboard</a></li>
            </ul>
          </div>

          {/* Project */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              About This Project
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              RainSense AI is an academic project demonstrating AI-assisted 
              rainwater harvesting assessment. It is not a substitute for 
              professional site evaluation.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} RainSense AI. Academic Project.
          </p>
          <p className="text-xs text-gray-500">
            Built with React, FastAPI, YOLOv8 & MongoDB
          </p>
        </div>
      </div>
    </footer>
  );
}
