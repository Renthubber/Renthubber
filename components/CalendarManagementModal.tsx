import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';
import { getBlockedDates, createBlockedDate, deleteBlockedDate, BlockedDate } from './blockedDatesService';
import { supabase } from '../services/supabaseClient';

interface CalendarManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

interface BookedDate {
  start_date: string;
  end_date: string;
  status: string;
}

const CalendarManagementModal: React.FC<CalendarManagementModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDates();
    }
  }, [isOpen, listingId]);

  const loadDates = async () => {
    setLoading(true);
    try {
      // Carica date bloccate
      const blocked = await getBlockedDates(listingId);
      setBlockedDates(blocked);

      // Carica prenotazioni
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_date, end_date, status')
        .eq('listing_id', listingId)
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;
      setBookedDates(bookings || []);
    } catch (error) {
      console.error('Error loading dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDateBooked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedDates.some(booking => {
      return dateStr >= booking.start_date && dateStr < booking.end_date;
    });
  };

  const isDateBlocked = (date: Date): { blocked: boolean; blockId?: string } => {
    const dateStr = date.toISOString().split('T')[0];
    const block = blockedDates.find(blocked => {
      return dateStr >= blocked.start_date && dateStr < blocked.end_date;
    });
    return { blocked: !!block, blockId: block?.id };
  };

  const handleDateClick = async (date: Date) => {
    if (isDateBooked(date)) return; // Non permettere di bloccare date già prenotate

    const { blocked, blockId } = isDateBlocked(date);

    if (blocked && blockId) {
      // Sblocca la data
      if (window.confirm('Vuoi sbloccare questa data?')) {
        try {
          await deleteBlockedDate(blockId);
          await loadDates();
        } catch (error) {
          console.error('Error unblocking date:', error);
          alert('Errore durante lo sblocco della data');
        }
      }
    } else {
      // Blocca la data
      if (!isSelecting) {
        setSelectedDates([date]);
        setIsSelecting(true);
      } else {
        // Blocca il range
        const dates = [selectedDates[0], date].sort((a, b) => a.getTime() - b.getTime());
        try {
          await createBlockedDate({
            listing_id: listingId,
            start_date: dates[0].toISOString().split('T')[0],
            end_date: dates[1].toISOString().split('T')[0]
          });
          await loadDates();
          setSelectedDates([]);
          setIsSelecting(false);
        } catch (error) {
          console.error('Error blocking dates:', error);
          alert('Errore durante il blocco delle date');
        }
      }
    }
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Aggiungi giorni vuoti per allineare il primo giorno del mese
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(0)); // Data placeholder
    }

    // Aggiungi tutti i giorni del mese
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDayClassName = (date: Date): string => {
    if (date.getTime() === 0) return 'invisible'; // Giorno placeholder

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = date < today;
    const isBooked = isDateBooked(date);
    const { blocked } = isDateBlocked(date);

    let className = 'h-12 flex items-center justify-center rounded-lg cursor-pointer transition-colors ';

    if (isPast) {
      className += 'text-gray-300 cursor-not-allowed';
    } else if (isBooked || blocked) {
      className += 'bg-gray-300 text-white cursor-not-allowed';
    } else {
      className += 'hover:bg-orange-100 text-gray-700';
    }

    return className;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestisci Calendario</h2>
            <p className="text-sm text-gray-600 mt-1">{listingTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Legenda */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">Come funziona:</p>
                <ul className="space-y-1">
                  <li>• Clicca su una data libera per bloccarla</li>
                  <li>• Clicca su una data bloccata per sbloccarla</li>
                  <li>• Le date prenotate non possono essere bloccate</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navigazione mese */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-semibold">
              {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Calendario */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div>
              {/* Header giorni settimana */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Giorni del mese */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentDate).map((date, index) => (
                  <div
                    key={index}
                    className={getDayClassName(date)}
                    onClick={() => date.getTime() !== 0 && handleDateClick(date)}
                  >
                    {date.getTime() !== 0 && date.getDate()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarManagementModal;