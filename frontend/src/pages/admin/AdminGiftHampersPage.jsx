import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'react-hot-toast'
import { ArrowDown, ArrowUp, Gift, Pencil, Plus, Trash2 } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_DANGER,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from '../../components/admin/adminStyles.js'
import { adminGiftHamperEditPath, APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import { formatPrice } from '../../utils/productFormatters.js'

const THUMBNAIL_SIZE = 44

/**
 * /admin/gift-hampers: every hamper (in the store or switched off) in the Gift Store's order. The arrows move a
 * hamper up or down and save the new order at once; the switch puts it in or takes it out of the store.
 */
function AdminGiftHampersPage() {
  useDocumentTitle('Gift Hampers')
  const [hampers, setHampers] = useState([])
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let isCancelled = false
    adminApi.giftHampers
      .list()
      .then((data) => {
        if (isCancelled) return
        setHampers(data)
        setStatus('ready')
      })
      .catch(() => {
        if (!isCancelled) setStatus('error')
      })
    return () => {
      isCancelled = true
    }
  }, [reloadKey])

  const reload = useCallback(() => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }, [])

  async function move(index, offset) {
    const next = [...hampers]
    const [moved] = next.splice(index, 1)
    next.splice(index + offset, 0, moved)
    setBusyId(moved.id)
    try {
      setHampers(await adminApi.giftHampers.reorder(next.map((hamper) => hamper.id)))
    } catch (error) {
      toast.error(error.message || 'Couldn’t save the order. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleActive(hamper) {
    setBusyId(hamper.id)
    try {
      const updated = await adminApi.giftHampers.update(hamper.id, { isActive: !hamper.isActive })
      setHampers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      toast.success(updated.isActive ? `${updated.name} is in the store` : `${updated.name} is hidden`)
    } catch (error) {
      toast.error(error.message || 'Couldn’t save. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(hamper) {
    if (!window.confirm(`Delete the gift hamper “${hamper.name}”? This cannot be undone.`)) return
    setBusyId(hamper.id)
    try {
      const { deleted } = await adminApi.giftHampers.remove(hamper.id)
      if (deleted) {
        setHampers((current) => current.filter((item) => item.id !== hamper.id))
        toast.success(`${hamper.name} deleted`)
      } else {
        // Orders still show it, so the backend switched it off instead.
        setHampers((current) => current.map((item) => (item.id === hamper.id ? { ...item, isActive: false } : item)))
        toast.success(`${hamper.name} has been ordered, so it was hidden instead of deleted`)
      }
    } catch (error) {
      toast.error(error.message || 'Couldn’t delete. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Gift Hampers"
        description="The Gift Store shows hampers in this order. Hidden ones stay here for editing."
        actions={
          <Link to={APP_ROUTES.ADMIN_GIFT_HAMPER_NEW} className={ADMIN_BUTTON_PRIMARY}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Add hamper
          </Link>
        }
      />

      <div className={ADMIN_CARD}>
        <AdminLoadState status={status} isEmpty={!hampers.length} emptyText="No gift hampers yet." onRetry={reload} />
        {status === 'ready' && hampers.length > 0 && (
          <div className="overflow-x-auto">
            <table className={ADMIN_TABLE}>
              <thead>
                <tr>
                  <th className={ADMIN_TH}>Order</th>
                  <th className={ADMIN_TH}>Hamper</th>
                  <th className={ADMIN_TH}>Price</th>
                  <th className={ADMIN_TH}>Flavours</th>
                  <th className={ADMIN_TH}>In store</th>
                  <th className={ADMIN_TH}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {hampers.map((hamper, index) => {
                  const image = hamper.images?.[0]
                  const isBusy = busyId === hamper.id
                  return (
                    <tr key={hamper.id}>
                      <td className={ADMIN_TD}>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => move(index, -1)}
                            disabled={index === 0 || busyId !== null}
                            aria-label={`Move ${hamper.name} up`}
                            className={ADMIN_BUTTON_SECONDARY}
                          >
                            <ArrowUp size={14} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, 1)}
                            disabled={index === hampers.length - 1 || busyId !== null}
                            aria-label={`Move ${hamper.name} down`}
                            className={ADMIN_BUTTON_SECONDARY}
                          >
                            <ArrowDown size={14} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                      <td className={ADMIN_TD}>
                        <div className="flex items-center gap-3">
                          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-cream-100">
                            {image?.url ? (
                              <img
                                src={cloudinaryImageUrl(image.url, THUMBNAIL_SIZE * 2, THUMBNAIL_SIZE * 2, { crop: 'fill' })}
                                alt=""
                                width={THUMBNAIL_SIZE}
                                height={THUMBNAIL_SIZE}
                                loading="lazy"
                                decoding="async"
                                className="size-full object-cover"
                              />
                            ) : (
                              <Gift size={18} strokeWidth={1.75} aria-hidden="true" className="text-caramel-700" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-navy-800">{hamper.name}</span>
                            <span className="block text-xs text-muted">
                              {hamper.code} · /{hamper.slug}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className={`${ADMIN_TD} font-semibold text-navy-800`}>{formatPrice(hamper.price)}</td>
                      <td className={ADMIN_TD}>{hamper.flavours?.length ?? 0}</td>
                      <td className={ADMIN_TD}>
                        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={hamper.isActive}
                            onChange={() => toggleActive(hamper)}
                            disabled={isBusy}
                            aria-label={`Show ${hamper.name} in the store`}
                            className="size-4 accent-navy-800"
                          />
                          <span
                            className={`${ADMIN_BADGE} ${hamper.isActive ? 'bg-leaf-600/10 text-success' : 'bg-cream-100 text-muted'}`}
                          >
                            {hamper.isActive ? 'Published' : 'Hidden'}
                          </span>
                        </label>
                      </td>
                      <td className={`${ADMIN_TD} text-right`}>
                        <div className="flex justify-end gap-2">
                          <Link to={adminGiftHamperEditPath(hamper.id)} className={ADMIN_BUTTON_SECONDARY}>
                            <Pencil size={14} strokeWidth={1.75} aria-hidden="true" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(hamper)}
                            disabled={isBusy}
                            aria-label={`Delete ${hamper.name}`}
                            className={ADMIN_BUTTON_DANGER}
                          >
                            <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminGiftHampersPage