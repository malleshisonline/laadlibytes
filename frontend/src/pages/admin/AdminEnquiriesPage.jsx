import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { ChevronDown, Mail, Search } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from '../../components/admin/adminStyles.js'
import { useAdminList } from '../../hooks/useAdminList.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { formatOrderDateTime } from '../../utils/orderStatus.js'

// Mirrors ENQUIRY_STATUSES in backend/src/modules/enquiry/enquiry.model.js.
const ENQUIRY_STATUS_LABELS = { new: 'New', read: 'Read', replied: 'Replied' }
const ENQUIRY_BADGE_CLASSES = {
  new: 'bg-cream-100 text-warning',
  read: 'bg-lightblue-100 text-navy-800',
  replied: 'bg-leaf-600/10 text-success',
}

function EnquiryRow({ enquiry, isOpen, onToggle, onStatusChange, isBusy }) {
  const mailSubject = `Re: ${enquiry.subject || 'Your message to Laadli Bytes'}`
  return (
    <li className="rounded-xl border border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 p-3 text-left hover:bg-lightblue-50 sm:p-4"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`font-semibold text-navy-800 ${enquiry.status === 'new' ? 'font-bold' : ''}`}>{enquiry.name}</span>
            <span className={`${ADMIN_BADGE} ${ENQUIRY_BADGE_CLASSES[enquiry.status]}`}>
              {ENQUIRY_STATUS_LABELS[enquiry.status]}
            </span>
          </span>
          <span className="block truncate text-sm text-body">{enquiry.subject || enquiry.message}</span>
          <span className="block text-xs text-muted">{formatOrderDateTime(enquiry.createdAt)}</span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`mt-1 shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-line p-3 sm:p-4">
          <p className="text-sm break-all text-muted">{enquiry.email}</p>
          {enquiry.subject && <p className="mt-2 font-semibold text-navy-800">{enquiry.subject}</p>}
          <p className="mt-2 text-sm whitespace-pre-line wrap-break-word text-body">{enquiry.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`mailto:${enquiry.email}?subject=${encodeURIComponent(mailSubject)}`}
              className={ADMIN_BUTTON_PRIMARY}
            >
              <Mail size={16} strokeWidth={1.75} aria-hidden="true" />
              Reply by email
            </a>
            {enquiry.status !== 'replied' && (
              <button type="button" disabled={isBusy} onClick={() => onStatusChange('replied')} className={ADMIN_BUTTON_SECONDARY}>
                Mark as replied
              </button>
            )}
            {enquiry.status !== 'new' && (
              <button type="button" disabled={isBusy} onClick={() => onStatusChange('new')} className={ADMIN_BUTTON_SECONDARY}>
                Mark as new
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

/** /admin/enquiries: Contact Us messages. Opening a new one marks it read (the API does that on fetch). */
function AdminEnquiriesPage() {
  useDocumentTitle('Enquiries')
  const [searchParams, setSearchParams] = useSearchParams()
  const params = {
    status: searchParams.get('status') ?? '',
    search: searchParams.get('search') ?? '',
    page: Number(searchParams.get('page')) || 1,
  }
  const [searchText, setSearchText] = useState(params.search)
  const { items: enquiries, meta, status, reload, replaceItem } = useAdminList(adminApi.enquiries.list, params)
  const [openId, setOpenId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  function updateParams(changes) {
    const next = { ...params, page: 1, ...changes }
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([key, value]) => value && !(key === 'page' && value === 1))))
  }

  async function toggle(enquiry) {
    if (openId === enquiry.id) {
      setOpenId(null)
      return
    }
    setOpenId(enquiry.id)
    if (enquiry.status !== 'new') return
    try {
      replaceItem(await adminApi.enquiries.get(enquiry.id))
    } catch {
      // Still readable from the list; it just stays marked new.
    }
  }

  async function changeStatus(enquiry, nextStatus) {
    setBusyId(enquiry.id)
    try {
      replaceItem(await adminApi.enquiries.updateStatus(enquiry.id, nextStatus))
      toast.success(`Marked as ${ENQUIRY_STATUS_LABELS[nextStatus].toLowerCase()}`)
    } catch (error) {
      toast.error(error.message || 'Couldn’t save. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader title="Enquiries" description="Messages sent from the Contact Us page." />

      <div className={`${ADMIN_CARD} mb-4`}>
        <div className="grid gap-3 md:grid-cols-12">
          <form
            role="search"
            className="md:col-span-8"
            onSubmit={(event) => {
              event.preventDefault()
              updateParams({ search: searchText.trim() })
            }}
          >
            <label htmlFor="enquiry-search" className={ADMIN_LABEL}>
              Search
            </label>
            <div className="flex gap-2">
              <input
                id="enquiry-search"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Name, email, subject or message"
                className={ADMIN_INPUT}
              />
              <button type="submit" className={ADMIN_BUTTON_SECONDARY} aria-label="Search enquiries">
                <Search size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </form>
          <div className="md:col-span-4">
            <label htmlFor="enquiry-status" className={ADMIN_LABEL}>
              Status
            </label>
            <select
              id="enquiry-status"
              value={params.status}
              onChange={(event) => updateParams({ status: event.target.value })}
              className={ADMIN_INPUT}
            >
              <option value="">All</option>
              {Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={ADMIN_CARD}>
        <AdminLoadState status={status} isEmpty={!enquiries.length} emptyText="No enquiries here." onRetry={reload} />
        {status === 'ready' && enquiries.length > 0 && (
          <>
            <ul className="space-y-2">
              {enquiries.map((enquiry) => (
                <EnquiryRow
                  key={enquiry.id}
                  enquiry={enquiry}
                  isOpen={openId === enquiry.id}
                  isBusy={busyId === enquiry.id}
                  onToggle={() => toggle(enquiry)}
                  onStatusChange={(nextStatus) => changeStatus(enquiry, nextStatus)}
                />
              ))}
            </ul>
            <AdminPagination meta={meta} onPageChange={(page) => updateParams({ page })} />
          </>
        )}
      </div>
    </>
  )
}

export default AdminEnquiriesPage