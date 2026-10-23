import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
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
import { adminCategoryEditPath, APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import { paginateList } from '../../utils/paginateList.js'

const THUMBNAIL_SIZE = 44
// Rows shown per page of the table.
const ADMIN_CATEGORIES_PER_PAGE = 10
// Joining words left out of the initials, so "Nuts n Seeds" is NS like its SKU prefix.
const JOINING_WORDS = new Set(['n', 'and', '&', 'of', 'the'])

/** "Fruit Variant" → "FV": the placeholder in the thumbnail circle of a category with no image. */
function categoryInitials(name) {
  return name
    .split(/\s+/)
    .filter((word) => word && !JOINING_WORDS.has(word.toLowerCase()))
    .map((word) => word[0].toUpperCase())
    .join('')
    .slice(0, 3)
}

/** /admin/categories: every category in its display order (lowest number first, as the store shows them). */
function AdminCategoriesPage() {
  useDocumentTitle('Categories')
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [deletingId, setDeletingId] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const { pageItems, meta } = paginateList(categories, searchParams.get('page'), ADMIN_CATEGORIES_PER_PAGE)

  function setPage(page) {
    setSearchParams(page > 1 ? { page: String(page) } : {})
  }

  useEffect(() => {
    let isCancelled = false
    adminApi.categories
      .list()
      .then((data) => {
        if (isCancelled) return
        setCategories(data)
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

  async function handleDelete(category) {
    if (!window.confirm(`Delete the category “${category.name}”? This cannot be undone.`)) return
    setDeletingId(category.id)
    try {
      await adminApi.categories.remove(category.id)
      setCategories((current) => current.filter((item) => item.id !== category.id))
      toast.success(`${category.name} deleted`)
    } catch (error) {
      // CATEGORY_NOT_EMPTY: "Category has 9 product(s); move or delete them first".
      toast.error(
        error.code === 'CATEGORY_NOT_EMPTY'
          ? `${error.message}. To hide it instead, untick “Published” on its edit page.`
          : error.message,
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="The store lists categories by their display order."
        actions={
          <Link to={APP_ROUTES.ADMIN_CATEGORY_NEW} className={ADMIN_BUTTON_PRIMARY}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Add category
          </Link>
        }
      />

      <div className={ADMIN_CARD}>
        <AdminLoadState status={status} isEmpty={!categories.length} emptyText="No categories yet." onRetry={reload} />
        {status === 'ready' && categories.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className={ADMIN_TABLE}>
                <thead>
                  <tr>
                    <th className={ADMIN_TH}>Order</th>
                    <th className={ADMIN_TH}>Category</th>
                    <th className={ADMIN_TH}>In store</th>
                    <th className={ADMIN_TH}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((category) => (
                    <tr key={category.id}>
                      <td className={`${ADMIN_TD} font-bold text-navy-800`}>{category.displayOrder}</td>
                      <td className={ADMIN_TD}>
                        <div className="flex items-center gap-3">
                          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-cream-100">
                            {category.image?.url ? (
                              <img
                                src={cloudinaryImageUrl(category.image.url, THUMBNAIL_SIZE * 2, THUMBNAIL_SIZE * 2, { crop: 'fill' })}
                                alt=""
                                width={THUMBNAIL_SIZE}
                                height={THUMBNAIL_SIZE}
                                loading="lazy"
                                decoding="async"
                                className="size-full object-cover"
                              />
                            ) : (
                              <span aria-hidden="true" className="text-sm font-bold text-caramel-700">
                                {categoryInitials(category.name)}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-navy-800">{category.name}</span>
                            <span className="block text-xs text-muted">/{category.slug}</span>
                          </span>
                        </div>
                      </td>
                      <td className={ADMIN_TD}>
                        <span
                          className={`${ADMIN_BADGE} ${category.isActive ? 'bg-leaf-600/10 text-success' : 'bg-cream-100 text-muted'}`}
                        >
                          {category.isActive ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td className={`${ADMIN_TD} text-right`}>
                        <div className="flex justify-end gap-2">
                          <Link to={adminCategoryEditPath(category.id)} className={ADMIN_BUTTON_SECONDARY}>
                            <Pencil size={14} strokeWidth={1.75} aria-hidden="true" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={deletingId === category.id}
                            aria-label={`Delete ${category.name}`}
                            className={ADMIN_BUTTON_DANGER}
                          >
                            <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  )
}

export default AdminCategoriesPage