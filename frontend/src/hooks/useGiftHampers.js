import { useCallback, useEffect, useMemo, useState } from 'react'

import { giftHamperApi } from '../api/giftHamperApi.js'
import { productApi } from '../api/productApi.js'

/** The hampers on sale. Returns { hampers, status: 'loading' | 'ready' | 'error', retry }. */
export function useGiftHampers() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ attempt: -1, hampers: [], status: 'loading' })

  useEffect(() => {
    let isCancelled = false
    giftHamperApi
      .list()
      .then((hampers) => {
        if (!isCancelled) setResult({ attempt, hampers: hampers ?? [], status: 'ready' })
      })
      .catch(() => {
        if (!isCancelled) setResult({ attempt, hampers: [], status: 'error' })
      })
    return () => {
      isCancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])
  const isCurrent = result.attempt === attempt
  return { hampers: isCurrent ? result.hampers : [], status: isCurrent ? result.status : 'loading', retry }
}

/**
 * One hamper by slug, like useProduct. Returns { hamper, status: 'loading' | 'ready' | 'not-found' | 'error', retry }.
 */
export function useGiftHamper(slug) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${slug}#${attempt}`
  const [result, setResult] = useState({ key: null, hamper: null, status: 'loading' })

  useEffect(() => {
    let isCancelled = false
    giftHamperApi
      .getBySlug(slug)
      .then((hamper) => {
        if (!isCancelled) setResult({ key: requestKey, hamper, status: 'ready' })
      })
      .catch((error) => {
        if (!isCancelled) {
          setResult({ key: requestKey, hamper: null, status: error.status === 404 ? 'not-found' : 'error' })
        }
      })
    return () => {
      isCancelled = true
    }
  }, [slug, requestKey])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])
  const isCurrent = result.key === requestKey
  return { hamper: isCurrent ? result.hamper : null, status: isCurrent ? result.status : 'loading', retry }
}

/** "Snack-a-Guava" and "snack a guava" are the same flavour. */
const toFlavourKey = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

// Flavours the gifting catalogue names differently from the product, as catalogue name → product name. The card
// keeps the catalogue's name; only the photo and link come from the product.
const FLAVOUR_PRODUCT_NAMES = {
  'Ragi Oats Ballet': 'Ragi-Oats-Peanut Ballet', // MN-09
}

const productKeyFor = (flavourName) => toFlavourKey(FLAVOUR_PRODUCT_NAMES[flavourName] ?? flavourName)

// The catalogue is 56 products, so one page of 100 holds every flavour. Loaded once per visit and shared.
let catalogueByFlavourKey = null

function loadCatalogueByFlavourKey() {
  catalogueByFlavourKey ??= productApi
    .list({ limit: 100 })
    .then((products) => new Map((products ?? []).map((product) => [toFlavourKey(product.name), product])))
    .catch((error) => {
      catalogueByFlavourKey = null // a later visit tries again
      throw error
    })
  return catalogueByFlavourKey
}

/**
 * Each flavour name of a hamper with its product, when one has the same name: [{ name, product | null }]. The
 * product gives the flavour card its photo and link. A flavour with no matching product (or while the catalogue
 * loads, or if it fails) still shows, by name only.
 */
export function useHamperFlavours(flavours = []) {
  const [catalogue, setCatalogue] = useState(null)

  useEffect(() => {
    let isCancelled = false
    loadCatalogueByFlavourKey()
      .then((byKey) => {
        if (!isCancelled) setCatalogue(byKey)
      })
      .catch(() => {})
    return () => {
      isCancelled = true
    }
  }, [])

  return useMemo(
    () => flavours.map((name) => ({ name, product: catalogue?.get(productKeyFor(name)) ?? null })),
    [flavours, catalogue],
  )
}

export default useGiftHampers