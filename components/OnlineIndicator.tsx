import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface OnlineIndicatorProps {
  userId: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ 
  userId, 
  showLabel = false,
  size = 'md' 
}) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkPresence = async () => {
      try {
        const { data } = await supabase
          .from('user_presence')
          .select('is_online, last_seen')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (data) {
          const lastSeen = new Date(data.last_seen);
          const now = new Date();
          const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;
          setIsOnline(data.is_online && diffMinutes < 2);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      }
    };

    checkPresence();
    const interval = setInterval(checkPresence, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span 
        className={`${sizeClasses[size]} rounded-full transition-colors ${
          isOnline ? 'bg-green-500' : 'bg-gray-300'
        }`}
        title={isOnline ? 'Online' : 'Offline'}
      />
      {showLabel && (
        <span className="text-xs text-gray-500">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  );
};