import React, { FormEvent, useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Box, BriefcaseBusiness, Check, ChevronDown, ClipboardList, LogOut, RefreshCw, ShieldCheck, Shirt, Users } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'

type AdminTab = 'overview' | 'orders' | 'inquiries' | 'designs'

type AdminOrder = {
  id: string
  order_id: string
  items: Array<{ name?: string; quantity?: number; price?: number; size?: string; colorName?: string }>
  subtotal: number
  discount: number
  delivery_fee: number
  total: number
  shipping_details: { fullName?: string; email?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string }
  payment_method: string
  payment_status: string
  order_status: string
  estimated_delivery: string
  created_at: string
}

type BulkInquiry = {
  id: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  pcs_count: number
  tshirt_type: string
  print_sides: string
  estimated_total: number
  notes: string | null
  status: string
  created_at: string
}

type SavedDesign = {
  id: string
  name: string
  tshirt_type: string
  color_name: string
  size: string
  print_location: string
  created_at: string
}

const currency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)

export const AdminPanel: React.FC = () => {
  const client = getSupabaseClient()
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(Boolean(client))
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [inquiries, setInquiries] = useState<BulkInquiry[]>([])
  const [designs, setDesigns] = useState<SavedDesign[]>([])

  const authorize = useCallback(async (activeSession: Session | null) => {
    setSession(activeSession)
    setIsAdmin(false)
    if (!activeSession || !client) {
      setIsChecking(false)
      return
    }

    const { data, error: accessError } = await client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', activeSession.user.id)
      .maybeSingle()

    if (accessError) setError('Could not check admin access. Apply the admin setup SQL in Supabase first.')
    else if (data) setIsAdmin(true)
    else {
      setError('This account is not authorized for the admin panel.')
      await client.auth.signOut()
    }
    setIsChecking(false)
  }, [client])

  useEffect(() => {
    if (!client) {
      return
    }

    let alive = true
    client.auth.getSession().then(({ data }) => {
      if (alive) void authorize(data.session)
    })
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (alive) window.setTimeout(() => void authorize(nextSession), 0)
    })
    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [client, authorize])

  const loadData = useCallback(async () => {
    if (!client || !isAdmin) return
    setIsLoading(true)
    setError('')
    const [ordersResult, inquiriesResult, designsResult] = await Promise.all([
      client.from('orders').select('*').order('created_at', { ascending: false }),
      client.from('bulk_inquiries').select('*').order('created_at', { ascending: false }),
      client.from('custom_designs').select('id,name,tshirt_type,color_name,size,print_location,created_at').order('created_at', { ascending: false })
    ])
    if (ordersResult.error) setError(`Orders: ${ordersResult.error.message}`)
    else setOrders((ordersResult.data || []) as AdminOrder[])
    if (inquiriesResult.error) setError(current => current ? `${current} • Inquiries: ${inquiriesResult.error.message}` : `Inquiries: ${inquiriesResult.error.message}`)
    else setInquiries((inquiriesResult.data || []) as BulkInquiry[])
    if (designsResult.error) setError(current => current ? `${current} • Designs: ${designsResult.error.message}` : `Designs: ${designsResult.error.message}`)
    else setDesigns((designsResult.data || []) as SavedDesign[])
    setIsLoading(false)
  }, [client, isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    const timer = window.setTimeout(() => void loadData(), 0)
    return () => window.clearTimeout(timer)
  }, [isAdmin, loadData])

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    if (!client) return
    setError('')
    const { data, error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      return
    }
    await authorize(data.session)
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!client) return
    const { error: updateError } = await client.from('orders').update({ order_status: status }).eq('id', orderId)
    if (updateError) setError(`Could not update order: ${updateError.message}`)
    else setOrders(current => current.map(order => order.id === orderId ? { ...order, order_status: status } : order))
  }

  const updateInquiryStatus = async (inquiryId: string, status: string) => {
    if (!client) return
    const { error: updateError } = await client.from('bulk_inquiries').update({ status }).eq('id', inquiryId)
    if (updateError) setError(`Could not update inquiry: ${updateError.message}`)
    else setInquiries(current => current.map(item => item.id === inquiryId ? { ...item, status } : item))
  }

  const signOut = async () => {
    await client?.auth.signOut()
    setIsAdmin(false)
    setSession(null)
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'Overview', icon: Box },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'inquiries', label: 'Bulk inquiries', icon: BriefcaseBusiness },
    { id: 'designs', label: 'Saved designs', icon: Shirt }
  ]

  if (isChecking) return <div className="min-h-screen bg-neutral-950 text-white grid place-items-center">Checking admin access…</div>

  if (!isAdmin) return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-5">
      <form onSubmit={signIn} className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-8 shadow-2xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"><ArrowLeft size={16} /> Back to store</a>
        <div className="mt-8 mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-300"><ShieldCheck /></div>
        <h1 className="text-2xl font-black">Owner sign in</h1>
        <p className="mt-2 text-sm text-neutral-400">Sign in with the owner account authorized in Supabase.</p>
        <label className="mt-6 block text-xs font-bold text-neutral-300">Email</label>
        <input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
        <label className="mt-4 block text-xs font-bold text-neutral-300">Password</label>
        <input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
        {(error || !client) && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error || 'Supabase is not configured. Add your project URL and publishable key first.'}</p>}
        <button disabled={!client} className="mt-6 w-full rounded-xl bg-emerald-400 py-3 font-extrabold text-neutral-950 hover:bg-emerald-300 disabled:opacity-50">Sign in securely</button>
      </form>
    </main>
  )

  const revenue = orders.filter(order => order.payment_status === 'Paid').reduce((sum, order) => sum + Number(order.total || 0), 0)
  const pending = orders.filter(order => !['Delivered', 'Cancelled'].includes(order.order_status)).length

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 md:flex">
      <aside className="bg-neutral-950 p-5 text-white md:min-h-screen md:w-64 md:p-6">
        <a href="/" className="text-xs text-neutral-400 hover:text-white">← TeeCraft store</a>
        <div className="mt-7 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-neutral-950"><ShieldCheck size={20} /></div><div><p className="font-black">TeeCraft</p><p className="text-xs text-neutral-400">Owner admin</p></div></div>
        <nav className="mt-8 flex gap-2 overflow-x-auto md:flex-col">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${activeTab === id ? 'bg-white text-neutral-950' : 'text-neutral-400 hover:bg-white/10 hover:text-white'}`}><Icon size={17} />{label}</button>)}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-5 md:mt-12"><p className="truncate text-xs text-neutral-400">{session?.user.email}</p><button onClick={signOut} className="mt-4 flex items-center gap-2 text-sm font-bold text-neutral-300 hover:text-white"><LogOut size={16} /> Sign out</button></div>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-9">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Store management</p><h1 className="mt-1 text-3xl font-black">{navItems.find(item => item.id === activeTab)?.label}</h1></div>
          <button onClick={() => void loadData()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-neutral-50 disabled:opacity-50"><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh</button>
        </header>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {activeTab === 'overview' && <>
          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'All orders', value: orders.length, icon: ClipboardList },
              { label: 'Paid revenue', value: currency(revenue), icon: Check },
              { label: 'Orders in progress', value: pending, icon: Box },
              { label: 'New inquiries', value: inquiries.filter(item => item.status === 'New').length, icon: Users }
            ].map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-sm font-semibold text-neutral-500"><span>{label}</span><Icon size={18} /></div><p className="mt-4 text-3xl font-black">{value}</p></article>)}
          </section>
          <section className="mt-7 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">Recent orders</h2><button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-neutral-500 hover:text-neutral-900">View all</button></div><OrderTable orders={orders.slice(0, 5)} onStatusChange={updateOrderStatus} /></section>
        </>}

        {activeTab === 'orders' && <section className="mt-7 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><OrderTable orders={orders} onStatusChange={updateOrderStatus} /></section>}

        {activeTab === 'inquiries' && <section className="mt-7 space-y-3">{inquiries.length === 0 ? <EmptyState label="No bulk inquiries yet" /> : inquiries.map(item => <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-black">{item.company_name}</h2><p className="mt-1 text-sm text-neutral-500">{item.contact_person} · {item.email} · {item.phone}</p><p className="mt-3 text-sm">{item.pcs_count} pieces · {item.tshirt_type} · {item.print_sides}</p>{item.notes && <p className="mt-2 text-sm text-neutral-500">{item.notes}</p>}</div><div className="text-right"><p className="font-black">{currency(Number(item.estimated_total))}</p><p className="mt-1 text-xs text-neutral-500">{new Date(item.created_at).toLocaleString('en-IN')}</p><select value={item.status} onChange={event => void updateInquiryStatus(item.id, event.target.value)} className="mt-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm"><option>New</option><option>Contacted</option><option>Quoted</option><option>Closed</option></select></div></div></article>)}</section>}

        {activeTab === 'designs' && <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{designs.length === 0 ? <EmptyState label="No cloud designs available" /> : designs.map(item => <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><p className="font-black">{item.name}</p><p className="mt-2 text-sm text-neutral-500">{item.tshirt_type} · {item.color_name} · Size {item.size}</p><p className="mt-1 text-sm text-neutral-500">Print: {item.print_location}</p><p className="mt-4 text-xs text-neutral-400">{new Date(item.created_at).toLocaleString('en-IN')}</p></article>)}</section>}
      </main>
    </div>
  )
}

const EmptyState: React.FC<{ label: string }> = ({ label }) => <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm font-semibold text-neutral-500">{label}</div>

const OrderTable: React.FC<{ orders: AdminOrder[]; onStatusChange: (id: string, status: string) => void }> = ({ orders, onStatusChange }) => orders.length === 0 ? <EmptyState label="No orders yet" /> : (
  <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-400"><th className="py-3 pr-4">Order</th><th className="py-3 pr-4">Customer</th><th className="py-3 pr-4">Payment</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Status</th><th className="py-3">Date</th></tr></thead><tbody>{orders.map(order => <tr key={order.id} className="border-b border-neutral-100 align-top last:border-0"><td className="py-4 pr-4"><p className="font-black">{order.order_id}</p><p className="mt-1 text-xs text-neutral-500">{order.items?.length || 0} item types</p></td><td className="py-4 pr-4"><p className="font-bold">{order.shipping_details?.fullName || 'Customer'}</p><p className="mt-1 text-xs text-neutral-500">{order.shipping_details?.email}</p><p className="mt-1 text-xs text-neutral-500">{order.shipping_details?.phone}</p></td><td className="py-4 pr-4"><p>{order.payment_method}</p><p className="mt-1 text-xs text-neutral-500">{order.payment_status}</p></td><td className="py-4 pr-4 font-black">{currency(Number(order.total))}</td><td className="py-4 pr-4"><div className="relative"><select aria-label={`Status for ${order.order_id}`} value={order.order_status} onChange={event => void onStatusChange(order.id, event.target.value)} className="max-w-44 appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-3 pr-8 text-xs font-bold"><option>New</option><option>In Production</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500" /></div></td><td className="py-4 text-xs text-neutral-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</td></tr>)}</tbody></table></div>
)
