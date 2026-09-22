// In development Vite proxies /api to the backend (see vite.config.js), so the default is same-origin.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export default API_BASE_URL