import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { BadgeCheck, Pencil } from 'lucide-react'

import { userApi } from '../../api/userApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { accountErrorMessage } from '../../utils/accountErrorMessage.js'
import { formatIndianMobile } from '../../utils/addressValidation.js'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import FormField from '../ui/FormField.jsx'

import AccountCard from './AccountCard.jsx'

function VerifiedBadge({ verifiedAt }) {
  if (!verifiedAt) return <span className="text-xs font-semibold text-muted">Not verified</span>
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-success">
      <BadgeCheck size={14} strokeWidth={2} aria-hidden="true" />
      Verified
    </span>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-6">
      <dt className="w-36 shrink-0 text-sm font-semibold text-muted">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-navy-800">{children}</dd>
    </div>
  )
}

/** Name (editable), email and mobile with their verification state, and the member-since date. */
function ProfileSection() {
  const { user, updateUser } = useAuth()

  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function startEditing() {
    setName(user.name)
    setNameError('')
    setFormError('')
    setIsEditingName(true)
  }

  async function handleSaveName(event) {
    event.preventDefault()
    setFormError('')

    const trimmed = name.trim()
    if (trimmed.length < 2) return setNameError('Name must be at least 2 characters')
    if (trimmed.length > 60) return setNameError('Name must be at most 60 characters')
    if (trimmed === user.name) return setIsEditingName(false)

    setIsSaving(true)
    try {
      updateUser(await userApi.updateMe({ name: trimmed }))
      setIsEditingName(false)
      toast.success('Your name has been updated')
    } catch (error) {
      if (error.fieldErrors?.name) setNameError(error.fieldErrors.name)
      else setFormError(accountErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <AccountCard title="Profile" description="Your details for orders and delivery updates.">
      <dl>
        <DetailRow label="Name">
          {isEditingName ? (
            <form onSubmit={handleSaveName} noValidate className="w-full max-w-md space-y-3">
              <FormAlert>{formError}</FormAlert>
              <FormField
                id="name"
                label={<span className="sr-only">Name</span>}
                type="text"
                autoComplete="name"
                maxLength={60}
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setNameError('')
                }}
                error={nameError}
              />
              <div className="flex gap-2">
                <Button type="submit" isLoading={isSaving} loadingText="Saving…" className="max-w-32">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditingName(false)} disabled={isSaving} className="max-w-32">
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <span className="font-semibold wrap-break-word">{user.name}</span>
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-navy-700 transition hover:bg-lightblue-100"
              >
                <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                Edit
              </button>
            </>
          )}
        </DetailRow>

        <DetailRow label="Email">
          {user.email ? (
            <>
              <span className="break-all">{user.email}</span>
              <VerifiedBadge verifiedAt={user.emailVerifiedAt} />
            </>
          ) : (
            <span className="text-muted">Not added</span>
          )}
        </DetailRow>

        <DetailRow label="Mobile number">
          {user.phone ? (
            <>
              <span>{formatIndianMobile(user.phone)}</span>
              <VerifiedBadge verifiedAt={user.phoneVerifiedAt} />
            </>
          ) : (
            <span className="text-muted">Not added</span>
          )}
        </DetailRow>

        <DetailRow label="Member since">{memberSince}</DetailRow>
      </dl>
    </AccountCard>
  )
}

export default ProfileSection