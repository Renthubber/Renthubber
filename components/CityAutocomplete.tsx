import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { searchItalianCities, CitySuggestion } from '../services/geocodingService';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string, suggestion?: CitySuggestion) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Inizia a digitare una città...',
  label,
  required = false,
  helperText,
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cerca città con debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchItalianCities(value);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Errore ricerca città:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  // Gestione click fuori dal componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestione tastiera
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const selectSuggestion = (suggestion: CitySuggestion) => {
    onChange(suggestion.displayName, suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
          autoComplete="off"
        />
      </div>

      {helperText && (
        <p className="text-xs text-gray-400 mt-1">{helperText}</p>
      )}

      {/* Dropdown suggerimenti */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <button
              key={`${suggestion.city}-${idx}`}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full px-4 py-3 text-left flex items-center text-sm transition-colors ${
                idx === selectedIndex
                  ? 'bg-brand/10 text-brand'
                  : 'hover:bg-gray-50'
              } ${idx === 0 ? 'rounded-t-xl' : ''} ${
                idx === suggestions.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <MapPin className={`w-4 h-4 mr-3 flex-shrink-0 ${
                idx === selectedIndex ? 'text-brand' : 'text-gray-400'
              }`} />
              <div>
                <span className="font-medium">{suggestion.city}</span>
                {suggestion.province && (
                  <span className="text-gray-500 ml-1">({suggestion.province})</span>
                )}
                {suggestion.region && (
                  <span className="text-gray-400 text-xs ml-2">{suggestion.region}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Messaggio nessun risultato */}
      {showSuggestions && suggestions.length === 0 && value.length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-sm text-gray-500">
          <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-300" />
          Nessuna città trovata per "{value}"
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;