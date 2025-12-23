/**
 * ====================================================
 * RENTHUBBER - EXPORT FATTURE XML FATTURAPA
 * ====================================================
 * Componente per esportare fatture in formato XML FatturaPA
 * da Admin Dashboard
 */

import React, { useState } from 'react';
import { Download, FileText, Package, CheckCircle } from 'lucide-react';
import { 
  downloadSingleInvoiceXml, 
  downloadMultipleInvoicesXml,
  exportInvoicesToCsv 
} from '../services/invoiceXmlGenerator';

interface Invoice {
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
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  issued_at?: string;
  created_at?: string;
  line_items?: any[];
}

interface InvoiceXmlExportProps {
  invoices: Invoice[];
}

export const InvoiceXmlExport: React.FC<InvoiceXmlExportProps> = ({ invoices }) => {
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'renter' | 'hubber'>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // ✅ FILTRA SOLO FATTURE B2B (con P.IVA)
  const b2bInvoices = invoices.filter(inv => 
    inv.recipient_vat_number && inv.recipient_vat_number.trim() !== ''
  );

  // Filtra fatture B2B con filtri aggiuntivi
  const filteredInvoices = b2bInvoices.filter(inv => {
    if (filterType !== 'all' && inv.invoice_type !== filterType) return false;
    if (filterYear !== 'all') {
      const year = new Date(inv.issued_at || inv.created_at || '').getFullYear();
      if (year.toString() !== filterYear) return false;
    }
    return true;
  });

  // Statistiche B2B vs B2C
  const b2cInvoices = invoices.filter(inv => 
    !inv.recipient_vat_number || inv.recipient_vat_number.trim() === ''
  );
  const totalB2B = b2bInvoices.length;
  const totalB2C = b2cInvoices.length;

  // Anni disponibili
  const availableYears = Array.from(
    new Set(
      invoices.map(inv => 
        new Date(inv.issued_at || inv.created_at || '').getFullYear()
      )
    )
  ).sort((a, b) => b - a);

  // Toggle selezione singola
  const toggleInvoice = (id: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvoices(newSelected);
  };

  // Seleziona/Deseleziona tutto
  const toggleAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    }
  };

  // Export XML multipli in ZIP
  const handleExportZip = async () => {
    if (selectedInvoices.size === 0) {
      alert('Seleziona almeno una fattura');
      return;
    }

    setIsExporting(true);
    try {
      const invoicesToExport = invoices.filter(inv => selectedInvoices.has(inv.id));
      await downloadMultipleInvoicesXml(invoicesToExport);
      alert(`✅ Esportate ${invoicesToExport.length} fatture XML in ZIP`);
    } catch (error) {
      console.error('Errore export:', error);
      alert('❌ Errore durante l\'esportazione');
    } finally {
      setIsExporting(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    if (selectedInvoices.size === 0) {
      alert('Seleziona almeno una fattura');
      return;
    }

    setIsExporting(true);
    try {
      const invoicesToExport = invoices.filter(inv => selectedInvoices.has(inv.id));
      await exportInvoicesToCsv(invoicesToExport);
      alert(`✅ Esportate ${invoicesToExport.length} fatture in CSV`);
    } catch (error) {
      console.error('Errore export:', error);
      alert('❌ Errore durante l\'esportazione');
    } finally {
      setIsExporting(false);
    }
  };

  // Export singolo XML
  const handleExportSingle = async (invoice: Invoice) => {
    setIsExporting(true);
    try {
      await downloadSingleInvoiceXml(invoice);
      alert(`✅ XML generato per ${invoice.invoice_number}`);
    } catch (error) {
      console.error('Errore export:', error);
      alert('❌ Errore durante l\'esportazione');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand" />
              Esporta XML FatturaPA
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Genera file XML conformi allo standard FatturaPA per l'invio al Sistema di Interscambio
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2">📌 Fatture B2B (Fatturazione Elettronica Obbligatoria)</h3>
          <div className="space-y-2">
            <p className="text-sm text-blue-800">
              Vengono mostrate solo le fatture emesse a <strong>clienti con P.IVA</strong> (società, ditte individuali, associazioni).
            </p>
            <div className="flex gap-4 text-sm">
              <div className="bg-blue-100 px-3 py-1 rounded">
                <strong>B2B (con P.IVA):</strong> {totalB2B} fatture - Richiedono XML FatturaPA
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded text-gray-700">
                <strong>B2C (privati):</strong> {totalB2C} fatture - NON richiedono XML
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              ℹ️ Le fatture a privati (solo Codice Fiscale) non richiedono XML FatturaPA e non vengono mostrate qui.
            </p>
          </div>
        </div>

        {/* Come usare */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-900 mb-2">🚀 Come usare l'export XML</h3>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Seleziona le fatture B2B da esportare usando le checkbox</li>
            <li>Clicca "Esporta ZIP" per scaricare tutti gli XML in un file ZIP</li>
            <li>Carica il ZIP o i singoli XML su Fatture in Cloud, Aruba, o altri software</li>
            <li>Oppure esporta in CSV per importare i dati in Excel/fogli di calcolo</li>
          </ul>
        </div>

        {/* Filtri */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Tutte</option>
              <option value="renter">Renter (H-)</option>
              <option value="hubber">Hubber (R-)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anno</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Tutti</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleExportZip}
            disabled={isExporting || selectedInvoices.size === 0}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Package className="w-4 h-4" />
            Esporta ZIP ({selectedInvoices.size})
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting || selectedInvoices.size === 0}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Esporta CSV ({selectedInvoices.size})
          </button>

          <button
            onClick={toggleAll}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {selectedInvoices.size === filteredInvoices.length ? 'Deseleziona' : 'Seleziona'} Tutto
          </button>
        </div>
      </div>

      {/* Lista fatture */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Fatture B2B disponibili ({filteredInvoices.length} di {totalB2B})
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Mostrando solo fatture con P.IVA (società, ditte individuali, associazioni)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Numero</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">P.IVA/CF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Data</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Totale</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">XML</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Nessuna fattura trovata con i filtri selezionati
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={() => toggleInvoice(invoice.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.invoice_type === 'renter' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {invoice.invoice_type === 'renter' ? 'Renter' : 'Hubber'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          B2B
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {invoice.recipient_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.recipient_vat_number || invoice.recipient_fiscal_code || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(invoice.issued_at || invoice.created_at || '').toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      € {invoice.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleExportSingle(invoice)}
                        disabled={isExporting}
                        className="text-brand hover:text-brand-dark disabled:opacity-50 transition-colors"
                        title="Scarica XML"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Nota importante</h3>
        <p className="text-sm text-yellow-800 mb-2">
          Gli XML generati sono conformi allo standard FatturaPA 1.2.2 ma <strong>NON sono firmati digitalmente</strong>. 
          Prima dell'invio al SDI, dovrai:
        </p>
        <ol className="text-sm text-yellow-800 list-decimal list-inside space-y-1 ml-4">
          <li>Caricare gli XML su un software di fatturazione (Fatture in Cloud, Aruba, ecc.)</li>
          <li>Il software si occuperà della firma digitale e dell'invio al SDI</li>
          <li>In alternativa, puoi firmare manualmente con una firma digitale remota</li>
        </ol>
        <div className="mt-3 pt-3 border-t border-yellow-300">
          <p className="text-sm text-yellow-800">
            <strong>📋 Fatture B2C (privati):</strong> Le fatture emesse a privati (solo CF, senza P.IVA) 
            non richiedono XML FatturaPA e vengono gestite con PDF standard.
          </p>
        </div>
      </div>
    </div>
  );
};