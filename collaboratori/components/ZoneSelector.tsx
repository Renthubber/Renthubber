// ============================================================
// RENTHUBBER - MODULO COLLABORATORI - Zone Selector
// Path: collaboratori/components/ZoneSelector.tsx
// ============================================================

import React, { useState } from 'react';
import { MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { ZoneRequest } from '../types/collaborator.types';
import { ITALY_DATA } from '../data/italyData';

// ============================================================
// COMPONENT
// ============================================================

interface ZoneSelectorProps {
  selectedZones: ZoneRequest[];
  onChange: (zones: ZoneRequest[]) => void;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({ selectedZones, onChange }) => {
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);

  const regions = Object.keys(ITALY_DATA).sort();

  const addRegion = (region: string) => {
    if (selectedZones.some(z => z.zone_level === 'regione' && z.region === region)) return;
    const filtered = selectedZones.filter(z => z.region !== region);
    onChange([...filtered, { zone_level: 'regione', region }]);
  };

  const addProvince = (region: string, province: string) => {
    if (selectedZones.some(z => z.zone_level === 'regione' && z.region === region)) return;
    if (selectedZones.some(z => z.zone_level === 'provincia' && z.region === region && z.province === province)) return;
    const filtered = selectedZones.filter(z => !(z.region === region && z.province === province));
    onChange([...filtered, { zone_level: 'provincia', region, province }]);
  };

  const addCity = (region: string, province: string, city: string) => {
    if (selectedZones.some(z => z.zone_level === 'regione' && z.region === region)) return;
    if (selectedZones.some(z => z.zone_level === 'provincia' && z.region === region && z.province === province)) return;
    if (selectedZones.some(z => z.city === city && z.province === province)) return;
    onChange([...selectedZones, { zone_level: 'citta', region, province, city }]);
  };

  const isRegionSelected = (region: string) =>
    selectedZones.some(z => z.zone_level === 'regione' && z.region === region);

  const isProvinceSelected = (region: string, province: string) =>
    isRegionSelected(region) ||
    selectedZones.some(z => z.zone_level === 'provincia' && z.region === region && z.province === province);

  const isCitySelected = (region: string, province: string, city: string) =>
    isRegionSelected(region) ||
    isProvinceSelected(region, province) ||
    selectedZones.some(z => z.city === city && z.province === province);

  return (
    <div className="bg-white rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
      {regions.map(region => {
        const provinces = Object.keys(ITALY_DATA[region]).sort();
        const isExpanded = expandedRegion === region;
        const isSelected = isRegionSelected(region);

        return (
          <div key={region} className="border-b border-gray-100 last:border-0">
            <div className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors">
              <button
                onClick={() => setExpandedRegion(isExpanded ? null : region)}
                className="flex-1 flex items-center text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                )}
                <MapPin className="w-4 h-4 text-brand mr-2" />
                <span className={`font-medium text-sm ${isSelected ? 'text-brand' : 'text-gray-800'}`}>
                  {region}
                </span>
              </button>
              <button
                onClick={() => addRegion(region)}
                disabled={isSelected}
                className={`text-xs px-3 py-1 rounded-full transition-all ${
                  isSelected
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-brand/10 text-brand hover:bg-brand/20'
                }`}
              >
                {isSelected ? '✓ Tutta la regione' : '+ Tutta la regione'}
              </button>
            </div>

            {isExpanded && (
              <div className="pl-6 bg-gray-50/50">
                {provinces.map(province => {
                  const cities = ITALY_DATA[region][province];
                  const isProvExpanded = expandedProvince === `${region}-${province}`;
                  const isProvSelected = isProvinceSelected(region, province);

                  return (
                    <div key={province}>
                      <div className="flex items-center px-4 py-2 hover:bg-gray-100/50 transition-colors">
                        <button
                          onClick={() => setExpandedProvince(isProvExpanded ? null : `${region}-${province}`)}
                          className="flex-1 flex items-center text-left"
                        >
                          {isProvExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-400 mr-2" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400 mr-2" />
                          )}
                          <span className={`text-sm ${isProvSelected ? 'text-brand font-medium' : 'text-gray-700'}`}>
                            {province}
                          </span>
                        </button>
                        <button
                          onClick={() => addProvince(region, province)}
                          disabled={isProvSelected}
                          className={`text-xs px-2 py-0.5 rounded-full transition-all ${
                            isProvSelected
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-gray-200 text-gray-600 hover:bg-brand/10 hover:text-brand'
                          }`}
                        >
                          {isProvSelected ? '✓' : '+ Provincia'}
                        </button>
                      </div>

                      {isProvExpanded && (
                        <div className="pl-8 pb-2">
                          {cities.map(city => {
                            const isCitySel = isCitySelected(region, province, city);
                            return (
                              <button
                                key={city}
                                onClick={() => addCity(region, province, city)}
                                disabled={isCitySel}
                                className={`block w-full text-left px-4 py-1.5 text-sm transition-colors rounded ${
                                  isCitySel
                                    ? 'text-brand font-medium bg-brand/5'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
                                }`}
                              >
                                {isCitySel ? '✓ ' : ''}{city}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
