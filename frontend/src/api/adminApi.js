import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

const { ADMIN } = API_ENDPOINTS

/** `?a=1&b=2` from an object, leaving out empty values, so a cleared filter is simply not sent. */
function toQueryString(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

/**
 * The fields as one JSON string plus the files, the multipart shape the backend's image routes expect
 * (`productFields` + `images`, `categoryFields` + `image`). Without files the plain JSON body is sent instead.
 */
function withFiles(fields, { fieldsName, fileFieldName, files }) {
  if (!files?.length) return fields
  const formData = new FormData()
  formData.append(fieldsName, JSON.stringify(fields))
  files.forEach((file) => formData.append(fileFieldName, file))
  return formData
}

// List calls resolve to { data, meta }; everything else to the record itself.
export const adminApi = {
  summary: () => httpClient.get(ADMIN.SUMMARY),

  orders: {
    list: (params) => httpClient.getWithMeta(`${ADMIN.ORDERS}${toQueryString(params)}`),
    get: (id) => httpClient.get(ADMIN.ORDER(id)),
    updateStatus: (id, { status, note }) => httpClient.patch(ADMIN.ORDER_STATUS(id), { status, note: note || undefined }),
    updatePayment: (id, { paymentStatus, reference, note }) =>
      httpClient.patch(ADMIN.ORDER_PAYMENT(id), {
        paymentStatus,
        reference: reference || undefined,
        note: note || undefined,
      }),
  },

  products: {
    list: (params) => httpClient.getWithMeta(`${ADMIN.PRODUCTS}${toQueryString(params)}`),
    get: (id) => httpClient.get(ADMIN.PRODUCT(id)),
    /** `files` are the new images; `fields.images` places them with { newImageFileIndex }. */
    create: (fields, files) =>
      httpClient.post(ADMIN.PRODUCTS, withFiles(fields, { fieldsName: 'productFields', fileFieldName: 'images', files })),
    update: (id, fields, files) =>
      httpClient.patch(ADMIN.PRODUCT(id), withFiles(fields, { fieldsName: 'productFields', fileFieldName: 'images', files })),
    /** Soft delete: the product is unpublished, never removed, because orders point at it. */
    remove: (id) => httpClient.delete(ADMIN.PRODUCT(id)),
  },

  categories: {
    // Not paginated: there are only a handful, in display order.
    list: () => httpClient.get(ADMIN.CATEGORIES),
    get: (id) => httpClient.get(ADMIN.CATEGORY(id)),
    create: (fields, file) =>
      httpClient.post(
        ADMIN.CATEGORIES,
        withFiles(fields, { fieldsName: 'categoryFields', fileFieldName: 'image', files: file ? [file] : [] }),
      ),
    update: (id, fields, file) =>
      httpClient.patch(
        ADMIN.CATEGORY(id),
        withFiles(fields, { fieldsName: 'categoryFields', fileFieldName: 'image', files: file ? [file] : [] }),
      ),
    /** Refused with 409 CATEGORY_NOT_EMPTY while products still use it. */
    remove: (id) => httpClient.delete(ADMIN.CATEGORY(id)),
  },

  users: {
    list: (params) => httpClient.getWithMeta(`${ADMIN.USERS}${toQueryString(params)}`),
    /** Only name, role and isActive can change. */
    update: (id, changes) => httpClient.patch(ADMIN.USER(id), changes),
  },

  enquiries: {
    list: (params) => httpClient.getWithMeta(`${ADMIN.ENQUIRIES}${toQueryString(params)}`),
    /** Opening a new enquiry marks it read. */
    get: (id) => httpClient.get(ADMIN.ENQUIRY(id)),
    updateStatus: (id, status) => httpClient.patch(ADMIN.ENQUIRY(id), { status }),
  },
}

export default adminApi