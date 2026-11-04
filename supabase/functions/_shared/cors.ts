const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean)
const requestOrigin = (request?: Request) => {
  const origin = request?.headers.get('Origin') || ''
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || ''
}

export const getCorsHeaders = (request?: Request) => ({
  ...(requestOrigin(request) ? { 'Access-Control-Allow-Origin': requestOrigin(request), 'Vary': 'Origin' } : {}),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
})

export const corsHeaders = getCorsHeaders()

export const json = (body: unknown, status = 200, request?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
  })
