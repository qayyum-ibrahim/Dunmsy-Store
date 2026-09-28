import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, X, Plus, Minus, Trash2, Printer, Check, ChevronLeft } from 'lucide-react'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_KEY || 'pk_test_a1b2c3d4e5f6g7h8i9j0dummykey'
// Replace 'demo' with your Cloudinary cloud name (or set VITE_CLOUDINARY_CLOUD).
// Public IDs below ("dunmsy/<slug>/front" etc.) are the folder paths to match in your Media Library.
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD || 'demo'

const cld = (publicId, w = 800) =>
  `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,c_fill,ar_4:5,w_${w}/${publicId}`

const CATS = ['All', 'Dresses', 'Sets', 'Casual']
const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const COLORS = [
  { name: 'Midnight Black', hex: '#171717' },
  { name: 'Rich Ankara Blue', hex: '#1d4ed8' },
  { name: 'Mustard Gold', hex: '#ca9a12' },
]
const fmt = (n) => '₦' + n.toLocaleString('en-NG')
const label = (l) => `${l.name} — Size: ${l.size} | Color: ${l.color}`

const mk = (id, cat, name, price, slug, desc, fabric) => ({
  id, cat, name, price, desc, fabric,
  imgs: ['front', 'side', 'detail'].map((a) => `dunmsy-store/${slug}/${a}`),
})
const PRODUCTS = [
  mk(1, 'Sets', 'Adire Silk Kimono Jacket', 45000, 'adire-kimono', 'Richly dyed indigo silk luxury layering piece with wide flowy sleeves.', 'Silk with a hand-dyed indigo adire finish'),
  mk(2, 'Dresses', 'Classic Ankara Maxi Dress', 38500, 'ankara-maxi', 'Floor-length vibrant African print dress with an elegant side slit and form-fitting bodice.', 'Cotton Ankara wax print'),
  mk(3, 'Casual', 'Oversized Linen Resort Shirt', 25000, 'linen-shirt', 'Breathable premium linen shirt, perfect for warm-weather casual elegance.', 'Premium linen'),
  mk(4, 'Dresses', 'Aso-Oke Statement Corset Top', 32000, 'aso-oke-corset', 'Handwoven traditional textured wrap corset modernised for contemporary high fashion.', 'Handwoven aso-oke, textured weave'),
  mk(5, 'Sets', 'Flowing Silk Palazzo Trousers', 28000, 'silk-palazzo', 'High-waisted, wide-leg silk pants providing comfort and effortless style.', 'Silk'),
  mk(6, 'Sets', 'Monochrome Kaftan Set', 55000, 'kaftan-set', 'Two-piece minimal tunic and trouser co-ord crafted from ultra-fine polished cotton.', 'Ultra-fine polished cotton'),
  mk(7, 'Dresses', 'Boho Summer Tiered Skirt', 22500, 'tiered-skirt', 'Lightweight tiered floral midi skirt with an adjustable elastic drawstring waist.', 'Lightweight floral-print cotton'),
  mk(8, 'Casual', 'Urban Linen Utility Shorts', 18000, 'utility-shorts', 'Structured, tailored linen shorts featuring deep utility pockets.', 'Structured linen'),
]

// Cart entries are keyed by product + size + color, so each variant is its own line item.
const KEY = 'dunmsy-cart-v2'
const vkey = (id, size, color) => [id, size, color].join('|')
function useCart() {
  const [cart, setCart] = useState(() => {
    try { const c = JSON.parse(localStorage.getItem(KEY)); return c && typeof c === 'object' ? c : {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(cart)) } catch {} }, [cart])
  const add = (id, size, color) => setCart((c) => {
    const k = vkey(id, size, color)
    return { ...c, [k]: { id, size, color, qty: (c[k]?.qty || 0) + 1 } }
  })
  const setQty = (k, q) => setCart((c) => {
    const n = { ...c }
    if (q <= 0) delete n[k]; else n[k] = { ...n[k], qty: q }
    return n
  })
  return { cart, add, setQty, remove: (k) => setQty(k, 0), clear: () => setCart({}) }
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
    ? <div className={`${className} grid place-items-center bg-amber-100 font-display text-4xl text-amber-700`}>{alt[0]}</div>
    : <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={`${className} object-cover`} />
}

function ProductDetail({ p, onBack, onAdd }) {
  const [i, setI] = useState(0)
  const [size, setSize] = useState(null)
  const [color, setColor] = useState(null)
  const ready = size && color
  return (
    <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <button onClick={onBack} className="mb-6 flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"><ChevronLeft size={18} />Back to Shop</button>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <Img key={i} src={cld(p.imgs[i], 1200)} alt={`${p.name}, angle ${i + 1}`} className="aspect-4/5 w-full" />
          <div className="mt-3 grid grid-cols-3 gap-3">
            {p.imgs.map((s, j) => (
              <button key={s} aria-label={`Show angle ${j + 1}`} aria-pressed={j === i} onClick={() => setI(j)} className={`border-2 ${j === i ? 'border-neutral-900' : 'border-transparent'}`}>
                <Img src={cld(s, 240)} alt="" className="aspect-4/5 w-full" />
              </button>
            ))}
          </div>
        </div>
        <div className="md:pt-4">
          <h1 className="font-display text-4xl font-medium leading-tight">{p.name}</h1>
          <p className="mt-3 text-2xl font-semibold">{fmt(p.price)}</p>
          <p className="mt-5 max-w-prose text-neutral-700">{p.desc}</p>
          <p className="mt-4 text-sm"><span className="font-semibold">Fabric: </span>{p.fabric}</p>

          <p className="mt-8 text-sm font-semibold">Color: <span className="font-normal text-neutral-600">{color || 'Select a color'}</span></p>
          <div role="group" aria-label="Color" className="mt-3 flex gap-3">
            {COLORS.map((c) => (
              <button key={c.name} title={c.name} aria-label={c.name} aria-pressed={color === c.name} onClick={() => setColor(c.name)}
                style={{ backgroundColor: c.hex }}
                className={`h-9 w-9 rounded-full border border-neutral-300 ${color === c.name ? 'ring-2 ring-neutral-900 ring-offset-2' : ''}`} />
            ))}
          </div>

          <p className="mt-6 text-sm font-semibold">Size: <span className="font-normal text-neutral-600">{size || 'Select a size'}</span></p>
          <div role="group" aria-label="Size" className="mt-3 flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button key={s} aria-pressed={size === s} onClick={() => setSize(s)}
                className={`min-w-12 border px-3 py-2 text-sm ${size === s ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 hover:border-neutral-900'}`}>{s}</button>
            ))}
          </div>

          <button disabled={!ready} onClick={() => onAdd(p.id, size, color)}
            className="mt-8 w-full bg-neutral-900 py-3.5 text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:bg-neutral-300">
            {ready ? 'Add to cart' : 'Select a size and color'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const { cart, add, setQty, remove, clear } = useCart()
  const [view, setView] = useState('home') // 'home' | 'product-detail'
  const [active, setActive] = useState(null)
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState('cart')
  const [form, setForm] = useState({ name: '', email: '' })
  const [err, setErr] = useState('')
  const [receipt, setReceipt] = useState(null)

  const lines = useMemo(() => Object.entries(cart).flatMap(([key, v]) => {
    const p = PRODUCTS.find((x) => x.id === v?.id)
    return p && v.qty > 0 ? [{ ...p, size: v.size, color: v.color, qty: v.qty, key }] : []
  }), [cart])
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0)
  const shown = cat === 'All' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openProduct = (p) => { setActive(p); setView('product-detail'); window.scrollTo(0, 0) }
  const toShop = (c) => {
    if (c) setCat(c)
    setView('home'); setActive(null)
    setTimeout(() => document.getElementById('collection')?.scrollIntoView(), 0)
  }
  const addFromDetail = (id, size, color) => { add(id, size, color); setStep('cart'); setOpen(true) }

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
        items: lines.map((l) => ({ name: label(l), product: l.name, size: l.size, color: l.color, qty: l.qty, unit_price: l.price, subtotal: l.qty * l.price })),
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

  const field = 'mt-1 w-full border border-neutral-300 bg-white px-3 py-2.5'

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-slate-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <button onClick={() => { setView('home'); setActive(null); window.scrollTo(0, 0) }} className="font-display text-xl font-semibold sm:text-2xl">Dunmsy Store</button>
          <nav className="flex gap-3 text-sm sm:gap-6">
            {CATS.map((c) => (
              <button key={c} onClick={() => toShop(c)} className={view === 'home' && cat === c ? 'font-semibold text-amber-700' : 'text-neutral-600 hover:text-neutral-900'}>{c}</button>
            ))}
          </nav>
          <button aria-label={`Open cart, ${count} items`} onClick={() => setOpen(true)} className="relative p-2">
            <ShoppingBag size={22} />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber-600 px-1 text-xs text-white">{count}</span>}
          </button>
        </div>
      </header>

      {view === 'product-detail' && active ? (
        <ProductDetail key={active.id} p={active} onBack={() => toShop()} onAdd={addFromDetail} />
      ) : (
        <>
          <section className="mx-auto grid max-w-6xl items-end gap-10 px-5 py-14 md:grid-cols-[1.3fr_1fr] md:py-24">
            <div>
              <h1 className="font-display text-5xl font-medium leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">Timeless Garments. Contemporary African Soul.</h1>
              <p className="mt-6 max-w-md text-neutral-600">Adire, Ankara and Aso-Oke, tailored for the way you dress today.</p>
              <a href="#collection" className="mt-8 inline-block bg-neutral-900 px-7 py-3.5 text-white transition-colors hover:bg-amber-600">Shop Collection</a>
            </div>
            <Img src={cld(PRODUCTS[1].imgs[0], 800)} alt="Dunmsy Store lookbook" className="aspect-4/5 w-full" />
          </section>

          <section id="collection" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20">
            <h2 className="mb-8 font-display text-3xl">{cat === 'All' ? 'The collection' : cat}</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {shown.map((p) => (
                <article key={p.id} className="flex flex-col">
                  <button onClick={() => openProduct(p)} className="text-left">
                    <Img src={cld(p.imgs[0], 600)} alt={p.name} className="aspect-4/5 w-full" />
                    <h3 className="mt-3 font-medium">{p.name}</h3>
                  </button>
                  <p className="mt-1 flex-1 text-sm text-neutral-600">{p.desc}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-semibold">{fmt(p.price)}</span>
                    <button onClick={() => openProduct(p)} className="border border-neutral-900 px-3 py-1.5 text-sm hover:bg-neutral-900 hover:text-white">View details</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-500">© {new Date().getFullYear()} Dunmsy Store</footer>

      <div onClick={() => setOpen(false)} className={`fixed inset-0 z-50 bg-neutral-900/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside aria-hidden={!open} className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white transition-[transform,visibility] duration-300 motion-reduce:transition-none ${open ? 'translate-x-0' : 'invisible translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="font-display text-2xl">{step === 'cart' ? 'Your cart' : 'Checkout'}</h2>
          <button aria-label="Close cart" onClick={() => setOpen(false)}><X /></button>
        </div>
        {lines.length === 0 ? (
          <p className="p-5 text-neutral-600">Your cart is empty. Choose a piece from the collection to get started.</p>
        ) : step === 'cart' ? (
          <>
            <ul className="flex-1 divide-y divide-neutral-200 overflow-auto px-5">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3 py-4">
                  <Img src={cld(l.imgs[0], 200)} alt={l.name} className="h-20 w-16 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-neutral-600">Size: {l.size} | Color: {l.color}</p>
                    <p className="text-neutral-600">{fmt(l.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button aria-label="Decrease quantity" onClick={() => setQty(l.key, l.qty - 1)} className="border border-neutral-300 p-1"><Minus size={14} /></button>
                      <span className="w-6 text-center">{l.qty}</span>
                      <button aria-label="Increase quantity" onClick={() => setQty(l.key, l.qty + 1)} className="border border-neutral-300 p-1"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button aria-label={`Remove ${label(l)}`} onClick={() => remove(l.key)}><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 z-60 overflow-auto bg-neutral-900/70 p-4">
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
                  <tr key={l.key} className="border-t border-neutral-200 align-top">
                    <td className="py-2 pr-2">{label(l)}</td><td className="py-2 text-right">{l.qty}</td>
                    <td className="py-2 text-right">{fmt(l.price)}</td><td className="py-2 text-right">{fmt(l.price * l.qty)}</td>
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
