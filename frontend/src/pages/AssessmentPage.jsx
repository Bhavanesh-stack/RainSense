import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '../services/api';
import AnalysisProgress from '../components/AnalysisProgress';
import {
  Upload, Image as ImageIcon, X, MapPin, Home, Ruler, Layers,
  Building2, Droplets, ChevronRight, AlertTriangle, Loader2
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
  const [location, setLocation] = useState({ city: '', state: '', country: 'India' });
  const [roof, setRoof] = useState({
    area_m2: '',
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
      formData.append('image', imageFile);
      formData.append('location_json', JSON.stringify(location));
      formData.append('roof_json', JSON.stringify({
        ...roof,
        area_m2: parseFloat(roof.area_m2),
        floors: parseInt(roof.floors),
      }));

      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setAnalysisStep((prev) => {
          if (prev < 5) return prev + 1;
          clearInterval(progressInterval);
          return prev;
        });
      }, 1500);

      const res = await assessmentService.analyze(formData);
      clearInterval(progressInterval);
      setAnalysisStep(6);

      // Brief delay to show completion
      setTimeout(() => {
        navigate(`/results/${res.data.id}`, { state: { assessment: res.data } });
      }, 800);
    } catch (err) {
      setStep(3);
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    }
  };

  // ─── Validation ──────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return !!imageFile;
    if (step === 2) return location.city.trim().length > 0;
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
          <h1 className="text-3xl font-display font-bold text-gray-900">New Assessment</h1>
          <p className="text-gray-500 mt-2">Complete the steps below to analyze your rooftop</p>
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
            <p className="text-sm text-gray-500 mb-6">Upload an aerial or top-down view of your rooftop</p>

            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                }`}
                onClick={() => document.getElementById('image-input').click()}
              >
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-1">
                  Drag & drop your rooftop image here
                </p>
                <p className="text-sm text-gray-400">or click to browse</p>
                <p className="text-xs text-gray-300 mt-3">JPG, JPEG, PNG, WEBP • Max 10MB</p>
                <input
                  id="image-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => e.target.files[0] && handleImageSelect(e.target.files[0])}
                  className="hidden"
                />
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
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-lg">
                  {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(1)} MB)
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
              Location
            </h2>
            <p className="text-sm text-gray-500 mb-6">Where is the rooftop located?</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="city" className="label">City *</label>
                <input
                  id="city"
                  type="text"
                  value={location.city}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Chennai"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="label">State</label>
                  <input
                    id="state"
                    type="text"
                    value={location.state}
                    onChange={(e) => setLocation({ ...location, state: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Tamil Nadu"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="label">Country</label>
                  <input
                    id="country"
                    type="text"
                    value={location.country}
                    onChange={(e) => setLocation({ ...location, country: e.target.value })}
                    className="input-field"
                    placeholder="e.g. India"
                  />
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
              Rooftop Information
            </h2>
            <p className="text-sm text-gray-500 mb-6">Tell us about your roof</p>

            <div className="space-y-5">
              <div>
                <label htmlFor="area" className="label flex items-center gap-1">
                  <Ruler className="w-4 h-4" /> Roof Area (m²) *
                </label>
                <input
                  id="area"
                  type="number"
                  value={roof.area_m2}
                  onChange={(e) => setRoof({ ...roof, area_m2: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 92"
                  min="1"
                  max="100000"
                  step="0.1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="material" className="label flex items-center gap-1">
                    <Layers className="w-4 h-4" /> Roof Material
                  </label>
                  <select
                    id="material"
                    value={roof.material}
                    onChange={(e) => setRoof({ ...roof, material: e.target.value })}
                    className="select-field"
                  >
                    {ROOF_MATERIALS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="type" className="label">Roof Type</label>
                  <select
                    id="type"
                    value={roof.roof_type}
                    onChange={(e) => setRoof({ ...roof, roof_type: e.target.value })}
                    className="select-field"
                  >
                    {ROOF_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="floors" className="label flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> Number of Floors
                  </label>
                  <input
                    id="floors"
                    type="number"
                    value={roof.floors}
                    onChange={(e) => setRoof({ ...roof, floors: e.target.value })}
                    className="input-field"
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label htmlFor="rwh" className="label flex items-center gap-1">
                    <Droplets className="w-4 h-4" /> Existing RWH System?
                  </label>
                  <select
                    id="rwh"
                    value={roof.existing_rwh}
                    onChange={(e) => setRoof({ ...roof, existing_rwh: e.target.value })}
                    className="select-field"
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
        {step < 4 && (
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="btn-secondary">
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="btn-primary !bg-gradient-to-r !from-eco-500 !to-eco-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Droplets className="w-5 h-5" />
                Analyze Rooftop
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
