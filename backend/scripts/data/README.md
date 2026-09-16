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
| `images` | object[] | **No upper limit.** `images[0]` is the front of pack. |
| `stock` | integer | Defaults to 0. |
| `isActive` | boolean | Defaults to true. |
| `isFeatured` | boolean | Defaults to false. |

Each image is `{ "url": "…", "alt": "…" }`. Only `url` is required — paste the Cloudinary URL
straight from the dashboard. `publicId` is optional and only worth filling in if you have it;
it is what a future admin delete would hand to Cloudinary. Today each product has four images
(front, back, label, nutrition), but the schema accepts any number.

Internal **Branding & Marketing Points are not a key here** — they stay in your own sheet.

## Current state

`products.json` holds **one** row, `FF-01 / Mango Alohas`, as a shape reference. Note that the
`FF-` prefix comes from the old "Fruit Flavoured" naming and will change when the real SKUs
arrive. Its `description`, `shelfLife`, `nutritionPoints`, `taglines` and `images` are
deliberately left empty rather than invented — the client has not supplied that copy, and the
seeder will report them as gaps.

## Flags

```bash
npm run seed -- --dry-run   # validate only, write nothing
npm run seed                # upsert; safe to rerun
npm run seed -- --fresh     # delete all products and categories first
```