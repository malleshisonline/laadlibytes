import { BookOpen, Heart, Leaf, Truck } from 'lucide-react'

// Delivery is free on every order with no minimum (a fixed product decision), so this is a promise, not a promo.
const PROMISES = [
  { icon: Leaf, title: '100% Natural', text: 'Pure ingredients' },
  { icon: Truck, title: 'Free Delivery', text: 'On every order' },
  { icon: BookOpen, title: 'Traditional', text: 'Vrindavan recipes' },
  { icon: Heart, title: 'Made with Love', text: 'In small batches' },
]

/**
 * White card of four promises that overlaps the bottom of the Products hero. Two per row on phones, one row
 * from md. The icons sit in cream tiles (squares, not circles) and wobble a little on hover.
 */
function ProductPromiseStrip() {
  return (
    <div className='relative z-20 mx-auto -mt-8 max-w-5xl px-4 sm:px-6 md:-mt-10'>
      <ul className='grid grid-cols-2 gap-x-3 gap-y-4 rounded-2xl border border-cream-200 bg-surface/95 p-4 shadow-xl shadow-navy-900/10 backdrop-blur-sm md:grid-cols-4 md:divide-x md:divide-cream-200 md:p-5'>
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <li key={title} className='group flex items-center gap-3 md:justify-center md:px-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-cream-100 text-caramel-700 ring-1 ring-cream-200 transition duration-300 group-hover:bg-caramel-500 group-hover:text-white motion-safe:group-hover:-rotate-6'>
              <Icon size={22} strokeWidth={1.75} aria-hidden='true' />
            </span>
            <span className='min-w-0'>
              <span className='block text-sm font-extrabold text-navy-800'>{title}</span>
              <span className='block text-xs text-muted'>{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ProductPromiseStrip }
export default ProductPromiseStrip