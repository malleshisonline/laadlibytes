# Catalogue seed data

Two JSON arrays, read by `scripts/seedCatalogue.js` (`npm run seed` from `backend/`).

Both files are validated **before anything is written**. A single bad row aborts the whole run
with a list of problems, each labelled by SKU — nothing is half-seeded.

## `categories.json`

The six names below are authoritative and must not be edited without the client's say-so.
`Nuts n Seeds` and `Millets n Nuts` are deliberately separate categories.

| Key | Required | Notes |
| --- | --- | --- |
| `name` | yes | The join key. `products[].category` must match this **exactly**. |
| `slug` | no | Derived from `name` when omitted. |
| `description` | no | Empty string is treated as "not supplied". |
| `displayOrder` | no | Storefront order, not alphabetical. Defaults to 0. |
| `isActive` | no | Defaults to true. |

## `products.json`

**Required:** `sku`, `name`, `category`, `mrp`, `packSize`. Everything else is optional.

| Key | Type | Notes |
| --- | --- | --- |
| `sku` | string | Business key. The seeder upserts on it, so a rerun updates instead of duplicating. Uppercased on write. |
| `name` | string | |
| `category` | string | A **name** from `categories.json`, not an id. An unknown name aborts the run — the seeder never invents a category. |
| `mrp` | number | Whole rupees, not paise. |
| `price` | number | Defaults to `mrp` when omitted. May not exceed `mrp`. |
| `packSize` | object | `{ "value": 100, "unit": "g" }`. `unit` is one of `g`, `kg`, `ml`, `l`, `piece`. |
| `slug` | string | Derived from `name` when omitted. Lowercase letters, digits and hyphens only. |
| `description` | string | **Not supplied by the client yet.** `""` counts as missing and is reported in the run summary. |
| `ingredients` | string[] | One entry per ingredient — do not paste a single comma-joined line. |
| `allergenInfo` | string | One paragraph of prose. |
| `shelfLife` | string | **Not supplied by the client yet.** Free text, e.g. "6 months from packaging". |
| `nutritionPoints` | string[] | Max 8. |
| `taglines` | string[] | Max 5. |
| `stock` | integer | Defaults to 0. |
| `isActive` | boolean | Defaults to true. |
| `isFeatured` | boolean | Defaults to false. |

There is **no `images` key** — a row that still has one aborts the run. Images come from the
folders below.

Internal **Branding & Marketing Points are not a key here** — they stay in your own sheet.

## Images

The seeder uploads local files to Cloudinary itself and stores the returned URL and `publicId`.
Both folders are gitignored; create them yourself.

```
scripts/data/
  product-images/
    FF-01/            <- folder name = the product's SKU (case does not matter)
      1-front.jpg     <- sorted by name, numbers in natural order: the first file is the front
      2-back.jpg
      3-label.png
      4-nutrition.png
  category-images/
    fruit-variant.png <- file name = the category's slug
```

- PNG, JPG, WEBP or AVIF only (`.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`), 5 MB each at most — the same rules as the admin upload. The file's contents
  are checked, not just its extension.
- No limit on files per product. Prefix names with `1-`, `2-`, … so the order is explicit.
- A folder or file that matches no row aborts the run, so a typo in a SKU cannot go unnoticed.
- Files land in Cloudinary under `laadlibytes/<NODE_ENV>/products/<SKU>/` and
  `laadlibytes/<NODE_ENV>/categories/<slug>/`. Run with `NODE_ENV=production` for the live
  catalogue. The folders are created automatically.
- A product or category that **already has images keeps them**, and nothing is uploaded for it,
  so a rerun never uploads duplicates. Pass `--replace-images` to upload the local files over
  them; the old files are deleted from Cloudinary after the new ones are saved.
- A product with no local folder is never touched image-wise, even with `--replace-images`.
- If an upload or a save fails, the files already uploaded for that product are deleted and the
  run stops. Products before it are saved; rerun to continue — they are skipped.

After launch, new products and image changes go through the admin API instead.

## Current state

`products.json` holds **one** row, `FF-01 / Mango Alohas`, as a shape reference. Note that the
`FF-` prefix comes from the old "Fruit Flavoured" naming and will change when the real SKUs
arrive. Its `description`, `shelfLife`, `nutritionPoints` and `taglines` are deliberately left
empty rather than invented — the client has not supplied that copy, and the seeder will report
them as gaps.

## Flags

```bash
npm run seed -- --dry-run          # validate rows and image files; write and upload nothing
npm run seed                       # upsert; safe to rerun
npm run seed -- --replace-images   # also re-upload images for rows that already have some
npm run seed -- --fresh            # delete all products and categories (and their Cloudinary images) first
```