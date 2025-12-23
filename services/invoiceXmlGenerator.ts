/**
 * ====================================================
 * RENTHUBBER - GENERATORE XML FATTURAPA
 * ====================================================
 * Genera file XML conformi allo standard FatturaPA 1.2.2
 * per l'invio al Sistema di Interscambio (SDI) italiano
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TIPI E INTERFACCE
// =====================================================

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
  payment_method?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate?: number;
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
  regime_fiscale?: string; // Codice regime fiscale (es. RF01)
  pec_email?: string; // PEC per ricevere notifiche SDI
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Escape caratteri XML speciali
 */
function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formatta data in formato YYYY-MM-DD
 */
function formatDate(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determina il tipo documento:
 * TD01 = Fattura (privati/imprese italiane)
 * TD24 = Fattura differita (se applicabile)
 */
function getTipoDocumento(): string {
  return 'TD01'; // Fattura standard
}

/**
 * Determina codice natura IVA (se esente/non imponibile)
 * Lasciare vuoto se IVA ordinaria
 */
function getNaturaIVA(vatRate: number): string {
  // Se IVA = 0, potrebbe essere N2 (non soggetta) o N3 (non imponibile)
  // Per semplicità, se vatRate > 0 non serve Natura
  return vatRate === 0 ? 'N2' : '';
}

/**
 * Genera progressivo univoco per trasmissione
 * Formato: YYYYMMDD_NNNNN (es. 20250115_00001)
 */
function generateProgressivoInvio(invoiceNumber: string): string {
  const today = new Date();
  const dateStr = formatDate(today).replace(/-/g, '');
  // Estrai numero da invoice_number (es. H-2025-001 → 001)
  const numMatch = invoiceNumber.match(/\d+$/);
  const num = numMatch ? numMatch[0].padStart(5, '0') : '00001';
  return `${dateStr}_${num}`;
}

// =====================================================
// GENERATORE XML FATTURAPA
// =====================================================

/**
 * Genera XML FatturaPA 1.2.2 completo
 */
export async function generateFatturaPAXml(
  invoice: InvoiceData,
  companySettings: CompanySettings
): Promise<string> {
  
  const progressivoInvio = generateProgressivoInvio(invoice.invoice_number);
  const dataEmissione = formatDate(invoice.issued_at || invoice.created_at || new Date());
  
  // Dati Cedente (RentHubber)
  const cedentePartitaIva = companySettings.vat_number || '';
  const cedenteCodiceFiscale = companySettings.fiscal_code || cedentePartitaIva;
  const cedenteDenominazione = escapeXml(companySettings.company_name || 'RentHubber SRL');
  const cedenteIndirizzo = escapeXml(companySettings.address || '');
  const cedenteCap = companySettings.zip || '';
  const cedenteComune = escapeXml(companySettings.city || '');
  const cedenteProvincia = ''; // Da aggiungere in settings se serve
  const cedenteNazione = companySettings.country || 'IT';
  const cedenteRegimeFiscale = companySettings.regime_fiscale || 'RF01'; // RF01 = Regime ordinario
  
  // Dati Cessionario (Cliente)
  const isB2B = !!invoice.recipient_vat_number; // Se ha P.IVA è B2B
  const cessionarioIdFiscale = isB2B 
    ? (invoice.recipient_vat_number || invoice.recipient_fiscal_code || '')
    : (invoice.recipient_fiscal_code || '');
  const cessionarioIdPaese = invoice.recipient_country?.toUpperCase() || 'IT';
  const cessionarioDenominazione = escapeXml(invoice.recipient_name || 'Cliente');
  const cessionarioIndirizzo = escapeXml(invoice.recipient_address || '');
  const cessionarioCap = invoice.recipient_zip || '';
  const cessionarioComune = escapeXml(invoice.recipient_city || '');
  const cessionarioProvincia = ''; // Da aggiungere se disponibile
  const cessionarioNazione = cessionarioIdPaese;
  
  // Codice destinatario (7 caratteri per B2B, "0000000" per privati)
  const codiceDestinatario = isB2B ? '0000000' : '0000000'; // Default, può essere personalizzato
  const pecDestinatario = invoice.recipient_email || '';
  
  // Dati Fattura
  const numeroFattura = escapeXml(invoice.invoice_number);
  const tipoDocumento = getTipoDocumento();
  const divisa = 'EUR';
  
  // Totali
  const imponibile = invoice.subtotal.toFixed(2);
  const aliquotaIva = invoice.vat_rate.toFixed(2);
  const imposta = invoice.vat_amount.toFixed(2);
  const totaleDocumento = invoice.total.toFixed(2);
  const naturaIva = getNaturaIVA(invoice.vat_rate);
  
  // Line items
  const lineItems = invoice.line_items || [];
  
  // Modalità pagamento
  const modalitaPagamento = 'MP08'; // MP08 = Pagamento digitale (carta, wallet, ecc)
  
  // =====================================================
  // COSTRUZIONE XML
  // =====================================================
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" ';
  xml += 'xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" ';
  xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
  xml += 'xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 ';
  xml += 'http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">\n';
  
  // =====================================================
  // HEADER - FatturaElettronicaHeader
  // =====================================================
  xml += '  <FatturaElettronicaHeader>\n';
  
  // --- DatiTrasmissione ---
  xml += '    <DatiTrasmissione>\n';
  xml += '      <IdTrasmittente>\n';
  xml += `        <IdPaese>IT</IdPaese>\n`;
  xml += `        <IdCodice>${cedentePartitaIva}</IdCodice>\n`;
  xml += '      </IdTrasmittente>\n';
  xml += `      <ProgressivoInvio>${progressivoInvio}</ProgressivoInvio>\n`;
  xml += `      <FormatoTrasmissione>FPR12</FormatoTrasmissione>\n`;
  xml += `      <CodiceDestinatario>${codiceDestinatario}</CodiceDestinatario>\n`;
  if (pecDestinatario && isB2B) {
    xml += `      <PECDestinatario>${escapeXml(pecDestinatario)}</PECDestinatario>\n`;
  }
  xml += '    </DatiTrasmissione>\n';
  
  // --- CedentePrestatore (RentHubber) ---
  xml += '    <CedentePrestatore>\n';
  xml += '      <DatiAnagrafici>\n';
  xml += '        <IdFiscaleIVA>\n';
  xml += `          <IdPaese>IT</IdPaese>\n`;
  xml += `          <IdCodice>${cedentePartitaIva}</IdCodice>\n`;
  xml += '        </IdFiscaleIVA>\n';
  if (cedenteCodiceFiscale && cedenteCodiceFiscale !== cedentePartitaIva) {
    xml += `        <CodiceFiscale>${cedenteCodiceFiscale}</CodiceFiscale>\n`;
  }
  xml += '        <Anagrafica>\n';
  xml += `          <Denominazione>${cedenteDenominazione}</Denominazione>\n`;
  xml += '        </Anagrafica>\n';
  xml += `        <RegimeFiscale>${cedenteRegimeFiscale}</RegimeFiscale>\n`;
  xml += '      </DatiAnagrafici>\n';
  xml += '      <Sede>\n';
  xml += `        <Indirizzo>${cedenteIndirizzo}</Indirizzo>\n`;
  xml += `        <CAP>${cedenteCap}</CAP>\n`;
  xml += `        <Comune>${cedenteComune}</Comune>\n`;
  if (cedenteProvincia) {
    xml += `        <Provincia>${cedenteProvincia}</Provincia>\n`;
  }
  xml += `        <Nazione>${cedenteNazione}</Nazione>\n`;
  xml += '      </Sede>\n';
  xml += '    </CedentePrestatore>\n';
  
  // --- CessionarioCommittente (Cliente) ---
  xml += '    <CessionarioCommittente>\n';
  xml += '      <DatiAnagrafici>\n';
  if (isB2B) {
    xml += '        <IdFiscaleIVA>\n';
    xml += `          <IdPaese>${cessionarioIdPaese}</IdPaese>\n`;
    xml += `          <IdCodice>${cessionarioIdFiscale}</IdCodice>\n`;
    xml += '        </IdFiscaleIVA>\n';
  } else {
    xml += `        <CodiceFiscale>${cessionarioIdFiscale}</CodiceFiscale>\n`;
  }
  xml += '        <Anagrafica>\n';
  xml += `          <Denominazione>${cessionarioDenominazione}</Denominazione>\n`;
  xml += '        </Anagrafica>\n';
  xml += '      </DatiAnagrafici>\n';
  xml += '      <Sede>\n';
  xml += `        <Indirizzo>${cessionarioIndirizzo}</Indirizzo>\n`;
  xml += `        <CAP>${cessionarioCap}</CAP>\n`;
  xml += `        <Comune>${cessionarioComune}</Comune>\n`;
  if (cessionarioProvincia) {
    xml += `        <Provincia>${cessionarioProvincia}</Provincia>\n`;
  }
  xml += `        <Nazione>${cessionarioNazione}</Nazione>\n`;
  xml += '      </Sede>\n';
  xml += '    </CessionarioCommittente>\n';
  
  xml += '  </FatturaElettronicaHeader>\n';
  
  // =====================================================
  // BODY - FatturaElettronicaBody
  // =====================================================
  xml += '  <FatturaElettronicaBody>\n';
  
  // --- DatiGenerali ---
  xml += '    <DatiGenerali>\n';
  xml += '      <DatiGeneraliDocumento>\n';
  xml += `        <TipoDocumento>${tipoDocumento}</TipoDocumento>\n`;
  xml += `        <Divisa>${divisa}</Divisa>\n`;
  xml += `        <Data>${dataEmissione}</Data>\n`;
  xml += `        <Numero>${numeroFattura}</Numero>\n`;
  xml += `        <ImportoTotaleDocumento>${totaleDocumento}</ImportoTotaleDocumento>\n`;
  xml += '      </DatiGeneraliDocumento>\n';
  xml += '    </DatiGenerali>\n';
  
  // --- DatiBeniServizi ---
  xml += '    <DatiBeniServizi>\n';
  
  // Genera DettaglioLinee per ogni line item
  lineItems.forEach((item, index) => {
    const numeroLinea = index + 1;
    const descrizione = escapeXml(item.description);
    const quantita = item.quantity.toFixed(2);
    const prezzoUnitario = item.unitPrice.toFixed(2);
    const prezzoTotale = item.total.toFixed(2);
    const aliquotaLinea = (item.vatRate || invoice.vat_rate).toFixed(2);
    
    xml += '      <DettaglioLinee>\n';
    xml += `        <NumeroLinea>${numeroLinea}</NumeroLinea>\n`;
    xml += `        <Descrizione>${descrizione}</Descrizione>\n`;
    xml += `        <Quantita>${quantita}</Quantita>\n`;
    xml += `        <PrezzoUnitario>${prezzoUnitario}</PrezzoUnitario>\n`;
    xml += `        <PrezzoTotale>${prezzoTotale}</PrezzoTotale>\n`;
    xml += `        <AliquotaIVA>${aliquotaLinea}</AliquotaIVA>\n`;
    if (naturaIva) {
      xml += `        <Natura>${naturaIva}</Natura>\n`;
    }
    xml += '      </DettaglioLinee>\n';
  });
  
  // DatiRiepilogo - Riepilogo IVA
  xml += '      <DatiRiepilogo>\n';
  xml += `        <AliquotaIVA>${aliquotaIva}</AliquotaIVA>\n`;
  if (naturaIva) {
    xml += `        <Natura>${naturaIva}</Natura>\n`;
  }
  xml += `        <ImponibileImporto>${imponibile}</ImponibileImporto>\n`;
  xml += `        <Imposta>${imposta}</Imposta>\n`;
  xml += `        <EsigibilitaIVA>I</EsigibilitaIVA>\n`; // I = IVA ad esigibilità immediata
  xml += '      </DatiRiepilogo>\n';
  
  xml += '    </DatiBeniServizi>\n';
  
  // --- DatiPagamento ---
  xml += '    <DatiPagamento>\n';
  xml += '      <CondizioniPagamento>TP02</CondizioniPagamento>\n'; // TP02 = Pagamento completo
  xml += '      <DettaglioPagamento>\n';
  xml += `        <ModalitaPagamento>${modalitaPagamento}</ModalitaPagamento>\n`;
  xml += `        <ImportoPagamento>${totaleDocumento}</ImportoPagamento>\n`;
  xml += '      </DettaglioPagamento>\n';
  xml += '    </DatiPagamento>\n';
  
  xml += '  </FatturaElettronicaBody>\n';
  xml += '</p:FatturaElettronica>';
  
  return xml;
}

// =====================================================
// FUNZIONI DI ESPORTAZIONE
// =====================================================

/**
 * Carica impostazioni aziendali da Supabase
 */
async function loadCompanySettings(): Promise<CompanySettings> {
  try {
    const { data, error } = await supabase
      .from('invoice_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('Impostazioni aziendali non trovate');
      return {
        company_name: 'RentHubber SRL',
        email: 'info@renthubber.com',
      };
    }

    return {
      company_name: data.company_name || 'RentHubber SRL',
      vat_number: data.vat_number,
      fiscal_code: data.fiscal_code,
      address: data.address,
      city: data.city,
      zip: data.zip,
      country: data.country || 'Italia',
      email: data.email,
      phone: data.phone,
      regime_fiscale: data.regime_fiscale || 'RF01',
      pec_email: data.pec_email,
    };

  } catch (error) {
    console.error('Errore caricamento impostazioni:', error);
    return {
      company_name: 'RentHubber SRL',
      email: 'info@renthubber.com',
    };
  }
}

/**
 * Genera e scarica XML per singola fattura
 */
export async function downloadSingleInvoiceXml(invoice: InvoiceData): Promise<void> {
  try {
    const companySettings = await loadCompanySettings();
    const xml = await generateFatturaPAXml(invoice, companySettings);
    
    // Crea nome file sicuro
    const safeFileName = invoice.invoice_number.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${safeFileName}.xml`;
    
    // Download file
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ XML FatturaPA scaricato:', fileName);
  } catch (error) {
    console.error('Errore generazione XML:', error);
    throw error;
  }
}

/**
 * Genera ZIP con XML multipli
 * Richiede la libreria JSZip (npm install jszip)
 */
export async function downloadMultipleInvoicesXml(invoices: InvoiceData[]): Promise<void> {
  try {
    // Importa JSZip dinamicamente
    const JSZip = (await import('jszip')).default;
    
    const companySettings = await loadCompanySettings();
    const zip = new JSZip();
    
    // Genera XML per ogni fattura
    for (const invoice of invoices) {
      const xml = await generateFatturaPAXml(invoice, companySettings);
      const safeFileName = invoice.invoice_number.replace(/[^a-zA-Z0-9-_]/g, '_');
      zip.file(`${safeFileName}.xml`, xml);
    }
    
    // Genera ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Download ZIP
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fatture_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ ZIP con ${invoices.length} fatture XML scaricato`);
  } catch (error) {
    console.error('Errore generazione ZIP:', error);
    throw error;
  }
}

/**
 * Esporta CSV per importazione in software esterni
 */
export async function exportInvoicesToCsv(invoices: InvoiceData[]): Promise<void> {
  try {
    // Header CSV
    let csv = 'Numero Fattura,Data Emissione,Cliente,P.IVA/CF,Imponibile,IVA,Totale\n';
    
    // Righe
    invoices.forEach(inv => {
      const numero = inv.invoice_number;
      const data = formatDate(inv.issued_at || inv.created_at || new Date());
      const cliente = inv.recipient_name.replace(/"/g, '""'); // Escape virgolette
      const piva = inv.recipient_vat_number || inv.recipient_fiscal_code || '';
      const imponibile = inv.subtotal.toFixed(2);
      const iva = inv.vat_amount.toFixed(2);
      const totale = inv.total.toFixed(2);
      
      csv += `"${numero}","${data}","${cliente}","${piva}",${imponibile},${iva},${totale}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fatture_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ CSV esportato');
  } catch (error) {
    console.error('Errore export CSV:', error);
    throw error;
  }
}