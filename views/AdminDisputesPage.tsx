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
export const AdminDisputesPage = () => {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AdminDisputeStatus>("open");

  useEffect(() => {
    loadDisputes();
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

  const filtered = disputes.filter(
    (d) => filter === "all" || d.status === filter
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestione Contestazioni</h1>

      {/* FILTRO */}
      <div className="flex gap-2 mb-4">
        {[
          { label: "Tutte", v: "all" as const },
          { label: "Aperte", v: "open" as const },
          { label: "In revisione", v: "in_review" as const },
          { label: "Risolte", v: "resolved" as const },
          { label: "Chiuse", v: "rejected" as const },
        ].map((btn) => (
          <button
            key={btn.v}
            onClick={() => setFilter(btn.v)}
            className={`px-3 py-1 rounded-full border text-sm ${
              filter === btn.v
                ? "bg-red-600 text-white border-red-600"
                : "bg-white border-gray-300 text-gray-700"
            }`}
          >
            {btn.label}
          </button>
        ))}
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
                  className={`px-2 py-1 text-xs rounded-full ${
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
