import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { Link2, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import ReactivateCouponModal from '../../components/admin/ReactivateCouponModal.jsx'
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from '../../components/admin/adminStyles.js'
import { adminCouponEditPath, APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useAdminList } from '../../hooks/useAdminList.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { couponShareLink, describeCouponOffer } from '../../utils/couponLink.js'
import { formatOrderDate } from '../../utils/orderStatus.js'
import { formatPrice } from '../../utils/productFormatters.js'

const ACTIVE_FILTERS = { '': 'All', true: 'On', false: 'Off' }

/** Whether shoppers can use it right now, and if not, why. */
function couponState(coupon) {
  const now = Date.now()
  if (!coupon.isActive) return { label: 'Off', classes: 'bg-lightblue-100 text-muted' }
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { label: 'Scheduled', classes: 'bg-lightblue-100 text-navy-800' }
  }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() <= now) return { label: 'Expired', classes: 'bg-cream-100 text-warning' }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { label: 'Used up', classes: 'bg-cream-100 text-warning' }
  return { label: 'Live', classes: 'bg-leaf-600/10 text-success' }
}

/** Past its end date, whether or not it is also switched off: what Reactivate fixes. */
const isExpired = (coupon) => Boolean(coupon.endsAt) && new Date(coupon.endsAt).getTime() <= Date.now()

function validityText({ startsAt, endsAt }) {
  if (!startsAt && !endsAt) return 'Always'
  if (startsAt && endsAt) return `${formatOrderDate(startsAt)} – ${formatOrderDate(endsAt)}`
  return startsAt ? `From ${formatOrderDate(startsAt)}` : `Until ${formatOrderDate(endsAt)}`
}

function Switch({ checked, onChange, disabled, label }) {
  return (
    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-navy-800">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-navy-800"
      />
      {label}
    </label>
  )
}

/** /admin/coupons: every coupon with its usage, on/off and featured switches, and its share link. */
function AdminCouponsPage() {
  useDocumentTitle('Coupons')
  const [searchParams, setSearchParams] = useSearchParams()
  const params = {
    search: searchParams.get('search') ?? '',
    isActive: searchParams.get('isActive') ?? '',
    page: Number(searchParams.get('page')) || 1,
  }
  const [searchText, setSearchText] = useState(params.search)
  const { items: coupons, meta, status, reload, replaceItem } = useAdminList(adminApi.coupons.list, params)
  const [busyId, setBusyId] = useState(null)
  const [reactivating, setReactivating] = useState(null)

  function updateParams(changes) {
    const next = { ...params, page: 1, ...changes }
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([key, value]) => value && !(key === 'page' && value === 1))))
  }

  async function save(coupon, changes, message) {
    setBusyId(coupon.id)
    try {
      replaceItem(await adminApi.coupons.update(coupon.id, changes))
      toast.success(message)
      // Featuring one coupon un-features the others, so the other rows need the fresh list.
      if (changes.isFeatured) reload()
    } catch (error) {
      toast.error(error.message || 'Couldn’t save. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function reactivate(coupon, { startsAt, endsAt }) {
    try {
      replaceItem(await adminApi.coupons.update(coupon.id, { startsAt, endsAt, isActive: true }))
      toast.success(`${coupon.code} is active again until ${formatOrderDate(endsAt)}`)
      setReactivating(null)
    } catch (error) {
      toast.error(error.message || 'Couldn’t reactivate. Please try again.')
      throw error
    }
  }

  async function copyShareLink(coupon) {
    try {
      await globalThis.navigator.clipboard.writeText(couponShareLink(coupon.code))
      toast.success('Share link copied')
    } catch {
      toast.error(`Couldn’t copy. The link is ${couponShareLink(coupon.code)}`)
    }
  }

  async function remove(coupon) {
    if (!window.confirm(`Delete ${coupon.code}? A coupon that has been used is switched off instead.`)) return
    setBusyId(coupon.id)
    try {
      const { deleted } = await adminApi.coupons.remove(coupon.id)
      toast.success(deleted ? `${coupon.code} deleted` : `${coupon.code} has been used, so it was switched off`)
      reload()
    } catch (error) {
      toast.error(error.message || 'Couldn’t delete. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Coupons"
        description="Discount codes for the whole order. One coupon can be featured in the banner at the top of the store; the rest stay private and are shared by link."
        actions={
          <Link to={APP_ROUTES.ADMIN_COUPON_NEW} className={ADMIN_BUTTON_PRIMARY}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Add coupon
          </Link>
        }
      />

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
            <label htmlFor="coupon-search" className={ADMIN_LABEL}>
              Search
            </label>
            <div className="flex gap-2">
              <input
                id="coupon-search"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Code or description"
                className={ADMIN_INPUT}
              />
              <button type="submit" className={ADMIN_BUTTON_SECONDARY} aria-label="Search coupons">
                <Search size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </form>
          <div className="md:col-span-4">
            <label htmlFor="coupon-active" className={ADMIN_LABEL}>
              Switched
            </label>
            <select
              id="coupon-active"
              value={params.isActive}
              onChange={(event) => updateParams({ isActive: event.target.value })}
              className={ADMIN_INPUT}
            >
              {Object.entries(ACTIVE_FILTERS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={ADMIN_CARD}>
        <AdminLoadState status={status} isEmpty={!coupons.length} emptyText="No coupons yet." onRetry={reload} />
        {status === 'ready' && coupons.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className={ADMIN_TABLE}>
                <thead>
                  <tr>
                    <th className={ADMIN_TH}>Code</th>
                    <th className={ADMIN_TH}>Discount</th>
                    <th className={ADMIN_TH}>Valid</th>
                    <th className={ADMIN_TH}>Used</th>
                    <th className={ADMIN_TH}>Show</th>
                    <th className={`${ADMIN_TH} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const state = couponState(coupon)
                    const isBusy = busyId === coupon.id
                    return (
                      <tr key={coupon.id}>
                        <td className={ADMIN_TD}>
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-bold tracking-wide text-navy-800">{coupon.code}</span>
                            <span className={`${ADMIN_BADGE} ${state.classes}`}>{state.label}</span>
                            {coupon.isFeatured && (
                              <span className={`${ADMIN_BADGE} bg-navy-800 text-white`}>In banner</span>
                            )}
                          </span>
                          {coupon.description && <span className="mt-0.5 block text-xs text-muted">{coupon.description}</span>}
                        </td>
                        <td className={ADMIN_TD}>{describeCouponOffer(coupon)}</td>
                        <td className={`${ADMIN_TD} whitespace-nowrap`}>{validityText(coupon)}</td>
                        <td className={ADMIN_TD}>
                          <span className="block font-semibold text-navy-800">
                            {coupon.usedCount}
                            {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                          </span>
                          <span className="block text-xs whitespace-nowrap text-muted">
                            {coupon.paidOrders} paid · {formatPrice(coupon.totalDiscount)} off
                          </span>
                        </td>
                        <td className={ADMIN_TD}>
                          <Switch
                            label="On"
                            checked={coupon.isActive}
                            disabled={isBusy}
                            onChange={(isActive) =>
                              save(coupon, { isActive }, isActive ? `${coupon.code} switched on` : `${coupon.code} switched off`)
                            }
                          />
                          <Switch
                            label="Banner"
                            checked={coupon.isFeatured}
                            disabled={isBusy}
                            onChange={(isFeatured) =>
                              save(
                                coupon,
                                { isFeatured },
                                isFeatured ? `${coupon.code} is now in the banner` : `${coupon.code} removed from the banner`,
                              )
                            }
                          />
                        </td>
                        <td className={`${ADMIN_TD} text-right`}>
                          <div className="flex justify-end gap-1">
                            {isExpired(coupon) && (
                              <button
                                type="button"
                                onClick={() => setReactivating(coupon)}
                                disabled={isBusy}
                                className={`${ADMIN_BUTTON_SECONDARY} text-success`}
                                title="Reactivate with new dates"
                              >
                                <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
                                Reactivate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyShareLink(coupon)}
                              className={ADMIN_BUTTON_SECONDARY}
                              aria-label={`Copy share link for ${coupon.code}`}
                              title="Copy share link"
                            >
                              <Link2 size={16} strokeWidth={1.75} aria-hidden="true" />
                            </button>
                            <Link
                              to={adminCouponEditPath(coupon.id)}
                              className={ADMIN_BUTTON_SECONDARY}
                              aria-label={`Edit ${coupon.code}`}
                              title="Edit"
                            >
                              <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => remove(coupon)}
                              disabled={isBusy}
                              className={`${ADMIN_BUTTON_SECONDARY} text-error`}
                              aria-label={`Delete ${coupon.code}`}
                              title="Delete"
                            >
                              <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <AdminPagination meta={meta} onPageChange={(page) => updateParams({ page })} />
          </>
        )}
      </div>

      {reactivating && (
        <ReactivateCouponModal
          coupon={reactivating}
          onClose={() => setReactivating(null)}
          onSubmit={(dates) => reactivate(reactivating, dates)}
        />
      )}
    </>
  )
}

export default AdminCouponsPage