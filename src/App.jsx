import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, X, Plus, Minus, Trash2, Printer, Check } from 'lucide-react'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_KEY || 'pk_test_a1b2c3d4e5f6g7h8i9j0dummykey'
const CATS = ['All', 'Dresses', 'Sets', 'Casual']
const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`
const fmt = (n) => '₦' + n.toLocaleString('en-NG')

const PRODUCTS = [
  { id: 1, cat: 'Sets', name: 'Adire Silk Kimono Jacket', price: 45000, img: u('photo-1515886657613-9f3515b0c78f'), desc: 'Richly dyed indigo silk layering piece with wide, flowy sleeves.' },
  { id: 2, cat: 'Dresses', name: 'Classic Ankara Maxi Dress', price: 38500, img: u('photo-1496747611176-843222e1e57c'), desc: 'Floor-length vibrant African print with an elegant side slit and fitted bodice.' },
  { id: 3, cat: 'Casual', name: 'Oversized Linen Resort Shirt', price: 25000, img: u('photo-1434389677669-e08b4cac3105'), desc: 'Breathable cream linen for easy, warm-weather elegance.' },
  { id: 4, cat: 'Dresses', name: 'Aso-Oke Statement Corset Top', price: 32000, img: u('photo-1509631179647-0177331693ae'), desc: 'Handwoven, textured wrap corset modernised for contemporary high fashion.' },
  { id: 5, cat: 'Sets', name: 'Flowing Silk Palazzo Trousers', price: 28000, img: u('photo-1539109136881-3be0616acf4b'), desc: 'High-waisted, wide-leg emerald silk with effortless comfort.' },
  { id: 6, cat: 'Sets', name: 'Monochrome Kaftan Set', price: 55000, img: u('photo-1469334031218-e382a71b716b'), desc: 'Two-piece charcoal tunic and trouser co-ord in ultra-fine polished cotton.' },
  { id: 7, cat: 'Dresses', name: 'Boho Summer Tiered Skirt', price: 22500, img: u('photo-1490481651871-ab68de25d43d'), desc: 'Lightweight tiered floral cotton midi with an adjustable drawstring waist.' },
  { id: 8, cat: 'Casual', name: 'Urban Linen Utility Shorts', price: 18000, img: u('photo-1445205170230-053b83016050'), desc: 'Structured khaki linen shorts, tailored, with deep utility pockets.' },
]

const KEY = 'dunmsy-cart'
function useCart() {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(cart)) } catch {} }, [cart])
  const add = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const setQty = (id, q) => setCart((c) => {
    const n = { ...c }
    if (q <= 0) delete n[id]; else n[id] = q
    return n
  })
  return { cart, add, setQty, remove: (id) => setQty(id, 0), clear: () => setCart({}) }
}

const loadPaystack = () => new Promise((res, rej) => {
  if (window.PaystackPop) return res()
  const s = document.createElement('script')
  s.src = 'https://js.paystack.co/v1/inline.js'
  s.onload = res
  s.onerror = rej
  document.body.appendChild(s)
})

function Img({ src, alt, className = '' }) {
  const [bad, setBad] = useState(false)
  return bad
    ? <div className={`${className} bg-amber-100 text-amber-700 font-display text-4xl grid place-items-center`}>{alt[0]}</div>
    : <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={`${className} object-cover`} />
}

export default function App() {
  const { cart, add, setQty, remove, clear } = useCart()
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState('cart')
  const [form, setForm] = useState({ name: '', email: '' })
  const [err, setErr] = useState('')
  const [receipt, setReceipt] = useState(null)

  const lines = useMemo(() => PRODUCTS.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] })), [cart])
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0)
  const shown = cat === 'All' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pay = async (e) => {
    e.preventDefault()
    setErr('')
    try { await loadPaystack() } catch { return setErr('Could not load Paystack. Check your connection and try again.') }
    const ref = 'DUNMSY-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    const { name, email } = form
    window.PaystackPop.setup({
      key: PAYSTACK_KEY,
      email,
      amount: total * 100, // Naira to Kobo
      currency: 'NGN',
      ref,
      metadata: {
        custom_fields: [{ display_name: 'Customer name', variable_name: 'customer_name', value: name }],
        items: lines.map((l) => ({ name: l.name, qty: l.qty, unit_price: l.price, subtotal: l.qty * l.price })),
      },
      callback: () => { // must be a plain (non-async) function for Paystack inline v1
        setReceipt({ ref, date: new Date(), name, email, lines, total })
        clear()
        setOpen(false)
        setStep('cart')
      },
      onClose: () => {},
    }).openIframe()
  }

  const goTo = (c) => { setCat(c); document.getElementById('collection').scrollIntoView() }
  const field = 'mt-1 w-full border border-neutral-300 bg-white px-3 py-2.5'

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 font-sans">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-slate-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <a href="#top" className="font-display text-xl font-semibold sm:text-2xl">Dunmsy Store</a>
          <nav className="flex gap-3 text-sm sm:gap-6">
            {CATS.map((c) => (
              <button key={c} onClick={() => goTo(c)} className={cat === c ? 'font-semibold text-amber-700' : 'text-neutral-600 hover:text-neutral-900'}>{c}</button>
            ))}
          </nav>
          <button aria-label={`Open cart, ${count} items`} onClick={() => setOpen(true)} className="relative p-2">
            <ShoppingBag size={22} />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-600 px-1 text-xs text-white">{count}</span>}
          </button>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-6xl items-end gap-10 px-5 py-14 md:grid-cols-[1.3fr_1fr] md:py-24">
        <div>
          <h1 className="font-display text-5xl font-medium leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">Timeless Garments. Contemporary African Soul.</h1>
          <p className="mt-6 max-w-md text-neutral-600">Adire, Ankara and Aso-Oke, tailored for the way you dress today.</p>
          <a href="#collection" className="mt-8 inline-block bg-neutral-900 px-7 py-3.5 text-white transition-colors hover:bg-amber-600">Shop Collection</a>
        </div>
        <Img src={PRODUCTS[1].img} alt="Dunmsy Store lookbook" className="aspect-[3/4] w-full" />
      </section>

      <section id="collection" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20">
        <h2 className="mb-8 font-display text-3xl">{cat === 'All' ? 'The collection' : cat}</h2>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {shown.map((p) => (
            <article key={p.id} className="flex flex-col">
              <Img src={p.img} alt={p.name} className="aspect-[3/4] w-full" />
              <h3 className="mt-3 font-medium">{p.name}</h3>
              <p className="mt-1 flex-1 text-sm text-neutral-600">{p.desc}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-semibold">{fmt(p.price)}</span>
                <button onClick={() => add(p.id)} className="border border-neutral-900 px-3 py-1.5 text-sm hover:bg-neutral-900 hover:text-white">Add to cart</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-500">© {new Date().getFullYear()} Dunmsy Store</footer>

      <div onClick={() => setOpen(false)} className={`fixed inset-0 z-50 bg-neutral-900/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside aria-hidden={!open} className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white transition-[transform,visibility] duration-300 motion-reduce:transition-none ${open ? 'translate-x-0' : 'invisible translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="font-display text-2xl">{step === 'cart' ? 'Your cart' : 'Checkout'}</h2>
          <button aria-label="Close cart" onClick={() => setOpen(false)}><X /></button>
        </div>
        {lines.length === 0 ? (
          <p className="p-5 text-neutral-600">Your cart is empty. Add a piece from the collection to get started.</p>
        ) : step === 'cart' ? (
          <>
            <ul className="flex-1 divide-y divide-neutral-200 overflow-auto px-5">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-3 py-4">
                  <Img src={l.img} alt={l.name} className="h-20 w-16 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-neutral-600">{fmt(l.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button aria-label="Decrease quantity" onClick={() => setQty(l.id, l.qty - 1)} className="border border-neutral-300 p-1"><Minus size={14} /></button>
                      <span className="w-6 text-center">{l.qty}</span>
                      <button aria-label="Increase quantity" onClick={() => setQty(l.id, l.qty + 1)} className="border border-neutral-300 p-1"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button aria-label={`Remove ${l.name}`} onClick={() => remove(l.id)}><Trash2 size={16} /></button>
                    <span className="text-sm font-semibold">{fmt(l.price * l.qty)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-neutral-200 p-5">
              <div className="mb-4 flex justify-between font-semibold"><span>Total</span><span>{fmt(total)}</span></div>
              <button onClick={() => setStep('form')} className="w-full bg-neutral-900 py-3.5 text-white hover:bg-amber-600">Proceed to Checkout</button>
            </div>
          </>
        ) : (
          <form onSubmit={pay} className="flex flex-1 flex-col gap-4 p-5">
            <label className="text-sm">Full name
              <input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
            </label>
            <label className="text-sm">Email address
              <input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
            </label>
            {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
            <div className="mt-auto">
              <div className="mb-4 flex justify-between font-semibold"><span>{count} {count === 1 ? 'item' : 'items'}</span><span>{fmt(total)}</span></div>
              <button type="submit" className="w-full bg-amber-600 py-3.5 text-white hover:bg-amber-700">Pay {fmt(total)}</button>
              <button type="button" onClick={() => setStep('cart')} className="mt-2 w-full py-2 text-sm text-neutral-600">Back to cart</button>
            </div>
          </form>
        )}
      </aside>

      {receipt && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-neutral-900/70 p-4">
          <div id="receipt" className="mx-auto my-6 max-w-md bg-white p-8 text-neutral-900">
            <div className="border-b border-neutral-200 pb-5 text-center">
              <h2 className="font-display text-3xl">Dunmsy Store</h2>
              <p className="mt-1 text-sm text-neutral-600">Purchase Receipt</p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-neutral-200 py-5 text-sm">
              <dt className="text-neutral-500">Order reference</dt><dd className="text-right font-medium">{receipt.ref}</dd>
              <dt className="text-neutral-500">Payment date</dt><dd className="text-right">{receipt.date.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
              <dt className="text-neutral-500">Customer</dt><dd className="text-right">{receipt.name}</dd>
              <dt className="text-neutral-500">Email</dt><dd className="break-all text-right">{receipt.email}</dd>
            </dl>
            <table className="my-5 w-full text-sm">
              <thead><tr className="text-left text-neutral-500">
                <th className="pb-2 font-normal">Item</th><th className="pb-2 text-right font-normal">Qty</th>
                <th className="pb-2 text-right font-normal">Price</th><th className="pb-2 text-right font-normal">Amount</th>
              </tr></thead>
              <tbody>
                {receipt.lines.map((l) => (
                  <tr key={l.id} className="border-t border-neutral-200">
                    <td className="py-2 pr-2">{l.name}</td><td className="text-right">{l.qty}</td>
                    <td className="text-right">{fmt(l.price)}</td><td className="text-right">{fmt(l.price * l.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between border-t-2 border-neutral-900 pt-3 font-semibold"><span>Total paid</span><span>{fmt(receipt.total)}</span></div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-emerald-700"><Check size={16} />Payment successful. Thank you for shopping with us.</p>
            <div className="no-print mt-6 flex gap-3">
              <button onClick={() => window.print()} className="flex flex-1 items-center justify-center gap-2 bg-neutral-900 py-3 text-white"><Printer size={16} />Print / Download Receipt</button>
              <button onClick={() => setReceipt(null)} className="border border-neutral-300 px-4">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
