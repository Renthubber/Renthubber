import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from "../services/supabaseClient";
import { User } from '../types';

type UserTypeOption = 'privato' | 'ditta_individuale' | 'societa' | 'associazione';

interface BillingData {
  companyName: string;
  fiscalCode: string;
  vatNumber: string;
  pec: string;
  sdiCode: string;
  billingAddress: string;
  billingCity: string;
  billingZip: string;
  billingProvince: string;
  billingCountry: string;
}

interface BillingDataSectionProps {
  user: User;
  userType: UserTypeOption;
}

export const BillingDataSection: React.FC<BillingDataSectionProps> = ({
  user,
  userType,
}) => {
  // State per i dati di fatturazione
  const [billingData, setBillingData] = useState<BillingData>({
    companyName: '',
    fiscalCode: '',
    vatNumber: '',
    pec: '',
    sdiCode: '',
    billingAddress: '',
    billingCity: '',
    billingZip: '',
    billingProvince: '',
    billingCountry: 'Italia',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<BillingData>({ ...billingData });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carica dati da Supabase all'avvio
  useEffect(() => {
    const loadBillingData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            company_name,
            fiscal_code,
            vat_number,
            pec,
            sdi_code,
            billing_address,
            billing_city,
            billing_zip,
            billing_province,
            billing_country
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Errore caricamento dati fatturazione:', error);
          return;
        }

        if (data) {
          setBillingData({
            companyName: data.company_name || '',
            fiscalCode: data.fiscal_code || '',
            vatNumber: data.vat_number || '',
            pec: data.pec || '',
            sdiCode: data.sdi_code || '',
            billingAddress: data.billing_address || '',
            billingCity: data.billing_city || '',
            billingZip: data.billing_zip || '',
            billingProvince: data.billing_province || '',
            billingCountry: data.billing_country || 'Italia',
          });
        }
      } catch (err) {
        console.error('Errore caricamento billing:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBillingData();
  }, [user.id]);

  // Helper per determinare quali campi mostrare
  const getFieldsConfig = () => {
    return {
      showCompanyName: userType === 'societa' || userType === 'associazione',
      showFiscalCode: true,
      showVatNumber: userType !== 'privato',
      showPec: userType !== 'privato',
      showSdiCode: userType !== 'privato',
      companyNameLabel: userType === 'associazione' ? 'Denominazione' : 'Ragione Sociale',
      fiscalCodeLabel:
        userType === 'privato' || userType === 'ditta_individuale'
          ? 'Codice Fiscale'
          : 'Codice Fiscale Azienda',
      vatRequired: userType === 'ditta_individuale' || userType === 'societa',
      pecRequired: userType === 'ditta_individuale' || userType === 'societa',
      sdiRequired: userType === 'ditta_individuale' || userType === 'societa',
    };
  };

  const config = getFieldsConfig();

  // Apri modale
  const openModal = () => {
    setEditForm({ ...billingData });
    setIsModalOpen(true);
  };

  // Salva dati
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          company_name: editForm.companyName || null,
          fiscal_code: editForm.fiscalCode || null,
          vat_number: editForm.vatNumber || null,
          pec: editForm.pec || null,
          sdi_code: editForm.sdiCode || null,
          billing_address: editForm.billingAddress || null,
          billing_city: editForm.billingCity || null,
          billing_zip: editForm.billingZip || null,
          billing_province: editForm.billingProvince || null,
          billing_country: editForm.billingCountry || 'Italia',
        })
        .eq('id', user.id);

      if (error) {
        console.error('Errore salvataggio dati fatturazione:', error);
        alert('Errore nel salvataggio. Riprova.');
        return;
      }

      setBillingData({ ...editForm });
      setIsModalOpen(false);
      
    } catch (err) {
      console.error('Errore salvataggio billing:', err);
      alert('Si è verificato un errore. Riprova.');
    } finally {
      setIsSaving(false);
    }
  };

  // Render loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Render card
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              Dati di fatturazione
            </h3>
            <p className="text-sm text-gray-500">
              Informazioni fiscali per la generazione delle fatture.
            </p>
          </div>
          <button
            onClick={openModal}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            {billingData.fiscalCode ? 'Modifica' : 'Inserisci dati'}
          </button>
        </div>

        {/* Se non ci sono dati inseriti */}
        {!billingData.fiscalCode && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-amber-800">
              Dati di fatturazione non inseriti
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Inserisci i tuoi dati fiscali per ricevere fatture corrette.
            </p>
          </div>
        )}

        {/* Se ci sono dati inseriti */}
        {billingData.fiscalCode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {/* Ragione Sociale (solo per società/associazioni) */}
            {(userType === 'societa' || userType === 'associazione') &&
              billingData.companyName && (
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                    {userType === 'associazione' ? 'Denominazione' : 'Ragione Sociale'}
                  </p>
                  <p className="font-medium text-gray-800">{billingData.companyName}</p>
                </div>
              )}

            {/* Codice Fiscale */}
            <div>
              <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                Codice Fiscale
              </p>
              <p className="font-medium text-gray-800">{billingData.fiscalCode}</p>
            </div>

            {/* Partita IVA (non per privati) */}
            {userType !== 'privato' && billingData.vatNumber && (
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                  Partita IVA
                </p>
                <p className="font-medium text-gray-800">{billingData.vatNumber}</p>
              </div>
            )}

            {/* PEC (non per privati) */}
            {userType !== 'privato' && billingData.pec && (
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold mb-1">PEC</p>
                <p className="font-medium text-gray-800">{billingData.pec}</p>
              </div>
            )}

            {/* Codice SDI (non per privati) */}
            {userType !== 'privato' && billingData.sdiCode && (
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                  Codice SDI
                </p>
                <p className="font-medium text-gray-800">{billingData.sdiCode}</p>
              </div>
            )}

            {/* Indirizzo completo */}
            {billingData.billingAddress && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                  Indirizzo di fatturazione
                </p>
                <p className="font-medium text-gray-800">
                  {billingData.billingAddress}
                  {billingData.billingZip && `, ${billingData.billingZip}`}
                  {billingData.billingCity && ` ${billingData.billingCity}`}
                  {billingData.billingProvince && ` (${billingData.billingProvince})`}
                  {billingData.billingCountry &&
                    billingData.billingCountry !== 'Italia' &&
                    ` - ${billingData.billingCountry}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => !isSaving && setIsModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Dati di fatturazione
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Inserisci i dati fiscali per la generazione delle fatture.
              {userType === 'privato' && ' Come privato, ti serve solo il Codice Fiscale.'}
            </p>

            {/* Badge tipo utente */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Tipo utente selezionato:</p>
              <p className="font-semibold text-gray-800">
                {userType === 'privato' && 'Privato'}
                {userType === 'ditta_individuale' && 'Ditta Individuale'}
                {userType === 'societa' && 'Società (SRL, SNC, SPA, ecc.)'}
                {userType === 'associazione' && 'Associazione'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Puoi cambiarlo nella sezione "Modifica dati profilo"
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Ragione Sociale / Denominazione */}
              {config.showCompanyName && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    {config.companyNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    value={editForm.companyName}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    placeholder={
                      userType === 'associazione'
                        ? 'Es: ASD Sport Club'
                        : 'Es: Mario Rossi SRL'
                    }
                  />
                </div>
              )}

              {/* Codice Fiscale */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  {config.fiscalCodeLabel} *
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand uppercase"
                  value={editForm.fiscalCode}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      fiscalCode: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder={
                    userType === 'privato' ? 'RSSMRA80A01H501U' : '12345678901'
                  }
                />
              </div>

              {/* Partita IVA */}
              {config.showVatNumber && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Partita IVA {config.vatRequired && '*'}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      IT
                    </span>
                    <input
                      type="text"
                      required={config.vatRequired}
                      maxLength={11}
                      className="w-full rounded-r-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                      value={editForm.vatNumber.replace(/^IT/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setEditForm((prev) => ({
                          ...prev,
                          vatNumber: val ? `IT${val}` : '',
                        }));
                      }}
                      placeholder="12345678901"
                    />
                  </div>
                </div>
              )}

              {/* PEC */}
              {config.showPec && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    PEC {config.pecRequired && '*'}
                  </label>
                  <input
                    type="email"
                    required={config.pecRequired}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    value={editForm.pec}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        pec: e.target.value.toLowerCase(),
                      }))
                    }
                    placeholder="azienda@pec.it"
                  />
                </div>
              )}

              {/* Codice SDI */}
              {config.showSdiCode && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Codice SDI {config.sdiRequired && '*'}
                  </label>
                  <input
                    type="text"
                    required={config.sdiRequired}
                    maxLength={7}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand uppercase"
                    value={editForm.sdiCode}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        sdiCode: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="XXXXXXX oppure 0000000"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Usa 0000000 se ricevi fatture via PEC
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Indirizzo di fatturazione
                </p>
              </div>

              {/* Indirizzo */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Via e numero civico *
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  value={editForm.billingAddress}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, billingAddress: e.target.value }))
                  }
                  placeholder="Via Roma, 1"
                />
              </div>

              {/* CAP + Città */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    CAP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    value={editForm.billingZip}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        billingZip: e.target.value.replace(/\D/g, '').slice(0, 5),
                      }))
                    }
                    placeholder="00100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Città *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    value={editForm.billingCity}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, billingCity: e.target.value }))
                    }
                    placeholder="Roma"
                  />
                </div>
              </div>

              {/* Provincia + Paese */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand uppercase"
                    value={editForm.billingProvince}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        billingProvince: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="RM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Paese
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    value={editForm.billingCountry}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, billingCountry: e.target.value }))
                    }
                    placeholder="Italia"
                  />
                </div>
              </div>

              {/* Bottoni */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => !isSaving && setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-brand hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvataggio...' : 'Salva dati fatturazione'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};