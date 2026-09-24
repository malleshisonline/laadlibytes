import { createContext } from 'react'

// { user, isRestoringSession, setSession, clearSession, logout } — provided by AuthProvider.jsx.
export const AuthContext = createContext(null)

export default AuthContext