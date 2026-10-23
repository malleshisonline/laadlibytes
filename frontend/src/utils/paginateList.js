/**
 * One page of a list already held in the browser, with the same meta the API returns, so AdminPagination can
 * show it. `page` is clamped, so a list that shrank (a filter, a delete) never lands on an empty page.
 */
export function paginateList(items, page, limit) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const start = (currentPage - 1) * limit

  return {
    pageItems: items.slice(start, start + limit),
    meta: {
      page: currentPage,
      limit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  }
}

export default paginateList