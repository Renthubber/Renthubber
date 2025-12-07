import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* 
 * ==========================================
 * UTILS & HELPERS (Vanilla JS Date Logic)
 * ==========================================
 */

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

const isBeforeDay = (d1: Date, d2: Date) => {
  const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return a.getTime() < b.getTime();
};

const isBetween = (date: Date, start: Date, end: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d > s && d < e;
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number) => {
  // 0 = Lunedi, 6 = Domenica
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

interface AirbnbCalendarProps {
  selectedStart: Date | undefined;
  selectedEnd: Date | undefined;
  onChange: (start: Date | undefined, end: Date | undefined) => void;
  disabledDates?: Date[];
  location?: string;
  onClose?: () => void;
  compact?: boolean; // Forza visualizzazione a 1 mese
}

export const AirbnbCalendar: React.FC<AirbnbCalendarProps> = ({
  selectedStart,
  selectedEnd,
  onChange,
  disabledDates = [],
  location = 'destinazione',
  onClose,
  compact = false
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [numMonths, setNumMonths] = useState(compact ? 1 : 2);

  useEffect(() => {
    if (compact) {
      setNumMonths(1);
      return;
    }
    const handleResize = () => setNumMonths(window.innerWidth < 768 ? 1 : 2);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [compact]);

  const handleDayClick = (date: Date) => {
    // Blocca click su date passate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date.getTime() < today.getTime()) return;
    
    if (disabledDates.some(d => isSameDay(d, date))) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      onChange(date, undefined); // Start new selection
    } else {
      if (isBeforeDay(date, selectedStart)) {
        onChange(date, undefined); // Restart if clicked before
      } else if (isSameDay(date, selectedStart)) {
         // Clicked same day twice -> do nothing or deselect? Airbnb usually keeps start.
      } else {
        onChange(selectedStart, date); // Set end
        // ✅ Chiudi automaticamente dopo aver selezionato entrambe le date
        setTimeout(() => {
          onClose?.();
        }, 300); // Piccolo delay per vedere la selezione
      }
    }
  };

  // Determina se possiamo andare al mese precedente
  const canGoPrev = () => {
    const today = new Date();
    const currentViewMonth = viewDate.getMonth();
    const currentViewYear = viewDate.getFullYear();
    // Permetti di tornare indietro solo se il mese visualizzato è successivo al mese corrente
    return currentViewYear > today.getFullYear() || 
           (currentViewYear === today.getFullYear() && currentViewMonth > today.getMonth());
  };

  const renderDay = (day: number | null, month: number, year: number) => {
    if (!day) return <div key={`empty-${month}-${Math.random()}`} className="w-[44px] h-[44px]" />;

    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetta ore per confronto solo data
    
    const isPastDate = date.getTime() < today.getTime();
    const isDisabled = isPastDate || disabledDates.some(d => isSameDay(d, date));
    
    const isStart = selectedStart ? isSameDay(date, selectedStart) : false;
    const isEnd = selectedEnd ? isSameDay(date, selectedEnd) : false;
    const inRange = selectedStart && selectedEnd && isBetween(date, selectedStart, selectedEnd);

    // Classi base
    let wrapperClass = "relative w-[44px] h-[44px] flex items-center justify-center z-10";
    let textClass = "text-[14px] font-medium text-[#222]";
    let innerCircleClass = "w-full h-full rounded-full flex items-center justify-center border border-transparent transition-all";
    
    // Sfondo Range (Pillola)
    let rangeBg = null;

    // ✅ STILE DATE DISABILITATE (passate o già prenotate)
    if (isDisabled) {
      textClass = isPastDate 
        ? "text-gray-300" // Date passate: grigio chiaro senza barrato
        : "text-gray-400 line-through decoration-gray-400 decoration-2"; // Date prenotate: barrate
      wrapperClass += " cursor-not-allowed";
      innerCircleClass += isPastDate ? "" : " bg-gray-100";
    } else {
      wrapperClass += " cursor-pointer";
      if (!isStart && !isEnd && !inRange) {
         innerCircleClass += " hover:border-black";
      }
    }

    if (inRange) {
       rangeBg = <div className="absolute inset-0 bg-[#F2F2F2] z-[-1]" />;
       innerCircleClass += " hover:bg-[#F2F2F2]"; 
    } else if (isStart && selectedEnd) {
       rangeBg = <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-[#F2F2F2] z-[-1]" />;
    } else if (isEnd && selectedStart) {
       rangeBg = <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-[#F2F2F2] z-[-1]" />;
    }

    if (isStart || isEnd) {
       innerCircleClass = "w-full h-full rounded-full bg-black text-white flex items-center justify-center z-20";
       textClass = "text-white font-semibold";
    }

    return (
      <div key={`${year}-${month}-${day}`} className={wrapperClass} onClick={() => !isDisabled && handleDayClick(date)}>
         {rangeBg}
         <div className={innerCircleClass}>
            <span className={textClass}>{day}</span>
         </div>
      </div>
    );
  };

  const renderMonth = (offset: number) => {
     const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
     const year = d.getFullYear();
     const month = d.getMonth();
     const totalDays = getDaysInMonth(year, month);
     const startPadding = getFirstDayOfMonth(year, month);
     
     const days = [];
     for(let i=0; i<startPadding; i++) days.push(null);
     for(let i=1; i<=totalDays; i++) days.push(i);

     return (
        <div className="w-[320px] select-none">
           <h3 className="text-center font-bold text-gray-800 mb-4 capitalize text-sm md:text-base">
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

  // Header Info
  let title = "Seleziona date";
  let sub = "Aggiungi le date del tuo viaggio";
  if (selectedStart && selectedEnd) {
     const n = Math.ceil(Math.abs(selectedEnd.getTime() - selectedStart.getTime()) / (1000*60*60*24));
     title = `${n} giorni a ${location.split(',')[0]}`;
     sub = `${selectedStart.toLocaleDateString('it-IT', {day:'numeric', month:'short', year:'numeric'})} – ${selectedEnd.toLocaleDateString('it-IT', {day:'numeric', month:'short', year:'numeric'})}`;
  } else if (selectedStart) {
     title = "Seleziona check-out";
     sub = `${selectedStart.toLocaleDateString('it-IT', {day:'numeric', month:'short', year:'numeric'})} – ?`;
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 inline-block animate-in fade-in zoom-in-95 duration-200">
       
       {/* HEADER */}
       <div className="mb-8">
          <h2 className="text-[22px] font-bold text-[#222]">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{sub}</p>
       </div>

       {/* CALENDAR BODY */}
       <div className="relative">
          {/* Navigation Arrows */}
          <div className="absolute w-full flex justify-between top-0 px-1 z-20 pointer-events-none">
             <button 
               onClick={() => canGoPrev() && setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} 
               className={`pointer-events-auto p-2 rounded-full transition-colors ${
                 canGoPrev() ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-30 cursor-not-allowed'
               }`}
               disabled={!canGoPrev()}
             >
                <ChevronLeft className="w-4 h-4 text-gray-800 stroke-[2.5]" />
             </button>
             <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="pointer-events-auto p-2 rounded-full hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-800 stroke-[2.5]" />
             </button>
          </div>

          {/* Months Grid */}
          <div className="flex flex-col md:flex-row gap-x-16">
             {renderMonth(0)}
             {numMonths > 1 && renderMonth(1)}
          </div>
       </div>

       {/* FOOTER */}
       <div className="mt-6 flex justify-end">
          <button 
            onClick={() => onChange(undefined, undefined)}
            className="text-sm font-semibold text-[#222] underline hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
          >
             Annulla date
          </button>
       </div>
    </div>
  );
};