/**
 * MIGRAZIONE IMMAGINI BASE64 → SUPABASE STORAGE
 * 
 * ISTRUZIONI:
 * 1. Salva questo file nella root del progetto (accanto a package.json)
 * 2. Apri il file e inserisci la tua SUPABASE_ANON_KEY alla riga 15
 * 3. Esegui: npx tsx migrate-images.ts
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURAZIONE
// ============================================
const SUPABASE_URL = 'https://upyznglekmynztmydtxi.supabase.co';
const SUPABASE_ANON_KEY = 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FUNZIONI
// ============================================

/**
 * Converte base64 in Buffer
 */
function base64ToBuffer(base64String: string): Buffer {
  // Rimuovi il prefisso "data:image/...;base64," se presente
  const cleanBase64 = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(cleanBase64, 'base64');
}

/**
 * Estrae il tipo di immagine (jpeg, png, webp)
 */
function getImageType(base64String: string): string {
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? match[1] : 'jpeg';
}

/**
 * Carica una singola immagine su Storage
 */
async function uploadImage(
  listingId: string,
  imageIndex: number,
  base64String: string
): Promise<string | null> {
  try {
    // Converti base64 in buffer
    const buffer = base64ToBuffer(base64String);
    const imageType = getImageType(base64String);
    
    // Nome file: {listingId}/{index}.{tipo}
    const fileName = `${listingId}/${imageIndex}.${imageType}`;
    
    console.log(`    📤 Upload immagine ${imageIndex + 1} (${imageType})...`);
    
    // Upload su Storage
    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, buffer, {
        contentType: `image/${imageType}`,
        cacheControl: '31536000', // Cache 1 anno
        upsert: true // Sovrascrivi se esiste già
      });
    
    if (error) {
      console.error(`    ❌ Errore upload:`, error.message);
      return null;
    }
    
    // Ottieni URL pubblico
    const { data: urlData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(fileName);
    
    console.log(`    ✅ Caricata!`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error(`    ❌ Errore:`, error);
    return null;
  }
}

/**
 * Migra un singolo listing
 */
async function migrateListing(listing: any): Promise<boolean> {
  const { id, title, images } = listing;
  
  console.log(`\n🔄 Migrando: "${title}"`);
  console.log(`   ID: ${id}`);
  
  try {
    // Parse delle immagini (potrebbero essere JSON string o array)
    let imagesArray: string[] = [];
    
    if (typeof images === 'string') {
      imagesArray = JSON.parse(images);
    } else if (Array.isArray(images)) {
      imagesArray = images;
    } else {
      console.log('   ⚠️  Nessuna immagine trovata, skip');
      return false;
    }
    
    if (imagesArray.length === 0) {
      console.log('   ⚠️  Array immagini vuoto, skip');
      return false;
    }
    
    console.log(`   📷 Trovate ${imagesArray.length} immagini`);
    
    // Carica tutte le immagini su Storage
    const newImageUrls: string[] = [];
    
    for (let i = 0; i < imagesArray.length; i++) {
      const url = await uploadImage(id, i, imagesArray[i]);
      if (url) {
        newImageUrls.push(url);
      }
    }
    
    if (newImageUrls.length === 0) {
      console.log('   ❌ Nessuna immagine caricata con successo');
      return false;
    }
    
    console.log(`   💾 Aggiornamento database...`);
    
    // Aggiorna il database con i nuovi URL
    const { error: updateError } = await supabase
      .from('listings')
      .update({ images: newImageUrls })
      .eq('id', id);
    
    if (updateError) {
      console.error('   ❌ Errore aggiornamento database:', updateError.message);
      return false;
    }
    
    console.log(`   ✅ Listing migrato con successo! (${newImageUrls.length} immagini)`);
    return true;
    
  } catch (error) {
    console.error('   ❌ Errore generale:', error);
    return false;
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MIGRAZIONE IMMAGINI BASE64 → SUPABASE STORAGE');
  console.log('='.repeat(60) + '\n');
  
  // Verifica configurazione
  if (SUPABASE_ANON_KEY === 'INSERISCI_QUI_LA_TUA_ANON_KEY') {
    console.error('❌ ERRORE: Devi configurare SUPABASE_ANON_KEY nel file!');
    console.log('\n📝 Vai su Supabase → Settings → API → copia "anon public" key');
    console.log('   e incollala alla riga 15 di questo file.\n');
    process.exit(1);
  }
  
  try {
    // 1. Carica tutti i listings dal database
    console.log('📥 Caricamento listings dal database...');
    
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, images')
      .not('images', 'is', null);
    
    if (error) {
      throw error;
    }
    
    if (!listings || listings.length === 0) {
      console.log('⚠️  Nessun listing trovato con immagini\n');
      return;
    }
    
    console.log(`✅ Trovati ${listings.length} listings\n`);
    
    // 2. Migra ogni listing
    let successCount = 0;
    let failedCount = 0;
    
    for (const listing of listings) {
      const success = await migrateListing(listing);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
    }
    
    // 3. Riepilogo finale
    console.log('\n' + '='.repeat(60));
    console.log('📊 RIEPILOGO MIGRAZIONE');
    console.log('='.repeat(60));
    console.log(`✅ Listings migrati: ${successCount}`);
    console.log(`❌ Listings falliti: ${failedCount}`);
    console.log(`📦 Totale: ${listings.length}`);
    console.log('='.repeat(60));
    
    if (successCount === listings.length) {
      console.log('\n🎉 MIGRAZIONE COMPLETATA CON SUCCESSO!\n');
      console.log('✅ Tutte le immagini sono ora su Supabase Storage');
      console.log('✅ Il database è stato aggiornato con gli URL');
      console.log('✅ Il sito dovrebbe essere molto più veloce\n');
      console.log('📝 Prossimi passi:');
      console.log('   1. Ricarica la homepage e verifica che le immagini si vedano');
      console.log('   2. Se tutto ok, puoi eliminare listings_backup');
      console.log('   3. Modifica il form upload per caricare direttamente su Storage\n');
    } else if (successCount > 0) {
      console.log('\n⚠️  Migrazione parziale completata\n');
      console.log(`${successCount} listings migrati con successo`);
      console.log(`${failedCount} listings hanno avuto problemi`);
      console.log('Controlla i log sopra per i dettagli\n');
    } else {
      console.log('\n❌ Migrazione fallita\n');
      console.log('Nessun listing è stato migrato. Controlla i log sopra.\n');
    }
    
  } catch (error) {
    console.error('\n❌ ERRORE GENERALE:', error);
    console.log('\nLa migrazione è fallita. Il database non è stato modificato.\n');
    process.exit(1);
  }
}

// Esegui

main();
