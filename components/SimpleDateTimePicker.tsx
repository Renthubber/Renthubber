import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';

const DAYS_IT = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const isSameDay = (d1: Date | null, d2: Date | null) => {
  if (!d1 || !d2) return false;
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

interface SimpleDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label: string;
  minDate?: Date;
  placeholder?: string;
  inline?: boolean; // Se true, mostra calendario sempre aperto sotto l'input
}

export const SimpleDateTimePicker: React.FC<SimpleDateTimePickerProps> = ({
  value,
  onChange,
  label,
  minDate,
  placeholder = 'Seleziona data e ora',
  inline = false
}) => {
  const [isOpen, setIsOpen] = useState(inline); // Se inline, sempre aperto
  const [viewDate, setViewDate] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [hours, setHours] = useState(value ? value.getHours() : 12);
  const [minutes, setMinutes] = useState(value ? value.getMinutes() : 0);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setHours(value.getHours());
      setMinutes(value.getMinutes());
    }
  }, [value]);

  // Se inline, mantieni sempre aperto
  useEffect(() => {
    if (inline) setIsOpen(true);
  }, [inline]);

  const handleDayClick = (date: Date) => {
    // Blocca date prima di minDate
    if (minDate && date < minDate) return;

    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate);
      if (!inline) setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange(null);
    if (!inline) setIsOpen(false);
  };

  const canGoPrev = () => {
    if (!minDate) return true;
    const currentViewMonth = viewDate.getMonth();
    const currentViewYear = viewDate.getFullYear();
    return currentViewYear > minDate.getFullYear() || 
           (currentViewYear === minDate.getFullYear() && currentViewMonth > minDate.getMonth());
  };

  const renderDay = (day: number | null, month: number, year: number) => {
    if (!day) return <div key={`empty-${month}-${Math.random()}`} className="w-[40px] h-[40px]" />;

    const date = new Date(year, month, day);
    const isPast = minDate && date < minDate;
    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

    let wrapperClass = "relative w-[40px] h-[40px] flex items-center justify-center";
    let innerClass = "w-full h-full rounded-full flex items-center justify-center transition-all";
    let textClass = "text-[14px] font-medium";

    if (isPast) {
      textClass += " text-gray-300";
      wrapperClass += " cursor-not-allowed";
    } else {
      wrapperClass += " cursor-pointer";
      if (isSelected) {
        innerClass += " bg-black";
        textClass += " text-white font-semibold";
      } else {
        innerClass += " hover:border hover:border-black";
        textClass += " text-gray-800";
      }
    }

    return (
      <div key={`${year}-${month}-${day}`} className={wrapperClass} onClick={() => !isPast && handleDayClick(date)}>
        <div className={innerClass}>
          <span className={textClass}>{day}</span>
        </div>
      </div>
    );
  };

  const renderMonth = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = getDaysInMonth(year, month);
    const startPadding = getFirstDayOfMonth(year, month);
    
    const days = [];
    for(let i = 0; i < startPadding; i++) days.push(null);
    for(let i = 1; i <= totalDays; i++) days.push(i);
    
    return (
      <div className="w-[320px] select-none">
        <h3 className="text-center font-bold text-gray-800 mb-4 text-base">
          {MONTHS_IT[month]} {year}
        </h3>
        <div className="grid grid-cols-7 mb-2">
          {DAYS_IT.map((day, i) => (
            <div key={i} className="text-center text-[11px] font-bold text-gray-500">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 justify-items-center">
          {days.map((day) => renderDay(day, month, year))}
        </div>
      </div>
    );
  };

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    return value.toLocaleString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Input trigger - nascosto se inline */}
      {!inline && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors bg-white"
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {formatDisplayValue()}
          </span>
        </button>
      )}

      {/* Calendar */}
      {isOpen && (
        <>
          {/* Backdrop - solo se non inline */}
          {!inline && (
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Calendar popup/inline */}
          <div className={
            inline 
              ? "w-full bg-white rounded-xl border border-gray-200 p-4 mt-2"
              : "absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6"
          }>
            {!inline && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Seleziona data e ora</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Calendar */}
            <div className="relative mb-6">
              <div className="absolute w-full flex justify-between top-0 px-1 z-20 pointer-events-none">
                <button 
                  onClick={() => canGoPrev() && setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} 
                  className={`pointer-events-auto p-2 rounded-full transition-colors ${
                    canGoPrev() ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'
                  }`}
                  disabled={!canGoPrev()}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-800 stroke-[2.5]" />
                </button>
                <button 
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} 
                  className="pointer-events-auto p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-800 stroke-[2.5]" />
                </button>
              </div>

              {renderMonth()}
            </div>

            {/* Time picker */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Orario</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <select
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-gray-500 font-bold">:</span>
                <div className="flex-1">
                  <select
                    value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancella
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedDate}
                className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Conferma
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};