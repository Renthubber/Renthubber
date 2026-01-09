/**
 * ====================================================
 * RENTHUBBER - GENERATORE PDF FATTURE
 * ====================================================
 * Genera fatture PDF professionali con logo e stile pulito
 * Utilizza jsPDF per la generazione client-side
 */

import jsPDF from 'jspdf';
import { supabase } from "../services/supabaseClient";

// Tipi
interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_type: 'renter' | 'hubber';
  recipient_name: string;
  recipient_email?: string;
  recipient_address?: string;
  recipient_city?: string;
  recipient_zip?: string;
  recipient_country?: string;
  recipient_vat_number?: string;
  recipient_fiscal_code?: string;
  booking_id?: string;
  period_start?: string;
  period_end?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  description?: string;
  line_items?: LineItem[];
  issued_at?: string;
  created_at?: string;
  due_date?: string;
  notes?: string;
  listing_title?: string;
  listing_id?: string;
  listing_price?: number; // Prezzo base noleggio
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CompanySettings {
  company_name: string;
  vat_number?: string;
  fiscal_code?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
  iban?: string;
  bank_name?: string;
  logo_url?: string;
}

// Colori brand Renthubber
const COLORS = {
  primary: '#0D414B',      // Brand scuro
  secondary: '#E9C46A',    // Accent giallo
  text: '#1F2937',         // Testo principale
  textLight: '#6B7280',    // Testo secondario
  border: '#E5E7EB',       // Bordi
  background: '#F9FAFB',   // Sfondo chiaro
};

/**
 * Genera PDF fattura professionale
 */
export async function generateInvoicePDF(
  invoice: InvoiceData,
  companySettings: CompanySettings,
  logoBase64?: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // ============================
  // HEADER - Logo e dati azienda
  // ============================
  
  // Logo (se disponibile)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, yPos, 50, 15);
      yPos += 20;
    } catch (e) {
      console.warn('Errore caricamento logo:', e);
    }
  } else {
    // Testo logo fallback
    doc.setFontSize(24);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Renthubber', margin, yPos + 10);
    yPos += 20;
  }

  // Dati azienda (colonna sinistra)
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  
  const companyLines = [
    companySettings.company_name || 'Renthubber SRL',
    companySettings.address || '',
    `${companySettings.zip || ''} ${companySettings.city || ''} ${companySettings.country || ''}`.trim(),
    companySettings.vat_number ? `P.IVA: ${companySettings.vat_number}` : '',
    companySettings.fiscal_code ? `C.F.: ${companySettings.fiscal_code}` : '',
    companySettings.email || '',
  ].filter(Boolean);

  companyLines.forEach((line, i) => {
    doc.text(line, margin, yPos + (i * 4));
  });

  // ============================
  // DATI FATTURA (colonna destra)
  // ============================
  const rightCol = pageWidth - margin - 60;
  
  doc.setFontSize(18);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('FATTURA', rightCol, yPos);
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  
  const invoiceDate = invoice.issued_at || invoice.created_at 
    ? new Date(invoice.issued_at || invoice.created_at!).toLocaleDateString('it-IT')
    : new Date().toLocaleDateString('it-IT');

  doc.text(`N. ${invoice.invoice_number}`, rightCol, yPos + 8);
  doc.text(`Data: ${invoiceDate}`, rightCol, yPos + 14);
  
  if (invoice.due_date) {
    const dueDate = new Date(invoice.due_date).toLocaleDateString('it-IT');
    doc.text(`Scadenza: ${dueDate}`, rightCol, yPos + 20);
  }

  yPos += 35;

  // Linea separatrice
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ============================
  // DESTINATARIO
  // ============================
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textLight);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATARIO', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  
  const recipientLines = [
    invoice.recipient_name || 'N/A',
    invoice.recipient_address || '',
    `${invoice.recipient_zip || ''} ${invoice.recipient_city || ''} ${invoice.recipient_country || ''}`.trim(),
    invoice.recipient_vat_number ? `P.IVA: ${invoice.recipient_vat_number}` : '',
    invoice.recipient_fiscal_code ? `C.F.: ${invoice.recipient_fiscal_code}` : '',
    invoice.recipient_email || '',
  ].filter(Boolean);

  recipientLines.forEach((line, i) => {
    doc.text(line, margin, yPos + (i * 5));
  });

  yPos += recipientLines.length * 5 + 15;

  // ============================
  // BOX DETTAGLIO PRENOTAZIONE
  // ============================
  if (invoice.booking_id && invoice.listing_title) {
    // Box con sfondo
    doc.setFillColor(245, 247, 250); // Grigio chiaro
    doc.setDrawColor(COLORS.border);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 2, 2, 'FD');
    
    yPos += 5;
    
    // Titolo sezione
    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('DETTAGLIO PRENOTAZIONE', margin + 5, yPos + 5);
    
    yPos += 10;
    
    // Dati prenotazione
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    
    // Riga 1: Prenotazione e Oggetto
    doc.setFont('helvetica', 'bold');
    doc.text(`Prenotazione:`, margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoice.booking_id.substring(0, 8).toUpperCase()}`, margin + 35, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Oggetto:`, margin + 80, yPos);
    doc.setFont('helvetica', 'normal');
    const titleText = invoice.listing_title.length > 30 ? invoice.listing_title.substring(0, 27) + '...' : invoice.listing_title;
    doc.text(titleText, margin + 100, yPos);
    
    yPos += 5;
    
    // Riga 2: Periodo e Importo
    if (invoice.period_start && invoice.period_end) {
      const periodStart = new Date(invoice.period_start).toLocaleDateString('it-IT');
      const periodEnd = new Date(invoice.period_end).toLocaleDateString('it-IT');
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Periodo:`, margin + 5, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${periodStart} al ${periodEnd}`, margin + 35, yPos);
    }
    
    if (invoice.listing_price) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Importo noleggio:`, margin + 80, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`€ ${invoice.listing_price.toFixed(2)}`, margin + 115, yPos);
    }
    
    yPos += 15;
  }

  // ============================
  // COMMISSIONI RENTHUBBER
  // ============================
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMISSIONI RENTHUBBER', margin, yPos);
  yPos += 8;

  // ============================
  // TABELLA SEMPLIFICATA
  // ============================
  
  // Header tabella
  doc.setFillColor(COLORS.primary);
  doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  
  const colWidths = {
    description: 130,
    total: 40,
  };
  
  let xPos = margin + 3;
  doc.text('Descrizione', xPos, yPos + 7);
  xPos += colWidths.description;
  doc.text('Importo', xPos, yPos + 7);

  yPos += 12;

  // Righe dettaglio
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);

  // Se ci sono line_items, usali
  const items = invoice.line_items && invoice.line_items.length > 0 
    ? invoice.line_items 
    : [{
        description: invoice.description || `Commissione servizio Renthubber`,
        quantity: 1,
        unitPrice: invoice.subtotal,
        total: invoice.subtotal,
      }];

  items.forEach((item, index) => {
    // Sfondo alternato
    if (index % 2 === 0) {
      doc.setFillColor(COLORS.background);
      doc.rect(margin, yPos - 2, pageWidth - margin * 2, 8, 'F');
    }

    xPos = margin + 3;
    
    // Descrizione
    const descText = item.description.length > 70 
      ? item.description.substring(0, 67) + '...' 
      : item.description;
    doc.text(descText, xPos, yPos + 4);
    xPos += colWidths.description;
    
    // Totale riga (allineato a destra)
    doc.text(`€ ${(item.total || 0).toFixed(2)}`, xPos + colWidths.total - 5, yPos + 4, { align: 'right' });

    yPos += 8;
  });

  yPos += 5;

  // Linea sopra totali
  doc.setDrawColor(COLORS.border);
  doc.line(pageWidth - margin - 80, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ============================
  // TOTALI
  // ============================
  const totalsX = pageWidth - margin - 80;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Imponibile
  doc.setTextColor(COLORS.textLight);
  doc.text('Imponibile:', totalsX, yPos);
  doc.setTextColor(COLORS.text);
  doc.text(`€ ${invoice.subtotal.toFixed(2)}`, pageWidth - margin - 25, yPos, { align: 'right' });
  yPos += 6;

  // IVA
  doc.setTextColor(COLORS.textLight);
  doc.text(`IVA (${invoice.vat_rate}%):`, totalsX, yPos);
  doc.setTextColor(COLORS.text);
  doc.text(`€ ${invoice.vat_amount.toFixed(2)}`, pageWidth - margin - 25, yPos, { align: 'right' });
  yPos += 8;

  // Totale
  doc.setFillColor(COLORS.primary);
  doc.rect(totalsX - 5, yPos - 4, 85, 12, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#FFFFFF');
  doc.text('TOTALE:', totalsX, yPos + 4);
  doc.text(`€ ${invoice.total.toFixed(2)}`, pageWidth - margin - 25, yPos + 4, { align: 'right' });

  yPos += 25;

  // ============================
  // NOTE (solo per hubber)
  // ============================
  if (invoice.invoice_type === 'hubber' && invoice.notes) {
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text('Note:', margin, yPos);
    yPos += 5;
    doc.setTextColor(COLORS.text);
    doc.text(invoice.notes, margin, yPos);
    yPos += 10;
  }

  // ============================
  // FOOTER
  // ============================
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  
  const footerText = `${companySettings.company_name || 'Renthubber - Amalis Group s.r.l'} - Documento generato automaticamente`;
  doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`Pagina 1 di 1`, pageWidth / 2, footerY + 5, { align: 'center' });

  // Genera blob
  return doc.output('blob');
}

/**
 * Carica PDF su Supabase Storage e aggiorna fattura con URL
 */
export async function uploadInvoicePDF(
  invoiceId: string,
  invoiceNumber: string,
  pdfBlob: Blob
): Promise<string | null> {
  try {
    // Crea nome file sicuro
    const safeFileName = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `invoices/${safeFileName}.pdf`;

    // Upload su Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true, // Sovrascrivi se esiste
      });

    if (uploadError) {
      console.error('Errore upload PDF:', uploadError);
      throw uploadError;
    }

    // Ottieni URL pubblico
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) {
      throw new Error('Impossibile ottenere URL pubblico');
    }

    // Aggiorna fattura con URL PDF
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        pdf_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Errore aggiornamento fattura:', updateError);
      throw updateError;
    }

    console.log('✅ PDF fattura generato e salvato:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Errore generazione/upload PDF:', error);
    return null;
  }
}

/**
 * Carica impostazioni aziendali da Supabase
 */
export async function loadCompanySettings(): Promise<CompanySettings> {
  try {
    const { data, error } = await supabase
      .from('invoice_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('Impostazioni aziendali non trovate, uso default');
      return {
        company_name: 'Renthubber SRL',
        email: 'info@renthubber.com',
      };
    }

    return {
      company_name: data.company_name || 'Renthubber SRL',
      vat_number: data.vat_number,
      fiscal_code: data.fiscal_code,
      address: data.address,
      city: data.city,
      zip: data.zip,
      country: data.country || 'Italia',
      email: data.email,
      phone: data.phone,
      iban: data.iban,
      bank_name: data.bank_name,
      logo_url: data.logo_url,
    };

  } catch (error) {
    console.error('Errore caricamento impostazioni:', error);
    return {
      company_name: 'Renthubber SRL',
      email: 'info@renthubber.com',
    };
  }
}

export async function loadLogoBase64(): Promise<string | undefined> {
  try {
    // Prova da Supabase Storage
    const { data } = supabase.storage
      .from('assets')
      .getPublicUrl('logo-renthubber.png');
    
    if (data?.publicUrl) {
      const response = await fetch(data.publicUrl);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch (e) {
    console.warn('Logo non trovato in Supabase Storage');
  }

  return undefined;
}

/**
 * Funzione principale per generare e salvare PDF fattura
 */
export async function generateAndSaveInvoicePDF(invoice: InvoiceData): Promise<string | null> {
  try {
    // 1. Carica impostazioni aziendali
    const companySettings = await loadCompanySettings();
    
    // 2. Carica logo
    const logoBase64 = await loadLogoBase64();
    
    // 3. Genera PDF
    const pdfBlob = await generateInvoicePDF(invoice, companySettings, logoBase64);
    
    // 4. Carica su Storage e aggiorna DB
    const pdfUrl = await uploadInvoicePDF(invoice.id, invoice.invoice_number, pdfBlob);
    
    return pdfUrl;
  } catch (error) {
    console.error('Errore generazione PDF completa:', error);
    return null;
  }
}

/**
 * Scarica PDF direttamente (senza salvare su server)
 */
export async function downloadInvoicePDF(invoice: InvoiceData): Promise<void> {
  try {
    const companySettings = await loadCompanySettings();
    const logoBase64 = await loadLogoBase64();
    const pdfBlob = await generateInvoicePDF(invoice, companySettings, logoBase64);
    
    // Crea link download
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fattura_${invoice.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ PDF scaricato:', invoice.invoice_number);
  } catch (error) {
    console.error('Errore download PDF:', error);
    throw error;
  }
}