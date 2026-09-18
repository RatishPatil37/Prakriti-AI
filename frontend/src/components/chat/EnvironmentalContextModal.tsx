import React, { useState } from 'react';
import { X, Sprout, Mountain } from 'lucide-react';
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

  const handlePreset = (preset: 'semi_arid_wheat' | 'degraded_pasture' | 'wetland') => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-evergreen-900/40 backdrop-blur-sm p-4">
      <div className="bg-botanical-50 border border-earth-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-earth-border">
          <div>
            <h2 className="text-xl font-serif font-semibold text-evergreen">Structured Environmental Context</h2>
            <p className="text-xs text-evergreen/60 mt-0.5">Ground reasoning in site-specific soil, climate, and land-use metrics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-earth-100 rounded-lg text-evergreen/60 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-evergreen/60 mb-2">
              Quick Benchmarks & Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePreset('semi_arid_wheat')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-forest-600/10 text-forest-600 hover:bg-forest-600/20 border border-forest-600/20 transition"
              >
                <Sprout className="w-3.5 h-3.5" />
                Semi-Arid Monoculture Wheat (Assignment Baseline)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('degraded_pasture')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-earth-200/50 text-evergreen hover:bg-earth-200 border border-earth-border transition"
              >
                <Mountain className="w-3.5 h-3.5" />
                Degraded Pasture Silvopasture
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-evergreen mb-1">Region or Coordinates</label>
              <input
                type="text"
                placeholder="e.g. 23.0225° N, 72.5714° E or Western India"
                value={formData.region_or_coords || ''}
                onChange={(e) => setFormData({ ...formData, region_or_coords: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-earth-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-evergreen mb-1">Climate Classification</label>
              <input
                type="text"
                placeholder="e.g. Semi-arid, Mediterranean, Humid tropical"
                value={formData.climate_zone || ''}
                onChange={(e) => setFormData({ ...formData, climate_zone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-earth-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-evergreen mb-1">Soil Organic Carbon (SOC %)</label>
              <input
                type="number"
                step="0.05"
                placeholder="e.g. 0.3"
                value={formData.soil_organic_carbon_pct ?? ''}
                onChange={(e) => setFormData({ ...formData, soil_organic_carbon_pct: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 text-sm bg-white border border-earth-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-evergreen mb-1">Soil pH</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 7.2"
                value={formData.soil_ph ?? ''}
                onChange={(e) => setFormData({ ...formData, soil_ph: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 text-sm bg-white border border-earth-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-evergreen mb-1">Mean Annual Rainfall (mm)</label>
              <input
                type="number"
                placeholder="e.g. 350"
                value={formData.annual_rainfall_mm ?? ''}
                onChange={(e) => setFormData({ ...formData, annual_rainfall_mm: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 text-sm bg-white border border-earth-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-evergreen mb-1">Water Availability Regime</label>
              <input
                type="text"
                placeholder="e.g. Rainfed, Drip irrigated, Canal"
                value={formData.water_availability || ''}
                onChange={(e) => setFormData({ ...formData, water_availability: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-earth-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-evergreen mb-1">Current Land Use & Tillage</label>
              <input
                type="text"
                placeholder="e.g. Monoculture wheat with continuous conventional moldboard tillage"
                value={formData.current_land_use || ''}
                onChange={(e) => setFormData({ ...formData, current_land_use: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-earth-border rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-earth-border bg-botanical-100 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-evergreen/70 hover:text-evergreen transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="px-5 py-2 text-sm font-medium bg-forest-600 hover:bg-forest-500 text-white rounded-lg shadow-sm transition"
          >
            Save Environmental Context
          </button>
        </div>
      </div>
    </div>
  );
};
