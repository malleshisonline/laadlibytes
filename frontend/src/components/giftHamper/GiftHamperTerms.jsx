import { BadgeIndianRupee, ClipboardList, Clock, PackageX, ReceiptText, Truck } from 'lucide-react'

// Word for word from the Gifting Catalogue 2026, page 2 (backend/scripts/data/gifting/gifting-catalogue-spec.md §4),
// including the closing line as the last card. Do not reword: the owner approves this text. Icons and the
// "Purchase order" label are ours; the catalogue has neither.
const GIFTING_TERMS = [
  { icon: BadgeIndianRupee, label: 'Payment', text: '100% advance along with order confirmation.' },
  { icon: ReceiptText, label: 'GST', text: 'Included.' },
  { icon: Truck, label: 'Transportation', text: 'Local Hyderabad delivery included; outstation To-Pay.' },
  {
    icon: Clock,
    label: 'Lead Time',
    text: '2 weeks from receipt of 100% advance and confirmed artwork/approvals, if any.',
  },
  { icon: PackageX, label: 'Returns', text: 'Goods are sold on a “No Return / Non-refundable” basis.' },
  {
    icon: ClipboardList,
    label: 'Purchase order',
    text: 'Kindly share your purchase order at your earliest convenience, so we may block production slots as per the agreed lead time.',
  },
]

/** The gifting terms from the catalogue, as cards: one column on phones, two on tablets, three on desktop. */
function GiftHamperTerms() {
  return (
    <ul className='grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3'>
      {GIFTING_TERMS.map(({ icon: Icon, label, text }) => (
        <li key={label} className='flex gap-3 rounded-2xl border border-cream-200 bg-surface p-4 shadow-sm'>
          <span className='grid size-10 shrink-0 place-items-center rounded-full bg-cream-100'>
            <Icon size={20} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
          </span>
          <div className='min-w-0'>
            <p className='text-sm font-bold text-navy-800'>{label}</p>
            <p className='mt-1 text-sm leading-6 text-body'>{text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export { GiftHamperTerms }
export default GiftHamperTerms