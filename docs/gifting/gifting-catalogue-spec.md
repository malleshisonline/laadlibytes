# Laadlibytes Festive Gifting: Implementation Specification

**Source document:** Laadlibytes Gifting Catalogue 2026 (6 pages, exported from Canva).
**Important:** the PDF contains no selectable text. Every page is one flattened image. This file is the text transcription. The page images are in `reference/` for layout reference only. Structured data is in `gifting-packs.json`.

If this specification and the page images ever disagree, do not guess. List the difference under "Questions" in your plan and ask the owner.

---

## 1. Goal

Add a "Festive Gifting" offering to the existing Laadlibytes storefront so that retail customers and corporate buyers can:

1. See the three gift packs, their prices and what each pack contains.
2. Understand the commercial terms before ordering.
3. Order a gift pack online (prepaid), or send an enquiry for bulk and custom hampers.

The existing site is assumed to be: React frontend, Node/Express backend, MongoDB (Mongoose), Cloudinary for images, Razorpay planned, deployed on Render, with a catalogue of 56 SKUs in 6 categories and a seeder at `backend/scripts/seedCatalogue.js`. **Verify all of this by reading the repository before planning.** Follow any `CLAUDE.md`, README and existing conventions.

## 2. The three gift packs (catalogue page 2)

All prices are **MRP per gift pack**, **GST included**. **Net weight is 180 g per gift pack.**

| Code | Name | MRP | Description (verbatim) |
|---|---|---|---|
| FK | Fruit Khazana | ₹299 | Fruit-forward millets, nuts, seeds & real fruit powders for a naturally sweet, tangy profile. |
| SGE | Super Grains Eight | ₹349 | Eight grains with millets and seeds, balanced with nuts & natural sweeteners for sustained energy. |
| GS | Golden Seven | ₹399 | Seven select grains, nuts, seeds & specialty inclusions for a richer, gourmet experience. |

Page headlines: FK "12 Fruity Chikkis. One Festive Collection"; GS "Golden Seven. Real Nuts. Real Seeds."; SGE "Super Grain Eight. Real Grains. Real Goodness."

## 3. What each pack contains (pages 3 to 5)

Look up products by **SKU** in the existing product data. Do not hardcode names or prices.

**Fruit Khazana (FK), 12 flavours:** Mango Alohas (FV-01), Apple Krnch (FV-02), Banana Bubble (FV-03), Strawberry Crush (FV-04), Lime Light (FV-05), Grape Kick (FV-06), Orange Squeeze (FV-07), Berry Twist (FV-08), Fig Yum (FV-09), Apricot Bloom (FV-10), Snack-a-Guava (FV-11), Palm n Pine (FV-12).
"Apple Krnch" is a deliberate brand spelling. Never correct it.

**Golden Seven (GS), 7 variants, shown in three groups:**
- Single-Nut Highlights: Cashew Candy (NS-01), Walnut Treat (NS-02), Almond Harvest (NS-04)
- Mixed & Trail: Nut Medley (NS-03), Pumpkin Almond Trail (NS-05)
- Seed-Focused: Seed Stick (NS-06), Raw Radiance (NS-07)

**Super Grains Eight (SGE), 9 variants listed on page 5:** Ragi Peanut Crunch (MN-01), Ragi Almond Magic (MN-02), Ragi Oats Ballet (MN-09), Jowar Peanut Munch (MN-03), Jowar Almond Mojo (MN-04), Bajra Peanut Punch (MN-05), Bajra Almond Charm (MN-06), Foxtail Peanut Brunch (MN-07), Foxtail Almond Joy (MN-08).
Note: the product sheet calls MN-09 "Ragi-Oats-Peanut Ballet". The catalogue calls it "Ragi Oats Ballet".

Each pack page ends with three highlight cards: "For Every Celebration: Family · Friends · Clients · Teams", a "Choose Your Flavours / Grains / Crunch" card, and "Create Your Hamper: Custom combinations available".

## 4. Commercial terms (verbatim, page 2)

1. **Payment:** 100% advance along with order confirmation.
2. **GST:** Included.
3. **Transportation:** Local Hyderabad delivery included; outstation To-Pay.
4. **Lead Time:** 2 weeks from receipt of 100% advance and confirmed artwork/approvals, if any.
5. **Returns:** Goods are sold on a "No Return / Non-refundable" basis.

Closing line: "Kindly share your purchase order at your earliest convenience, so we may block production slots as per the agreed lead time."

## 5. Brand copy to reuse (verbatim)

- Cover: "Festive Gifting Catalogue 2026". "Made with Devotion. Shared with Love." "Premium Chikkis • Thoughtfully Curated". Box text: "Premium Chikkis. Made with Devotion, Shared with Love." Lid text: "DEVOTION · CARE · WARMTH · PURITY. A heartfelt offering for every celebration."
- Letter (page 2), titled "A Small Offering, A Big Blessing": "Inspired by Shree Radha Rani's love for Kanha, each chikki in this box is her humble offering to you. May this prasad carry Radha–Krishna's blessings into your home and heart, filling your days with love, harmony, and joy. Jai Shri Radhe, Jai Shri Krishna."
- Page 6: "Snack Smarter. Snack Happier." Four benefits: Premium Quality ("We carefully select ingredients to ensure freshness and consistency."), Authentic Taste ("Traditional flavors with a modern touch."), Hygienic Production ("Prepared and packed with strict quality standards."), Convenient Packaging ("Easy to carry, easy to share, easy to enjoy."). Why Customers Love Us: Great Taste, Consistent Quality, Affordable Pricing, Family-Friendly Flavors, Freshness in Every Pack. Perfect For: School & College Breaks, Office Snacks, Tea-Time Gatherings, Family Functions, Travel & Picnics, Festive Gifting.
- Contact: Millet Bowl Food Products Pvt Ltd, Plot No 04, Mathrupuri Colony, Hyderabad – 500094. +91 80081 42786. sanjay.kumar@milletbowl.com. Keep contact details in configuration, not scattered through components.

## 6. Questions that must be answered before building (do not assume)

1. **Fixed or customisable packs?** The catalogue says "Choose Your Flavours" and "Create Your Hamper". Is each pack a fixed assortment, or does the buyer pick flavours? Recommended for version 1: three fixed packs, with custom hampers handled through an enquiry form.
2. **Pieces per pack.** Net weight is 180 g, but the catalogue images show 12 compartments on the cover and 16 on pages 3 to 5. How many pieces does a real pack hold, and which flavours are in each fixed pack?
3. **Pack names and counts.** "Super Grains Eight" (page 2) versus "Super Grain Eight" (page 5). SGE is called "Eight" but lists nine variants. Which name and count is correct?
4. **Online checkout or enquiry only for version 1?** The terms mention purchase orders and artwork approvals, which suggest a corporate, offline flow.
5. **Outstation "To-Pay" shipping.** Online prepaid checkout cannot collect "To-Pay" freight. Options: charge shipping at checkout, quote outstation orders by enquiry, or accept online orders for Hyderabad only.
6. **What counts as "local Hyderabad"?** A list of pincodes is needed.
7. **Artwork and customisation.** Is logo printing or a custom message card offered? Any minimum quantity or price slabs for bulk orders? None are stated in the catalogue.
8. **GST invoicing.** GST rate and HSN code for the packs, and whether business buyers must provide a GSTIN. Confirm with the accountant.
9. **Return policy wording.** The catalogue says "No Return / Non-refundable". The final policy text, including damaged or wrong-item handling, should be reviewed by the owner and an adviser. Do not invent policy wording.
10. **Lead-time display.** How should the estimated delivery date and the Diwali cut-off be shown?

## 7. Requirements

**Data and backend**
- Add the three packs to the existing catalogue (preferred: a new category "Festive Gifting" or "Gift Packs", reusing the Product model with a few extra fields), not a parallel system. Suggested extra fields: `packType`, `netWeightGrams`, `leadTimeDays` (14), `madeToOrder`, `includedSkus`, `giftMessageEnabled`.
- Extend the existing seeder and data files rather than writing a second seeder. Seeding must remain idempotent and support `--dry-run`.
- Corporate enquiry endpoint with validation, rate limiting or spam protection, storage in MongoDB, and an email notification to the contact address in configuration.
- Keep all existing backend tests passing. Add tests for every new endpoint and rule.

**Storefront**
- A "Festive Gifting" landing page: hero, the three pack cards (name, description, MRP, "180 g"), a "what is inside" section, the commercial terms summary, FAQ, and a corporate enquiry call to action.
- A detail page per pack: image gallery, price, quantity, list of flavours (reuse the existing per-flavour product images), delivery and lead-time information, and an optional gift message.
- Navigation, home page section and footer links to the new page.
- Corporate and bulk enquiry form: name, company, email, phone, GSTIN (optional), pack mix and quantities, delivery city and pincode, required-by date, notes, optional logo upload.
- Mobile first. Match the existing design system and brand colours. Pages must be fast: AVIF or WebP images with sizes and lazy loading.

**Checkout rules (only if the answer to Question 4 is "online")**
- Prepaid only, no cash on delivery.
- Show the lead time clearly before payment, and an estimated dispatch date.
- Require an acknowledgement of the returns policy before payment.
- Apply the shipping rule chosen in Question 5.
- Prices are GST inclusive. Display this clearly.

**Content and SEO**
- Page titles, meta descriptions and Open Graph images for the landing page and each pack. Product structured data (JSON-LD) on pack pages. Add pages to the sitemap.
- Policy pages for shipping, lead time and returns using the owner's approved wording.

## 8. Images and assets

Do not use the catalogue page images on the website. They are low-resolution, flattened, and contain baked-in text, the logo and prices. Place original assets in `docs/gifting/assets-source/` and publish optimised versions through the same pipeline as the existing product images. Use this naming pattern: `gift-<code>-<view>.avif`, for example `gift-fk-hero.avif`, `gift-fk-open-box.avif`, `gift-fk-tray-topdown.avif`.

The full asset checklist is maintained by the owner. If an asset is missing, use a clearly marked placeholder and list it in your plan. Never fabricate product photography.

## 9. Constraints

- Follow existing code conventions, folder structure, linting and test setup.
- Work on a feature branch. Make small commits, one per phase.
- Do not commit secrets, `.env` files or personal data.
- Do not change existing prices, existing products or existing policies without asking.
- Use catalogue wording exactly where it is quoted here. Do not invent claims about health, nutrition, shelf life or ingredients.
- Ask when anything is unclear. Do not guess.

## 10. Acceptance criteria

- The landing page and the three pack pages render correctly on mobile and desktop, with the correct prices, weights, descriptions and flavour lists (by SKU).
- Terms shown to customers match section 4 exactly.
- The enquiry form validates input, stores the enquiry and sends a notification.
- If checkout is included: a Hyderabad test order completes in Razorpay test mode, shows the lead time, and records the returns acknowledgement.
- All previous tests still pass. New tests cover the new logic.
- Lighthouse performance and accessibility scores on the new pages are at least as good as the existing product pages.
- The seeder runs cleanly with `--dry-run` and on a fresh database.
