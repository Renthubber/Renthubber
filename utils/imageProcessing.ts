/**
 * 🖼️ IMAGE PROCESSING UTILITY - RentHubber
 * 
 * Processa le immagini caricate dagli utenti per garantire
 * una visualizzazione ottimale nelle card e nei dettagli annuncio.
 */

export interface ProcessedImage {
  /** Base64 dell'immagine processata (per card e anteprime) */
  thumbnail: string;
  /** Base64 dell'immagine full size (per galleria dettaglio) */
  full: string;
}

export interface ImageProcessingOptions {
  /** Larghezza massima per la versione full (default: 1200) */
  maxFullWidth?: number;
  /** Altezza massima per la versione full (default: 900) */
  maxFullHeight?: number;
  /** Larghezza thumbnail per card (default: 600) */
  thumbnailWidth?: number;
  /** Altezza thumbnail per card (default: 450) */
  thumbnailHeight?: number;
  /** Qualità JPEG 0-1 (default: 0.85) */
  quality?: number;
  /** Aspect ratio target per crop (default: 4/3) */
  aspectRatio?: number;
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxFullWidth: 1200,
  maxFullHeight: 900,
  thumbnailWidth: 600,
  thumbnailHeight: 450,
  quality: 0.85,
  aspectRatio: 4 / 3, // 4:3 ideale per card
};

/**
 * Carica un'immagine da File o base64 string
 */
const loadImage = (source: File | string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Impossibile caricare l\'immagine'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Errore lettura file'));
      reader.readAsDataURL(source);
    }
  });
};

/**
 * Calcola le dimensioni di crop per centrare l'immagine
 * mantenendo l'aspect ratio target
 */
const calculateCropDimensions = (
  sourceWidth: number,
  sourceHeight: number,
  targetAspectRatio: number
): { sx: number; sy: number; sWidth: number; sHeight: number } => {
  const sourceAspectRatio = sourceWidth / sourceHeight;
  
  let sWidth: number;
  let sHeight: number;
  let sx: number;
  let sy: number;

  if (sourceAspectRatio > targetAspectRatio) {
    // L'immagine è più larga del target → crop orizzontale
    sHeight = sourceHeight;
    sWidth = sourceHeight * targetAspectRatio;
    sx = (sourceWidth - sWidth) / 2;
    sy = 0;
  } else {
    // L'immagine è più alta del target → crop verticale
    sWidth = sourceWidth;
    sHeight = sourceWidth / targetAspectRatio;
    sx = 0;
    sy = (sourceHeight - sHeight) / 2;
  }

  return { sx, sy, sWidth, sHeight };
};

/**
 * Croppa e ridimensiona un'immagine su canvas
 * SEMPRE croppa al ratio target, ridimensiona solo se necessario
 */
const resizeAndCrop = (
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  aspectRatio: number,
  quality: number
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context non disponibile');
  }

  // Calcola crop centrato per ottenere il ratio corretto
  const crop = calculateCropDimensions(img.width, img.height, aspectRatio);
  
  // Calcola dimensioni finali
  // Se l'immagine croppata è più piccola del target, usa le dimensioni croppate
  // Se è più grande, ridimensiona al target
  let finalWidth: number;
  let finalHeight: number;
  
  if (crop.sWidth <= targetWidth) {
    // Immagine piccola: mantieni dimensioni dopo crop, ma rispetta il ratio
    finalWidth = Math.round(crop.sWidth);
    finalHeight = Math.round(crop.sWidth / aspectRatio);
  } else {
    // Immagine grande: ridimensiona al target
    finalWidth = targetWidth;
    finalHeight = targetHeight;
  }
  
  // Assicurati che le dimensioni siano almeno 1px
  finalWidth = Math.max(1, finalWidth);
  finalHeight = Math.max(1, finalHeight);
  
  // Imposta dimensioni canvas
  canvas.width = finalWidth;
  canvas.height = finalHeight;

  // Abilita smoothing per qualità migliore
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Disegna l'immagine croppata e ridimensionata
  ctx.drawImage(
    img,
    crop.sx,      // source x
    crop.sy,      // source y  
    crop.sWidth,  // source width
    crop.sHeight, // source height
    0,            // dest x
    0,            // dest y
    finalWidth,   // dest width
    finalHeight   // dest height
  );

  // Converti in base64 JPEG
  return canvas.toDataURL('image/jpeg', quality);
};

/**
 * Ridimensiona mantenendo l'aspect ratio originale (per full size)
 */
const resizeKeepAspect = (
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context non disponibile');
  }

  // Calcola dimensioni mantenendo aspect ratio
  let width = img.width;
  let height = img.height;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
};

/**
 * 🔥 FUNZIONE PRINCIPALE: Processa un'immagine
 * 
 * @param source - File o base64 string dell'immagine
 * @param options - Opzioni di processing
 * @returns ProcessedImage con thumbnail e full size
 */
export const processImage = async (
  source: File | string,
  options?: ImageProcessingOptions
): Promise<ProcessedImage> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const img = await loadImage(source);

  // Genera thumbnail (croppato per card)
  const thumbnail = resizeAndCrop(
    img,
    opts.thumbnailWidth,
    opts.thumbnailHeight,
    opts.aspectRatio,
    opts.quality
  );

  // Genera full size (ridimensionato, aspect originale)
  const full = resizeKeepAspect(
    img,
    opts.maxFullWidth,
    opts.maxFullHeight,
    opts.quality
  );

  return { thumbnail, full };
};

/**
 * 🔥 FUNZIONE SEMPLIFICATA: Processa e ritorna solo una versione
 * SEMPRE croppa al ratio 4:3, anche per immagini piccole
 */
export const processImageSingle = async (
  source: File | string,
  options?: ImageProcessingOptions
): Promise<string> => {
  console.log('🔥 processImageSingle CHIAMATO!');
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('🔥 Opzioni:', opts);
  
  const img = await loadImage(source);
  
  console.log('🔥 Immagine caricata - dimensioni originali:', img.width, 'x', img.height);

  // Genera versione ottimizzata con crop (SEMPRE croppa al ratio 4:3)
  const result = resizeAndCrop(
    img,
    opts.thumbnailWidth,
    opts.thumbnailHeight,
    opts.aspectRatio,
    opts.quality
  );
  
  console.log('🔥 Immagine processata - lunghezza base64:', result.length);
  
  return result;
};

/**
 * 🔥 BATCH PROCESSING: Processa più immagini
 */
export const processImages = async (
  sources: (File | string)[],
  options?: ImageProcessingOptions
): Promise<ProcessedImage[]> => {
  return Promise.all(sources.map(source => processImage(source, options)));
};

/**
 * 🔥 BATCH PROCESSING SEMPLIFICATO
 */
export const processImagesSingle = async (
  sources: (File | string)[],
  options?: ImageProcessingOptions
): Promise<string[]> => {
  return Promise.all(sources.map(source => processImageSingle(source, options)));
};

/**
 * Utility: Verifica se una stringa è un base64 valido
 */
export const isValidBase64Image = (str: string): boolean => {
  return str.startsWith('data:image/');
};

/**
 * Utility: Stima la dimensione in KB di una stringa base64
 */
export const getBase64SizeKB = (base64: string): number => {
  const base64Data = base64.split(',')[1] || base64;
  const bytes = (base64Data.length * 3) / 4;
  return Math.round(bytes / 1024);
};