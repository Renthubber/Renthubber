import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  bucketName?: string;
  maxSizeMB?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label,
  bucketName = 'announcement-images',
  maxSizeMB = 10
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Valida tipo
    if (!file.type.startsWith('image/')) {
      return 'Il file deve essere un\'immagine (JPG, PNG, GIF, WebP)';
    }

    // Valida dimensione
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `L'immagine è troppo grande (${sizeMB.toFixed(1)}MB). Massimo ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // Genera nome file unico
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      // Upload su Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (err: any) {
      console.error('Errore upload:', err);
      setError(err.message || 'Errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    await uploadFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Estrai path dal URL pubblico
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('announcements')).join('/');

      // Elimina da Supabase Storage
      await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      onChange(null);
      setError(null);
    } catch (err) {
      console.error('Errore rimozione:', err);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Upload area */}
      {!value && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />

          <div className="flex flex-col items-center">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-700">Caricamento in corso...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Trascina un'immagine qui
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  oppure clicca per selezionare
                </p>
                <p className="text-xs text-gray-400">
                  JPG, PNG, GIF, WebP • Max {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {value && !uploading && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          {/* Overlay con azioni */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Sostituisci
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Rimuovi
            </button>
          </div>
          {/* Success indicator */}
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Caricata
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info */}
      {value && (
        <p className="text-xs text-gray-500 mt-2">
          💡 L'immagine è stata caricata su Supabase Storage
        </p>
      )}
    </div>
  );
};