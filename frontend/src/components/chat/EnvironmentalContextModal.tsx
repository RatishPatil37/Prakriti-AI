import React, { useState } from 'react';
import { X, Sprout, Mountain, Sliders, Check } from 'lucide-react';
import { EnvironmentalContextData } from '../../lib/sse';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: EnvironmentalContextData;
  onSave: (context: EnvironmentalContextData) => void;
}

export const EnvironmentalContextModal: React.FC<Props> = ({
  isOpen,
  onClose,
  context,
  onSave
}) => {
  const [formData, setFormData] = useState<EnvironmentalContextData>(context);

  if (!isOpen) return null;

  const handlePreset = (preset: 'semi_arid_wheat' | 'degraded_pasture') => {
    if (preset === 'semi_arid_wheat') {
      setFormData({
        region_or_coords: 'Western India / Semi-Arid Plateau',
        climate_zone: 'Semi-Arid',
        soil_organic_carbon_pct: 0.3,
        soil_ph: 7.8,
        annual_rainfall_mm: 350,
        current_land_use: 'Monoculture wheat with intensive tillage',
        crop_or_vegetation: 'Wheat (Triticum aestivum)',
        water_availability: 'Rainfed with seasonal deficit',
        target_goals: ['Restore soil carbon', 'Enhance pollinator diversity', 'Mitigate erosion']
      });
    } else if (preset === 'degraded_pasture') {
      setFormData({
        region_or_coords: 'Deccan Dry Zone',
        climate_zone: 'Sub-tropical Dry',
        soil_organic_carbon_pct: 0.45,
        soil_ph: 6.5,
        annual_rainfall_mm: 550,
        current_land_use: 'Continuous cattle grazing',
        crop_or_vegetation: 'Degraded native scrub & invasive weeds',
        water_availability: 'Ephemeral surface runoff',
        target_goals: ['Silvopasture integration', 'Deep root soil aggregation']
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#07130E] border border-emerald-500/25 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative">
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-500/15">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-[#A9EE70]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Structured Environmental Context
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Multi-metric site parameters injected into LLM reasoning prompt
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Presets */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-emerald-400 mb-2.5">
              Rapid Baseline Presets
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handlePreset('semi_arid_wheat')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-emerald-950/60 text-[#A9EE70] hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-[#A9EE70]/60 transition shadow-sm"
              >
                <Sprout className="w-4 h-4 text-[#A9EE70]" />
                Semi-Arid Wheat (0.3% SOC, 350mm)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('degraded_pasture')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700 hover:border-slate-500 transition shadow-sm"
              >
                <Mountain className="w-4 h-4 text-emerald-400" />
                Degraded Pasture Silvopasture
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Region or Coordinates</label>
              <input
                type="text"
                placeholder="e.g. Western India / Semi-Arid Plateau"
                value={formData.region_or_coords || ''}
                onChange={(e) => setFormData({ ...formData, region_or_coords: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#0B1A14] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#A9EE70] transition font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Climate Classification</label>
              <input
                type="text"
                placeholder="e.g. Semi-Arid, Mediterranean, Dry Tropics"
                value={formData.climate_zone || ''}
                onChange={(e) => setFormData({ ...formData, climate_zone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#0B1A14] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#A9EE70] transition font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Soil Organic Carbon (SOC %)</label>
              <input
                type="number"
                step="0.05"
                placeholder="0.3"
                value={formData.soil_organic_carbon_pct ?? ''}
                onChange={(e) => setFormData({ ...formData, soil_organic_carbon_pct: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#0B1A14] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#A9EE70] transition font-mono font-bold text-[#A9EE70]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Soil pH</label>
              <input
                type="number"
                step="0.1"
                placeholder="7.8"
                value={formData.soil_ph ?? ''}
                onChange={(e) => setFormData({ ...formData, soil_ph: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#0B1A14] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#A9EE70] transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Mean Annual Rainfall (mm)</label>
              <input
                type="number"
                placeholder="350"
                value={formData.annual_rainfall_mm ?? ''}
                onChange={(e) => setFormData({ ...formData, annual_rainfall_mm: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#0B1A14] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#A9EE70] transition font-mono font-bold text-[#A9EE70]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Water Availability Regime</label>
              <input
                type="text"
                placeholder="e.g. Rainfed with seasonal drought"
                value={formData.water_availability || ''}
                onChange={(e) => setFormData({ ...formData, water_availability: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#0B1A14] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#A9EE70] transition font-sans"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-300 mb-1.5">Current Land Use & Tillage</label>
              <input
                type="text"
                placeholder="e.g. Monoculture wheat with intensive conventional tillage"
                value={formData.current_land_use || ''}
                onChange={(e) => setFormData({ ...formData, current_land_use: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[#0B1A14] border border-emerald-500/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-[#A9EE70] transition font-sans"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-emerald-500/15 bg-[#040D09]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-[#10B981] hover:from-emerald-500 hover:to-[#A9EE70] text-white rounded-xl shadow-[0_0_20px_rgba(0,146,69,0.4)] transition font-mono"
          >
            <Check className="w-4 h-4" />
            Apply Site Parameters
          </button>
        </div>
      </div>
    </div>
  );
};
