import { createContext } from 'react'

// { user, accessToken, setSession, clearSession } — provided by AuthProvider.jsx.
export const AuthContext = createContext(null)

export default AuthContext