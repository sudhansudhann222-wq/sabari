import { corsHeaders, json } from '../_shared/cors.ts'

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return json({ error: 'This endpoint is retired. Use checkout-order.' }, 410)
})
