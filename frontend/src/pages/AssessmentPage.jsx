import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '../services/api';
import AnalysisProgress from '../components/AnalysisProgress';
import {
  Upload, Image as ImageIcon, X, MapPin, Home, Ruler, Layers,
  Building2, Droplets, ChevronRight, AlertTriangle, Sparkles
} from 'lucide-react';

const ROOF_MATERIALS = ['RCC / Concrete', 'Metal', 'Tile', 'Other'];
const ROOF_TYPES = ['Flat', 'Sloped', 'Unknown'];
const RWH_OPTIONS = ['Yes', 'No', 'Unknown'];

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: image, 2: location, 3: roof, 4: analyzing
  const [analysisStep, setAnalysisStep] = useState(0);

  // Form state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState({ city: 'Bangalore', state: 'Karnataka', country: 'India' });
  const [roof, setRoof] = useState({
    area_m2: '120',
    material: 'RCC / Concrete',
    roof_type: 'Flat',
    floors: 1,
    existing_rwh: 'Unknown',
  });

  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // ─── Image Handling ──────────────────────────────────
  const handleImageSelect = useCallback((file) => {
    setError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file format. Accepted: JPG, JPEG, PNG, WEBP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image exceeds maximum size of 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  const useSampleImage = () => {
    // Generate a clean sample SVG canvas rooftop
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    // Background roof
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 800, 500);
    
    // Roof boundary grid
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 720, 420);
    
    // Water tank
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(200, 150, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Water Tank', 165, 155);

    // Solar panels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(450, 100, 180, 120);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Solar Array', 500, 165);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sample_rooftop.png', { type: 'image/png' });
        handleImageSelect(file);
      }
    });
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ─── Submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    setStep(4);
    setAnalysisStep(0);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      formData.append('location_json', JSON.stringify({
        city: location.city.trim() || 'Bangalore',
        state: location.state.trim() || 'Karnataka',
        country: location.country.trim() || 'India',
      }));
      formData.append('roof_json', JSON.stringify({
        ...roof,
        area_m2: parseFloat(roof.area_m2) || 120,
        floors: parseInt(roof.floors) || 1,
      }));

      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setAnalysisStep((prev) => {
          if (prev < 5) return prev + 1;
          clearInterval(progressInterval);
          return prev;
        });
      }, 900);

      const res = await assessmentService.analyze(formData);
      clearInterval(progressInterval);
      setAnalysisStep(6);

      // Transition to results
      setTimeout(() => {
        const assessmentData = res.data;
        navigate(`/results/${assessmentData.id}`, { state: { assessment: assessmentData } });
      }, 600);
    } catch (err) {
      setStep(3);
      setError(err.response?.data?.detail || err.message || 'Analysis failed. Please try again.');
    }
  };

  // ─── Validation ──────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return true; // Image optional or sampled
    if (step === 2) return (location.city || '').trim().length > 0;
    if (step === 3) return parseFloat(roof.area_m2) > 0;
    return false;
  };

  // ─── Analyzing State ────────────────────────────────
  if (step === 4) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50/30 px-4">
        <AnalysisProgress currentStep={analysisStep} isComplete={analysisStep >= 6} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-gray-50 to-primary-50/30">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Rooftop Assessment</h1>
          <p className="text-gray-500 mt-2">Get an AI-assisted rainwater harvesting feasibility evaluation</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { num: 1, label: 'Image' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Roof Details' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                onClick={() => s.num < step && setStep(s.num)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s.num
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : step > s.num
                    ? 'bg-eco-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s.num}
              </button>
              <span className={`text-sm font-medium hidden sm:inline ${step === s.num ? 'text-primary-700' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Image Upload */}
        {step === 1 && (
          <div className="card p-8 animate-fade-in">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-1 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-600" />
              Rooftop Image
            </h2>
            <p className="text-sm text-gray-500 mb-6">Upload an aerial photo or select a sample image</p>

            {!imagePreview ? (
              <div>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                  onClick={() => document.getElementById('image-input').click()}
                >
                  <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold mb-1">
                    Drag & drop your rooftop image here
                  </p>
                  <p className="text-sm text-gray-400">or click to browse from device</p>
                  <p className="text-xs text-gray-400 mt-3">JPG, PNG, WEBP • Max 10MB</p>
                  <input
                    id="image-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => e.target.files[0] && handleImageSelect(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">Don't have an aerial photo handy?</span>
                  <button
                    type="button"
                    onClick={useSampleImage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    Use Sample Rooftop
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                <img src={imagePreview} alt="Rooftop preview" className="w-full max-h-96 object-contain" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => document.getElementById('image-replace').click()}
                    className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-sm font-medium text-gray-700 rounded-lg shadow hover:bg-white transition-all"
                  >
                    Replace
                  </button>
                  <button
                    onClick={removeImage}
                    className="p-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg shadow hover:bg-red-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  id="image-replace"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => e.target.files[0] && handleImageSelect(e.target.files[0])}
                  className="hidden"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg">
                  {imageFile?.name || 'Rooftop Image'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="card p-8 animate-fade-in">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Property Location
            </h2>
            <p className="text-sm text-gray-500 mb-6">Rainfall patterns and water estimation depend on your location</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={location.city}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                  placeholder="e.g. Bangalore, Chennai, Mumbai, Delhi"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={location.state}
                    onChange={(e) => setLocation({ ...location, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={location.country}
                    onChange={(e) => setLocation({ ...location, country: e.target.value })}
                    placeholder="India"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Preset quick cities */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Quick Select City:</p>
                <div className="flex flex-wrap gap-2">
                  {['Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setLocation({ ...location, city: c })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        location.city.toLowerCase() === c.toLowerCase()
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Roof Details */}
        {step === 3 && (
          <div className="card p-8 animate-fade-in">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Home className="w-5 h-5 text-primary-600" />
              Rooftop Details
            </h2>
            <p className="text-sm text-gray-500 mb-6">Specify roof size and characteristics</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roof Catchment Area (m²) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={roof.area_m2}
                    onChange={(e) => setRoof({ ...roof, area_m2: e.target.value })}
                    placeholder="e.g. 120"
                    className="input-field pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                    m²
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  120 m² ≈ 1,290 sq. ft (average residential house)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roof Material
                  </label>
                  <select
                    value={roof.material}
                    onChange={(e) => setRoof({ ...roof, material: e.target.value })}
                    className="input-field"
                  >
                    {ROOF_MATERIALS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roof Type
                  </label>
                  <select
                    value={roof.roof_type}
                    onChange={(e) => setRoof({ ...roof, roof_type: e.target.value })}
                    className="input-field"
                  >
                    {ROOF_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Floors
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={roof.floors}
                    onChange={(e) => setRoof({ ...roof, floors: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Existing RWH System?
                  </label>
                  <select
                    value={roof.existing_rwh}
                    onChange={(e) => setRoof({ ...roof, existing_rwh: e.target.value })}
                    className="input-field"
                  >
                    {RWH_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !imageFile) {
                  useSampleImage();
                }
                setStep(step + 1);
              }}
              className="btn-primary"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
            >
              <Droplets className="w-5 h-5" />
              Analyze Rooftop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
