import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { store_id } = await req.json()

    if (!store_id) {
      return new Response(JSON.stringify({ error: 'store_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, images, short_code')
      .eq('store_id', store_id)

    if (!listings || listings.length === 0) {
      return new Response(JSON.stringify({ data: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const listingIds = listings.map((l: any) => l.id)
    const listingsMap = Object.fromEntries(listings.map((l: any) => [l.id, l]))

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, status, renter_id, listing_id')
      .in('listing_id', listingIds)
      .in('status', ['confirmed', 'active'])
      .order('start_date', { ascending: true })

   if (error) throw error

    // Carica dati renter
    const renterIds = [...new Set((bookings || []).map((b: any) => b.renter_id))]
    const { data: renters } = await supabase
      .from('users')
      .select('id, first_name, last_name, phone_number')
      .in('id', renterIds)

    const rentersMap = Object.fromEntries((renters || []).map((u: any) => [u.id, u]))

    const result = (bookings || []).map((b: any) => ({
      ...b,
      listings: listingsMap[b.listing_id] || null,
      renter: rentersMap[b.renter_id] || null,
    }))

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})