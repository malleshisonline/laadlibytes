import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { Search } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from '../../components/admin/adminStyles.js'
import { useAdminList } from '../../hooks/useAdminList.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { formatIndianMobile } from '../../utils/addressValidation.js'
import { formatOrderDate } from '../../utils/orderStatus.js'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'last_login_desc', label: 'Recently signed in' },
]

// The users list comes back lean from the API, so its rows carry `_id` rather than `id`.
const userIdOf = (user) => user.id ?? user._id

/**
 * /admin/users: every account, with the two switches an admin needs: active (a deactivated account cannot sign
 * in) and admin role. There is no delete: orders point at the account, so deactivating is the safe way out.
 * Your own row is locked, so you cannot take your own admin access away by accident.
 */
function AdminUsersPage() {
  useDocumentTitle('Customers')
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const params = {
    search: searchParams.get('search') ?? '',
    role: searchParams.get('role') ?? '',
    sort: searchParams.get('sort') ?? 'newest',
    page: Number(searchParams.get('page')) || 1,
  }
  const [searchText, setSearchText] = useState(params.search)
  const { items: users, meta, status, reload, replaceItem } = useAdminList(adminApi.users.list, params)
  const [busyId, setBusyId] = useState(null)

  function updateParams(changes) {
    const next = { ...params, page: 1, ...changes }
    setSearchParams(
      Object.fromEntries(
        Object.entries(next).filter(
          ([key, value]) => value && !(key === 'page' && value === 1) && !(key === 'sort' && value === 'newest'),
        ),
      ),
    )
  }

  async function updateUser(user, changes, successMessage, confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return
    const id = userIdOf(user)
    setBusyId(id)
    try {
      replaceItem({ ...(await adminApi.users.update(id, changes)), _id: id })
      toast.success(successMessage)
    } catch (error) {
      toast.error(error.message || 'Couldn’t save. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader title="Customers" description="Accounts that signed up on the store." />

      <div className={`${ADMIN_CARD} mb-4`}>
        <div className="grid gap-3 md:grid-cols-12">
          <form
            role="search"
            className="md:col-span-6"
            onSubmit={(event) => {
              event.preventDefault()
              updateParams({ search: searchText.trim() })
            }}
          >
            <label htmlFor="user-search" className={ADMIN_LABEL}>
              Search
            </label>
            <div className="flex gap-2">
              <input
                id="user-search"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Name, email or phone"
                className={ADMIN_INPUT}
              />
              <button type="submit" className={ADMIN_BUTTON_SECONDARY} aria-label="Search customers">
                <Search size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </form>
          <div className="md:col-span-3">
            <label htmlFor="user-role" className={ADMIN_LABEL}>
              Role
            </label>
            <select
              id="user-role"
              value={params.role}
              onChange={(event) => updateParams({ role: event.target.value })}
              className={ADMIN_INPUT}
            >
              <option value="">Everyone</option>
              <option value="user">Customers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="user-sort" className={ADMIN_LABEL}>
              Sort
            </label>
            <select
              id="user-sort"
              value={params.sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className={ADMIN_INPUT}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={ADMIN_CARD}>
        <AdminLoadState status={status} isEmpty={!users.length} emptyText="No accounts match." onRetry={reload} />
        {status === 'ready' && users.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className={ADMIN_TABLE}>
                <thead>
                  <tr>
                    <th className={ADMIN_TH}>Name</th>
                    <th className={ADMIN_TH}>Contact</th>
                    <th className={ADMIN_TH}>Joined</th>
                    <th className={ADMIN_TH}>Role</th>
                    <th className={ADMIN_TH}>Account</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const id = userIdOf(user)
                    const isSelf = id === currentUser.id
                    const isBusy = busyId === id
                    const isAdmin = user.role === 'admin'
                    return (
                      <tr key={id} className={user.isActive ? '' : 'bg-cream-50'}>
                        <td className={ADMIN_TD}>
                          <span className="block font-semibold text-navy-800">{user.name}</span>
                          {isSelf && <span className="block text-xs text-muted">You</span>}
                        </td>
                        <td className={ADMIN_TD}>
                          {user.email && <span className="block break-all">{user.email}</span>}
                          {user.phone && <span className="block">{formatIndianMobile(user.phone)}</span>}
                        </td>
                        <td className={ADMIN_TD}>
                          {formatOrderDate(user.createdAt)}
                          <span className="block text-xs text-muted">
                            {user.lastLoginAt ? `Last sign-in ${formatOrderDate(user.lastLoginAt)}` : 'Never signed in'}
                          </span>
                        </td>
                        <td className={ADMIN_TD}>
                          <span className={`${ADMIN_BADGE} ${isAdmin ? 'bg-navy-800 text-white' : 'bg-lightblue-100 text-navy-800'}`}>
                            {isAdmin ? 'Admin' : 'Customer'}
                          </span>
                          {!isSelf && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                updateUser(
                                  user,
                                  { role: isAdmin ? 'user' : 'admin' },
                                  isAdmin ? `${user.name} is no longer an admin` : `${user.name} is now an admin`,
                                  isAdmin
                                    ? `Remove admin access from ${user.name}?`
                                    : `Make ${user.name} an admin? They will be able to change orders, products and accounts. They must sign in again for it to apply.`,
                                )
                              }
                              className="mt-1 block text-xs font-semibold text-navy-700 hover:underline disabled:text-muted"
                            >
                              {isAdmin ? 'Remove admin' : 'Make admin'}
                            </button>
                          )}
                        </td>
                        <td className={ADMIN_TD}>
                          <label className={`inline-flex items-center gap-2 ${isSelf ? '' : 'cursor-pointer'}`}>
                            <input
                              type="checkbox"
                              role="switch"
                              checked={user.isActive}
                              disabled={isSelf || isBusy}
                              onChange={() =>
                                updateUser(
                                  user,
                                  { isActive: !user.isActive },
                                  user.isActive ? `${user.name} is deactivated` : `${user.name} is active again`,
                                  user.isActive ? `Deactivate ${user.name}? They will not be able to sign in.` : undefined,
                                )
                              }
                              className="size-4 accent-navy-800"
                            />
                            <span
                              className={`${ADMIN_BADGE} ${user.isActive ? 'bg-leaf-600/10 text-success' : 'bg-cream-100 text-error'}`}
                            >
                              {user.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </label>
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
    </>
  )
}

export default AdminUsersPage