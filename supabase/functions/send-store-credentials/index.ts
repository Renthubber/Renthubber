import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { to_email, business_name, password } = await req.json()

    if (!to_email || !business_name || !password) {
      return new Response(JSON.stringify({ error: 'Parametri mancanti' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const SMTP_HOST = 'mail.renthubber.com'
    const SMTP_PORT = 465
    const SMTP_USER = 'store@renthubber.com'
    const SMTP_PASS = Deno.env.get('SMTP_PASSWORD') ?? ''

    const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 24px;">
    <img src="https://upyznglekmynztmydtxi.supabase.co/storage/v1/object/public/images/renthubberStoreAutorizzato.webp" 
         alt="RentHubber Store" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px;" />
    <h1 style="color: #1a1a1a; margin: 0;">Benvenuto su RentHubber! 🎉</h1>
  </div>
  
  <p>Ciao <strong>${business_name}</strong>,</p>
  <p>La tua candidatura come Store Autorizzato RentHubber è stata <strong style="color: #16a34a;">approvata</strong>!</p>
  
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <h3 style="margin: 0 0 12px 0; color: #15803d;">Le tue credenziali di accesso</h3>
    <p style="margin: 8px 0;"><strong>URL:</strong> <a href="https://renthubber.com/store/login">renthubber.com/store/login</a></p>
    <p style="margin: 8px 0;"><strong>Email:</strong> ${to_email}</p>
    <p style="margin: 8px 0;"><strong>Password temporanea:</strong> <code style="background: #e8f5e9; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${password}</code></p>
  </div>
  
  <p style="color: #dc2626; font-size: 14px;">⚠️ Ti verrà chiesto di cambiare la password al primo accesso.</p>
  
  <p>Per qualsiasi domanda, rispondi a questa email.</p>
  
  <p>A presto,<br><strong>Il team RentHubber</strong></p>
</body>
</html>
    `

    // Invio email via SMTP usando fetch a un relay
    const emailData = {
      from: `RentHubber Store <${SMTP_USER}>`,
      to: to_email,
      subject: `✅ Store Approvato - Le tue credenziali RentHubber`,
      html: emailBody,
    }

    // Usa SmtpClient di Deno
    const { SmtpClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts')
    const client = new SmtpClient()

    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USER,
      password: SMTP_PASS,
    })

    await client.send({
      from: `RentHubber Store <${SMTP_USER}>`,
      to: to_email,
      subject: '✅ Store Approvato - Le tue credenziali RentHubber',
      html: emailBody,
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})