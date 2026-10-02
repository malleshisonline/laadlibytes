import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { MapPin, Pencil, Plus, RotateCw, Star, Trash2 } from 'lucide-react'

import { addressApi } from '../../api/addressApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { accountErrorMessage } from '../../utils/accountErrorMessage.js'
import AddressCard from '../address/AddressCard.jsx'
import AddressForm from '../address/AddressForm.jsx'

import AccountCard from './AccountCard.jsx'

// Matches MAX_ADDRESSES in backend/src/modules/address/address.model.js.
const MAX_ADDRESSES = 5

const ACTION_BUTTON_CLASSES =
  'inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-navy-700 transition hover:bg-lightblue-100 disabled:cursor-not-allowed disabled:opacity-50'

const ADD_BUTTON_CLASSES =
  'inline-flex min-h-11 items-center gap-2 rounded-full bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:bg-lightblue-100 disabled:text-muted disabled:shadow-none'

/** Saved delivery addresses: add, edit, delete and choose the default (up to MAX_ADDRESSES). */
function AddressesSection() {
  const { user } = useAuth()

  const [addresses, setAddresses] = useState(null)
  const [loadStatus, setLoadStatus] = useState('loading') // 'loading' | 'error' | 'ready'
  const [reloadKey, setReloadKey] = useState(0)
  // null, { mode: 'add' } or { mode: 'edit', address }
  const [editor, setEditor] = useState(null)
  const [pendingId, setPendingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    let isCancelled = false
    addressApi
      .list()
      .then((list) => {
        if (isCancelled) return
        setAddresses(list)
        setLoadStatus('ready')
      })
      .catch(() => {
        if (!isCancelled) setLoadStatus('error')
      })
    return () => {
      isCancelled = true
    }
  }, [reloadKey])

  function retryLoad() {
    setLoadStatus('loading')
    setReloadKey((key) => key + 1)
  }

  // Errors are thrown back to AddressForm, which shows them on the form.
  async function handleSave(payload) {
    const isNew = editor.mode === 'add'
    const list = isNew ? await addressApi.create(payload) : await addressApi.update(editor.address.id, payload)
    setAddresses(list)
    setEditor(null)
    toast.success(isNew ? 'Address saved' : 'Address updated')
  }

  async function runAction(id, action, successMessage) {
    setPendingId(id)
    try {
      setAddresses(await action(id))
      toast.success(successMessage)
    } catch (error) {
      toast.error(accountErrorMessage(error))
    } finally {
      setPendingId(null)
      setConfirmDeleteId(null)
    }
  }

  const isFull = (addresses?.length ?? 0) >= MAX_ADDRESSES

  if (editor) {
    return (
      <AccountCard title={editor.mode === 'add' ? 'Add a new address' : 'Edit address'}>
        <AddressForm
          initialValues={editor.address}
          defaults={editor.mode === 'add' && !addresses?.length ? { name: user.name, phone: user.phone } : undefined}
          onSubmit={handleSave}
          onCancel={() => setEditor(null)}
          submitLabel={editor.mode === 'add' ? 'Save address' : 'Save changes'}
        />
      </AccountCard>
    )
  }

  let content
  if (loadStatus === 'loading') {
    content = (
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-cream-100" />
        ))}
      </div>
    )
  } else if (loadStatus === 'error') {
    content = (
      <div className="py-8 text-center">
        <p className="text-body">We couldn’t load your addresses right now.</p>
        <button
          type="button"
          onClick={retryLoad}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700"
        >
          <RotateCw size={16} strokeWidth={1.75} aria-hidden="true" />
          Try again
        </button>
      </div>
    )
  } else if (!addresses.length) {
    content = (
      <div className="py-8 text-center">
        <MapPin size={40} strokeWidth={1.5} className="mx-auto text-muted" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold text-navy-800">No saved addresses</h3>
        <p className="mt-1 text-body">Save an address now and checkout will be quicker.</p>
      </div>
    )
  } else {
    content = (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {addresses.map((address) => {
          const isPending = pendingId === address.id
          return (
            <li key={address.id}>
              <AddressCard address={address}>
                {confirmDeleteId === address.id ? (
                  <div className="flex w-full flex-wrap items-center gap-1">
                    <span className="mr-auto text-sm font-semibold text-navy-800">Delete this address?</span>
                    <button
                      type="button"
                      onClick={() => runAction(address.id, addressApi.remove, 'Address deleted')}
                      disabled={isPending}
                      className={`${ACTION_BUTTON_CLASSES} text-error hover:bg-red-50`}
                    >
                      {isPending ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={isPending}
                      className={ACTION_BUTTON_CLASSES}
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditor({ mode: 'edit', address })}
                      disabled={isPending}
                      className={ACTION_BUTTON_CLASSES}
                    >
                      <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(address.id)}
                      disabled={isPending}
                      className={ACTION_BUTTON_CLASSES}
                    >
                      <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                      Delete
                    </button>
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => runAction(address.id, addressApi.setDefault, 'Default address updated')}
                        disabled={isPending}
                        className={ACTION_BUTTON_CLASSES}
                      >
                        <Star size={14} strokeWidth={2} aria-hidden="true" />
                        {isPending ? 'Saving…' : 'Set as default'}
                      </button>
                    )}
                  </>
                )}
              </AddressCard>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <AccountCard
      title="Addresses"
      description={`Where we deliver your orders. You can save up to ${MAX_ADDRESSES}.`}
      action={
        loadStatus === 'ready' && (
          <button
            type="button"
            onClick={() => setEditor({ mode: 'add' })}
            disabled={isFull}
            title={isFull ? `You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.` : undefined}
            className={ADD_BUTTON_CLASSES}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Add address
          </button>
        )
      }
    >
      {isFull && (
        <p className="mb-4 rounded-xl bg-cream-100 px-4 py-2.5 text-sm text-body">
          You have saved {MAX_ADDRESSES} addresses, the most allowed. Delete one to add another.
        </p>
      )}
      {content}
    </AccountCard>
  )
}

export default AddressesSection