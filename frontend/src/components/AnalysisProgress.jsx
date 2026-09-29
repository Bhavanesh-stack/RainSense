import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const STEPS = [
  'Image uploaded',
  'Image preprocessing',
  'Rooftop analysis',
  'Retrieving rainfall data',
  'Calculating water potential',
  'Generating recommendations',
];

export default function AnalysisProgress({ currentStep = 0, isComplete = false }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <h3 className="text-lg font-display font-bold text-gray-900">
          Analyzing your rooftop...
        </h3>
        <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
      </div>

      <div className="space-y-1">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStep || isComplete;
          const isCurrent = idx === currentStep && !isComplete;
          const isPending = idx > currentStep && !isComplete;

          return (
            <div key={idx} className={`progress-step ${isDone ? 'text-eco-600' : isCurrent ? 'text-primary-600' : 'text-gray-300'}`}>
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-eco-500 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${isDone ? 'text-eco-700' : isCurrent ? 'text-primary-700' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
