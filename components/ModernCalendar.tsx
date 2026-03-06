
import React, { useState, useEffect } from 'react';
import { DayPicker, DateRange, DayPickerProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type ModernCalendarProps = DayPickerProps & {
  className?: string;
  selected?: DateRange;
  priceUnit?: 'ora' | 'giorno' | 'settimana' | 'mese';
  location?: string; // New prop for header
  onClear?: () => void; // New prop for footer
};

export const ModernCalendar: React.FC<ModernCalendarProps> = ({
  className = '',
  classNames,
  selected,
  priceUnit = 'giorno',
  location = 'destinazione',
  onClear,
  ...props
}) => {
  const [numMonths, setNumMonths] = useState(2);

  useEffect(() => {
    const handleResize = () => {
      // Force 2 months on desktop, 1 on mobile
      if (window.innerWidth < 768) {
        setNumMonths(1);
      } else {
        setNumMonths(2);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate nights text
  let headerTitle = "Seleziona date";
  let headerDates = "Aggiungi le date del tuo viaggio";

  if (selected?.from && selected?.to) {
    const diffTime = Math.abs(selected.to.getTime() - selected.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    headerTitle = `${diffDays} notti a ${location.split(',')[0]}`; // Take only city name
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    headerDates = `${selected.from.toLocaleDateString('it-IT', options)} - ${selected.to.toLocaleDateString('it-IT', options)}`;
  } else if (selected?.from) {
    headerTitle = "Seleziona check-out";
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    headerDates = `${selected.from.toLocaleDateString('it-IT', options)} - ?`;
  }

  return (
    <div className={`bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 ${className}`}>
      
      {/* HEADER INTERNO STILE AIRBNB */}
      <div className="mb-8 text-left">
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{headerTitle}</h3>
        <p className="text-gray-500 text-sm">{headerDates}</p>
      </div>

      {/* CALENDARIO */}
      <div className="relative">
        <style>{`
            .rdp {
              margin: 0;
              --rdp-cell-size: 44px; /* Celle più grandi */
              --rdp-accent-color: #0D414B;
              --rdp-background-color: #F7F7F7; 
            }
            
            .rdp-months {
              display: flex;
              gap: 40px; /* Gap abbondante */
            }

            /* FORZATURA LAYOUT ORIZZONTALE DESKTOP */
            @media (min-width: 768px) {
              .rdp-months {
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                justify-content: center;
              }
            }

            .rdp-month {
              background: white;
              width: auto; /* Lascia che il contenuto definisca la larghezza */
            }
            
            .rdp-caption {
              margin-bottom: 20px;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 40px;
            }
            
            .rdp-caption_label {
              font-size: 16px;
              font-weight: 600;
              color: #222222;
              text-transform: capitalize;
            }
            
            /* NAVIGATION WIDE - FRECCE AGLI ESTREMI */
            .rdp-nav {
               position: absolute;
               top: 0;
               left: 0;
               width: 100%;
               display: flex;
               justify-content: space-between;
               pointer-events: none;
               z-index: 10;
               padding: 0 10px;
            }
            
            .rdp-nav_button {
               pointer-events: auto;
               width: 32px;
               height: 32px;
               border-radius: 50%;
               display: flex;
               align-items: center;
               justify-content: center;
               background: transparent;
               border: none;
               color: #222222;
               transition: all 0.2s;
               cursor: pointer;
            }
            .rdp-nav_button:hover {
               background-color: #F7F7F7;
            }

            /* Table */
            .rdp-table {
               border-collapse: collapse;
            }
            
            .rdp-head_cell {
               font-size: 0.75rem;
               font-weight: 600;
               color: #717171;
               padding-bottom: 8px;
               width: var(--rdp-cell-size);
               text-align: center;
            }
            
            .rdp-cell {
               text-align: center;
               padding: 0;
               width: var(--rdp-cell-size);
               height: var(--rdp-cell-size);
            }

            /* Day Styling */
            .rdp-day {
               width: 100%;
               height: 100%;
               font-size: 0.9rem;
               font-weight: 500;
               border-radius: 50%;
               color: #222222;
               border: 1.5px solid transparent;
               display: flex;
               align-items: center;
               justify-content: center;
               background: transparent;
               cursor: pointer;
            }
            
            .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
               border-color: #222222; /* Cerchietto nero al passaggio */
            }

            /* RANGE STYLING */
            
            /* Middle Range Strip (Grigio chiaro continuo) */
            .rdp-day_range_middle {
               background-color: #F7F7F7 !important; 
               color: #222222 !important;
               border-radius: 0 !important;
            }
            
            .rdp-day_range_middle:hover {
               background-color: #F0F0F0 !important;
            }
            
            /* Start & End (Cerchi neri/brand pieni) */
            .rdp-day_selected:not(.rdp-day_range_middle) {
               background-color: #0D414B !important; /* Brand Color */
               color: white !important;
               font-weight: 600;
               border-radius: 50% !important;
               position: relative;
               z-index: 2;
            }

            /* Connessione visuale start/end col range */
            .rdp-day_range_start::before {
               content: '';
               position: absolute;
               right: 0;
               top: 0;
               bottom: 0;
               width: 50%;
               background-color: #F7F7F7;
               z-index: -1;
            }
            
            .rdp-day_range_end::before {
               content: '';
               position: absolute;
               left: 0;
               top: 0;
               bottom: 0;
               width: 50%;
               background-color: #F7F7F7;
               z-index: -1;
            }

            /* Fix per selezione singola (nascondi background range) */
            .rdp-day_range_start.rdp-day_range_end::before {
               display: none;
            }

            /* Disabled Days */
            .rdp-day_disabled {
               color: #DDDDDD;
               text-decoration: line-through;
               font-weight: 300;
               cursor: not-allowed;
            }
            .rdp-day_disabled:hover {
               border-color: transparent;
            }
            
            /* Today */
            .rdp-day_today {
               font-weight: 700;
            }
        `}</style>
        
        <DayPicker
          mode="range"
          numberOfMonths={numMonths}
          pagedNavigation
          showOutsideDays={false}
          selected={selected}
          components={{
             ChevronLeft: () => <ChevronLeft className="w-4 h-4" />,
             ChevronRight: () => <ChevronRight className="w-4 h-4" />
          }}
          {...props}
        />
      </div>

      {/* FOOTER STILE AIRBNB */}
      <div className="mt-6 flex justify-end">
        <button 
          onClick={onClear}
          className="text-gray-900 underline text-sm font-semibold hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
        >
          Annulla date
        </button>
      </div>

    </div>
  );
};
