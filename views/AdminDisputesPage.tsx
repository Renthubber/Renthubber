import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

type AdminDisputeStatus = "open" | "in_review" | "resolved" | "rejected";

interface AdminDispute {
  id: string;
  disputeId: string;
  bookingId: string | null;
  reporterName: string | null;
  againstUserName: string | null;
  reason: string | null;
  details: string | null;
  evidenceImages: string[]; // sempre array
  refundAmount: number | null;
  refundDocumentName: string | null;
  status: AdminDisputeStatus;
  createdAt: string;
}

// CORRETTO (senza React.FC)
interface AdminDisputesPageProps {
  onManageDispute: (disputeId: string) => Promise<void>;
}

export const AdminDisputesPage = ({ onManageDispute }: AdminDisputesPageProps) => {
const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"active" | "resolved">("active");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "yesterday" | "week" | "month" | "year">("all");

  useEffect(() => {
  loadDisputes();

  // Subscription real-time per aggiornamenti dispute
  const channel = supabase
    .channel('admin_disputes_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'disputes'
      },
      (payload) => {
        console.log('Dispute aggiornata:', payload);
        // Ricarica le dispute quando cambia qualcosa
        loadDisputes();
      }
    )
    .subscribe();

  // Cleanup alla dismissione del componente
  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const loadDisputes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Errore caricamento dispute:", error);
      setLoading(false);
      return;
    }

    const mapped: AdminDispute[] = (data || []).map((d: any) => {
      // normalizza immagini prove
      let images: string[] = [];
      if (Array.isArray(d.evidence_images)) {
        images = d.evidence_images;
      } else if (typeof d.evidence_images === "string") {
        try {
          const parsed = JSON.parse(d.evidence_images);
          if (Array.isArray(parsed)) images = parsed;
        } catch {
          images = [];
        }
      }

      // normalizza status (se nel DB fosse "dismissed", lo mappiamo a "rejected")
      let status: AdminDisputeStatus = "open";
      if (d.status === "open" || d.status === "in_review" || d.status === "resolved") {
        status = d.status;
      } else if (d.status === "dismissed" || d.status === "rejected") {
        status = "rejected";
      }

      return {
        id: d.id,
        disputeId: d.dispute_id || d.id,
        bookingId: d.booking_id ?? null,
        reporterName: d.reporter_name ?? null,
        againstUserName: d.against_user_name ?? null,
        reason: d.reason ?? null,
        details: d.details ?? null,
        evidenceImages: images,
        refundAmount:
          typeof d.refund_amount === "number"
            ? d.refund_amount
            : d.refund_amount
            ? Number(d.refund_amount)
            : null,
        refundDocumentName: d.refund_document_name ?? null,
        status,
        createdAt: d.created_at,
      };
    });

    setDisputes(mapped);
    setLoading(false);
  };

  // Filtra per data
  const filterByTime = (dispute: AdminDispute) => {
    if (timeFilter === "all") return true;
    
    const createdDate = new Date(dispute.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (timeFilter) {
      case "today":
        return createdDate >= today;
      case "yesterday":
        return createdDate >= yesterday && createdDate < today;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate >= weekAgo;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return createdDate >= monthAgo;
      case "year":
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return createdDate >= yearAgo;
      default:
        return true;
    }
  };

  // Filtra per stato in base al tab
  const filterByStatus = (dispute: AdminDispute) => {
    switch (statusTab) {
      case "active":
        return dispute.status === "open" || dispute.status === "in_review";
      case "resolved":
        return dispute.status === "resolved" || dispute.status === "rejected";
      default:
        return true;
    }
  };

  const filtered = disputes.filter(d => filterByStatus(d) && filterByTime(d));

  // Contatori per i tab
  const activeCount = disputes.filter(d => d.status === "open" || d.status === "in_review").length;
  const resolvedCount = disputes.filter(d => d.status === "resolved" || d.status === "rejected").length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestione Contestazioni</h1>
        
        {/* TAB A DESTRA */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatusTab("active")}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
              statusTab === "active"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Attive
            {activeCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusTab("resolved")}
            className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
              statusTab === "resolved"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Risolte
            {resolvedCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {resolvedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FILTRI TEMPORALI */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { label: "Tutte", value: "all" as const },
          { label: "Oggi", value: "today" as const },
          { label: "Ieri", value: "yesterday" as const },
          { label: "Ultima settimana", value: "week" as const },
          { label: "Ultimo mese", value: "month" as const },
          { label: "Ultimo anno", value: "year" as const },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setTimeFilter(btn.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeFilter === btn.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* CONTATORE RISULTATI */}
      <div className="mb-4 text-sm text-gray-600">
        {filtered.length} {filtered.length === 1 ? "contestazione" : "contestazioni"} {timeFilter !== "all" && `(${
          timeFilter === "today" ? "oggi" :
          timeFilter === "yesterday" ? "ieri" :
          timeFilter === "week" ? "ultima settimana" :
          timeFilter === "month" ? "ultimo mese" :
          "ultimo anno"
        })`}
      </div>

      {/* LISTA */}
      {loading ? (
        <p>Caricamento...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600 text-sm">
          Nessuna contestazione trovata.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="border border-gray-200 bg-white rounded-xl p-4 shadow-sm"
            >
              <div className="flex justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    ID Contestazione:{" "}
                    <span className="font-mono">{d.disputeId}</span>
                  </div>
                  <div className="text-sm font-semibold">
                    Contro: {d.againstUserName || "Utente non disponibile"}
                  </div>
                  {d.reporterName && (
                    <div className="text-xs text-gray-500">
                      Segnalato da: {d.reporterName}
                    </div>
                  )}
                  {d.bookingId && (
                    <div className="text-xs text-gray-500">
                      Prenotazione: #{d.bookingId}
                    </div>
                  )}
                </div>

                {/* STATO */}
                <span
                  className={`px-2 py-1 text-xs rounded-full h-fit whitespace-nowrap ${
                    d.status === "open"
                      ? "bg-red-100 text-red-600"
                      : d.status === "in_review"
                      ? "bg-yellow-100 text-yellow-700"
                      : d.status === "resolved"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {d.status === "open" && "Aperta"}
                  {d.status === "in_review" && "In Revisione"}
                  {d.status === "resolved" && "Risolta"}
                  {d.status === "rejected" && "Chiusa"}
                </span>
              </div>

              {/* MOTIVO */}
              <div className="mt-2 text-sm">
                <span className="font-semibold">Motivo:</span>{" "}
                {d.reason || "Non specificato"}
              </div>

              {/* DETTAGLI */}
              {d.details && (
                <p className="mt-2 text-gray-700 text-sm">{d.details}</p>
              )}

              {/* RIMBORSO */}
              {typeof d.refundAmount === "number" && (
                <div className="text-sm font-medium mt-1">
                  Rimborso richiesto: € {d.refundAmount.toFixed(2)}
                </div>
              )}

              {/* DOCUMENTO */}
              {d.refundDocumentName && (
                <div className="text-xs text-gray-500 mt-1">
                  Documento: {d.refundDocumentName}
                </div>
              )}

              {/* IMMAGINI */}
              {d.evidenceImages.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">
                    Immagini caricate:
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {d.evidenceImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        className="w-20 h-16 rounded-lg object-cover border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* DATA */}
              <div className="text-xs text-gray-400 mt-3">
                Creata il{" "}
                {new Date(d.createdAt).toLocaleString("it-IT")}
              </div>

              {/* BOTTONE GESTISCI */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => onManageDispute(d.id)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Gestisci →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
