import React from 'react';
import { Search, Star, TrendingUp, MapPin, Euro, Calendar, Shield, Zap } from 'lucide-react';

export const OrdinamentoRisultati: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand to-brand-light text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Come ordiniamo i risultati di ricerca</h1>
          </div>
          <p className="text-xl text-white/90">
            Scopri come RentHubber seleziona e ordina gli annunci per mostrarti sempre le migliori opzioni di noleggio
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Introduzione */}
        <div className="mb-12">
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Su RentHubber, migliaia di oggetti e spazi sono disponibili per il noleggio. Per aiutarti a trovare 
            esattamente ciò di cui hai bisogno, utilizziamo un sistema di ordinamento intelligente che analizza 
            decine di fattori per mostrarti gli annunci più rilevanti per la tua ricerca.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Il nostro obiettivo è semplice: <strong>farti risparmiare tempo</strong> mostrando per primi 
            gli annunci di qualità, convenienti e disponibili nella tua zona.
          </p>
        </div>

        {/* Fattori principali */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-brand" />
            I 4 fattori principali
          </h2>

          <div className="space-y-8">
            {/* Qualità */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-brand rounded-full p-3 flex-shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">1. Qualità dell'annuncio</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Gli annunci con <strong>foto chiare</strong>, <strong>descrizioni complete</strong> e 
                    <strong> recensioni positive</strong> vengono posizionati più in alto. Consideriamo:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Numero e qualità delle foto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Completezza della descrizione e delle informazioni</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Valutazioni medie e numero di recensioni</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Velocità di risposta del proprietario</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Popolarità */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-brand rounded-full p-3 flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">2. Popolarità</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Gli oggetti e spazi più richiesti vengono mostrati prima. Misuriamo la popolarità in base a:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Numero di visualizzazioni dell'annuncio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Quante volte è stato salvato nei preferiti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Numero di prenotazioni completate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Frequenza di noleggio (quanto spesso viene prenotato)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Prezzo */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-brand rounded-full p-3 flex-shrink-0">
                  <Euro className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">3. Convenienza del prezzo</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Gli annunci con <strong>prezzi competitivi</strong> rispetto ad articoli simili ottengono 
                    maggiore visibilità. Valutiamo:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Confronto con annunci simili nella stessa zona</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Rapporto qualità/prezzo basato sulle recensioni</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Disponibilità di sconti per noleggi lunghi</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Vicinanza */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-brand rounded-full p-3 flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">4. Vicinanza</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Gli annunci <strong>più vicini a te</strong> vengono privilegiati per facilitare il ritiro 
                    e la consegna. Consideriamo:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Distanza dalla tua posizione o dalla città cercata</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Accessibilità della zona (trasporti pubblici, parcheggio)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand font-bold">•</span>
                      <span>Disponibilità di consegna a domicilio da parte del proprietario</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Altri fattori */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Altri fattori importanti</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Disponibilità */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-6 h-6 text-brand" />
                <h3 className="text-xl font-bold text-gray-900">Disponibilità</h3>
              </div>
              <p className="text-gray-700">
                Gli annunci disponibili nelle date che cerchi vengono mostrati per primi. 
                Aggiornare regolarmente il calendario aumenta la visibilità.
              </p>
            </div>

            {/* SuperHubber */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-brand" />
                <h3 className="text-xl font-bold text-gray-900">Status SuperHubber</h3>
              </div>
              <p className="text-gray-700">
                I SuperHubber ricevono un piccolo boost nei risultati grazie alla loro 
                affidabilità comprovata e alle recensioni eccellenti.
              </p>
            </div>

            {/* Prenotazione immediata */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-brand" />
                <h3 className="text-xl font-bold text-gray-900">Prenotazione immediata</h3>
              </div>
              <p className="text-gray-700">
                Gli annunci con prenotazione immediata possono ottenere posizioni migliori 
                perché facilitano l'esperienza di noleggio.
              </p>
            </div>

            {/* Varietà */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Search className="w-6 h-6 text-brand" />
                <h3 className="text-xl font-bold text-gray-900">Varietà</h3>
              </div>
              <p className="text-gray-700">
                Cerchiamo di mostrarti una varietà di oggetti/spazi, prezzi e proprietari 
                diversi per darti più opzioni di scelta.
              </p>
            </div>
          </div>
        </div>

        {/* Come migliorare la visibilità */}
        <div className="bg-gradient-to-br from-brand/5 to-brand-light/5 rounded-2xl p-8 border-2 border-brand/20 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            💡 Consigli per Hubber
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Se sei un Hubber e vuoi migliorare la visibilità dei tuoi annunci, ecco cosa puoi fare:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📸</span>
              <div>
                <strong className="text-gray-900">Foto di qualità</strong>
                <p className="text-gray-600 text-sm">Aggiungi almeno 5-7 foto ben illuminate e nitide</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <strong className="text-gray-900">Descrizione completa</strong>
                <p className="text-gray-600 text-sm">Spiega caratteristiche, condizioni e modalità di consegna</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <strong className="text-gray-900">Prezzo competitivo</strong>
                <p className="text-gray-600 text-sm">Confronta con annunci simili nella tua zona</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <strong className="text-gray-900">Risposte veloci</strong>
                <p className="text-gray-600 text-sm">Rispondi entro poche ore ai messaggi</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <strong className="text-gray-900">Calendario aggiornato</strong>
                <p className="text-gray-600 text-sm">Mantieni sempre aggiornate le disponibilità</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <strong className="text-gray-900">Servizio eccellente</strong>
                <p className="text-gray-600 text-sm">Recensioni positive migliorano il posizionamento nel tempo</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ breve */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Domande frequenti</h2>
          
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Posso pagare per apparire più in alto?
              </h3>
              <p className="text-gray-700">
                No. RentHubber non vende posizionamenti nei risultati di ricerca. L'ordine è determinato 
                solo dai fattori di qualità, popolarità, prezzo e vicinanza descritti sopra.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Perché il mio annuncio non appare?
              </h3>
              <p className="text-gray-700">
                Verifica che il tuo annuncio sia pubblicato, disponibile nelle date cercate e che 
                rispetti tutte le linee guida di RentHubber. Gli annunci nuovi possono richiedere 
                24-48 ore per comparire nei risultati.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                L'ordine cambia per ogni utente?
              </h3>
              <p className="text-gray-700">
                Sì, in parte. La vicinanza geografica varia in base alla posizione dell'utente. 
                Inoltre, mostriamo risultati leggermente personalizzati basati sulle preferenze 
                passate (es. categorie visualizzate più spesso).
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                I nuovi annunci hanno priorità?
              </h3>
              <p className="text-gray-700">
                Gli annunci nuovi (pubblicati da meno di 30 giorni) ricevono un piccolo boost 
                temporaneo per aiutarli a ottenere le prime prenotazioni e recensioni. Questo 
                vantaggio diminuisce gradualmente nel tempo.
              </p>
            </div>
          </div>
        </div>

        {/* CTA finale */}
        <div className="bg-brand text-white rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Hai altre domande?</h2>
          <p className="text-xl text-white/90 mb-6">
            Contatta il nostro team di assistenza per qualsiasi dubbio
          </p>
          <a
            href="/assistenza"
            className="inline-block bg-white text-brand px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            Contatta l'assistenza
          </a>
        </div>

      </div>
    </div>
  );
};

export default OrdinamentoRisultati;