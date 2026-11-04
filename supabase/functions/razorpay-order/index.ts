import { getCorsHeaders, json } from '../_shared/cors.ts'

Deno.serve(request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(request) })
  return json({ error: 'This endpoint is retired. Use checkout-order.' }, 410)
})
