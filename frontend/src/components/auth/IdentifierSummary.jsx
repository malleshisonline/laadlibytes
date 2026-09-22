import { Link } from 'react-router'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'

/** "Continuing as <identifier> · Change" — Change goes back to the identify step with it prefilled. */
function IdentifierSummary({ label, identifier }) {
  return (
    <>
      {label} <span className="font-semibold text-brand-navy-dark">{identifier}</span>{' '}
      <Link
        to={APP_ROUTES.IDENTIFY}
        state={{ identifier }}
        className="font-semibold text-brand-gold underline-offset-2 hover:underline"
      >
        Change
      </Link>
    </>
  )
}

export default IdentifierSummary