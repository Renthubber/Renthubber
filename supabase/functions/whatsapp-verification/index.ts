import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SMSTO_API_KEY = Deno.env.get('SMSTO_API_KEY')!;
const SMSTO_API_URL = 'https://api.sms.to/sms/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🔥 Funzione SMS invocata');
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json();
    console.log('📦 Body ricevuto:', body);
    
    const { action, phoneNumber, code, userId } = body;

    if (!phoneNumber.startsWith('+39')) {
      throw new Error('Numero deve iniziare con +39');
    }

    if (action === 'send') {
      console.log('📤 Azione: send OTP');
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('🔢 OTP generato:', otp);
      
      console.log('💾 Salvataggio in database...');
      const { error: dbError } = await supabaseClient
        .from('phone_verifications')
        .insert({
          phone_number: phoneNumber,
          otp_code: otp,
          user_id: userId,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          attempts: 0,
          verified: false
        });

      if (dbError) {
        console.error('❌ Errore database:', dbError);
        throw dbError;
      }
      console.log('✅ Salvato in database');

      const message = `Il tuo codice di verifica è ${otp}. Sarà valido per 10 minuti. Non condividerlo.`;
      console.log('📝 Messaggio preparato');
      
      console.log('📞 Chiamata SMS.to in corso...');
      const smsResponse = await fetch(SMSTO_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SMSTO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          to: phoneNumber,
          sender_id: 'Renthubber' // Verrà sostituito con numero se non registrato
        })
      });

      console.log('📥 Risposta SMS.to ricevuta, status:', smsResponse.status);
      const smsResult = await smsResponse.json();
      console.log('📋 Risultato SMS.to:', smsResult);

      if (!smsResponse.ok) {
        console.error('❌ Errore SMS.to:', smsResult);
        throw new Error(smsResult.message || 'Errore invio SMS');
      }

      console.log('✅ SMS inviato con successo');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Codice inviato via SMS',
          messageId: smsResult.message_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      console.log('🔍 Azione: verify OTP');
      
      const { data: verification, error: fetchError } = await supabaseClient
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !verification) {
        console.log('❌ Verifica non trovata o scaduta');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Codice scaduto o non trovato' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabaseClient
        .from('phone_verifications')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id);

      if (verification.attempts >= 3) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Troppi tentativi. Richiedi un nuovo codice' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (verification.otp_code !== code) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Codice errato',
            attemptsLeft: 3 - (verification.attempts + 1)
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabaseClient
        .from('phone_verifications')
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq('id', verification.id);

      await supabaseClient
        .from('users')
        .update({ 
          phone_verified: true,
          phone_number: phoneNumber
        })
        .eq('id', userId);

      console.log('✅ Verifica completata');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Numero verificato con successo!' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Azione non valida');

  } catch (error) {
    console.error('💥 Errore generale:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});