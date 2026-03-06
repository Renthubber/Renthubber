import React from 'react';
import { Clock, Ban, AlertCircle, Calendar, CreditCard } from 'lucide-react';
import { CancellationPolicyType } from '../types';

interface RulesAndPoliciesProps {
  rules: string[];
  cancellationPolicy?: CancellationPolicyType;
  deposit?: number;
  openingHours?: string;
  closingHours?: string;
  category?: string;
}

export const RulesAndPolicies: React.FC<RulesAndPoliciesProps> = ({ 
  rules, 
  cancellationPolicy, 
  deposit, 
  openingHours, 
  closingHours,
  category 
}) => {
  // Testo dinamico in base alla categoria
  const isSpace = category === 'Spazi';
  const openLabel = isSpace ? 'Check-in' : 'Ritiro';
  const closeLabel = isSpace ? 'Check-out' : 'Riconsegna';
  const policyEventText = isSpace ? 'check-in' : 'ritiro';
  
  const policyText = {
     'flexible': { title: 'Cancellazione Flessibile', desc: `Rimborso totale fino a 24 ore prima del ${policyEventText}.` },
     'moderate': { title: 'Cancellazione Moderata', desc: `Rimborso totale fino a 5 giorni prima del ${policyEventText}.` },
     'strict': { title: 'Cancellazione Rigida', desc: 'Rimborso parziale se cancelli a meno di 7 giorni.' },
  };
  
  const currentPolicy = cancellationPolicy ? policyText[cancellationPolicy] : policyText['flexible'];

  return (
    <div className="py-8 border-b border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Regole e Politiche</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Rules */}
         <div>
            <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Regole dell'Hubber</h4>
            <ul className="space-y-3">
               {openingHours && (
                  <li className="flex items-start text-sm text-gray-600">
                     <Clock className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                     {openLabel}: {openingHours}
                  </li>
               )}
               {closingHours && (
                  <li className="flex items-start text-sm text-gray-600">
                     <Clock className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                     {closeLabel}: {closingHours}
                  </li>
               )}
               {(rules ?? []).map((rule, i) => (
                  <li key={i} className="flex items-start text-sm text-gray-600">
                     <Ban className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                     {rule}
                  </li>
               ))}
               <li className="flex items-start text-sm text-gray-600">
                  <AlertCircle className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                  Segnala danni immediatamente
               </li>
            </ul>
         </div>

         {/* Policies */}
         <div>
            <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Politica di Cancellazione</h4>
            <div className="space-y-4">
               <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 text-gray-900 flex-shrink-0 mt-0.5" />
                  <div>
                     <p className="text-sm font-bold text-gray-900">{currentPolicy.title}</p>
                     <p className="text-sm text-gray-500">{currentPolicy.desc}</p>
                  </div>
               </div>
               {deposit != null && deposit !== "" && Number(deposit) > 0 && (
                  <div className="flex items-start">
                     <CreditCard className="w-5 h-5 mr-3 text-gray-900 flex-shrink-0 mt-0.5" />
                     <div>
                        <p className="text-sm font-bold text-gray-900">Cauzione: €{deposit}</p>
                        <p className="text-sm text-gray-500">Verrà bloccata temporaneamente sulla carta.</p>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};