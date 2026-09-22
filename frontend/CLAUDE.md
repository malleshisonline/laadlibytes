# Laadli Bytes — Frontend Design Guide for Claude Code

File location: `frontend/CLAUDE.md`
Read this file fully before creating or editing any page, component or style in the `frontend` folder.

---

## 1. Project Rules

| Item | Decision |
|---|---|
| Framework | React with Vite (not Next.js) |
| Language | JavaScript (`.jsx`, `.js`), not TypeScript |
| Styling | Tailwind CSS v4 only, using the tokens in `src/styles/global-styles.css` |
| State management | Redux Toolkit (`src/redux/`) |
| API calls | Axios, only inside `src/services/` |
| Icons | `lucide-react` |
| Backend | Express API in the `backend` folder. **Never modify anything in `backend`.** |

Coding rules:
1. Never hard-code colours (no `#043b65`, no `bg-[#...]`). Always use token classes such as `bg-navy-800`.
2. No inline `style={{}}` for colours, fonts or spacing.
3. Use the reusable classes from `global-styles.css` (`btn-primary`, `product-card`, `input-field`, etc.) before writing new utility combinations.
4. File names must describe their purpose: `ProductCard.jsx`, `productApiService.js`, `jasmine-flowers-top-left.webp`.
5. Ask before installing any new library.

---

## 2. Visual Direction

**Theme:** Devotional, warm and joyful. Watercolour illustrations of Vrindavan (temples, the Yamuna river, peacock feathers, jasmine flowers, green leaves) combined with a clean white layout, deep navy text and warm chikki-coloured product cards. A friendly chikki mascot character appears in hero sections, banners and empty states.

**Feeling to achieve:** Traditional and trustworthy, but light and friendly. Plenty of white space. Illustrations provide the richness; the interface itself stays calm and simple.

**Layout pattern used on every page:**
1. Header (white, logo left, menu centre, search/account/cart right)
2. Illustrated hero banner (watercolour Vrindavan scene, heading centred)
3. Page content on a white or very light blue background
4. Navy footer with flower decorations in the corners

---

## 3. Colour Palette

All colours are defined in `src/styles/global-styles.css` inside `@theme`. Use them with any Tailwind prefix: `bg-`, `text-`, `border-`, `ring-`, `from-`, etc.

### Brand Navy
| Token class | Hex | Use for |
|---|---|---|
| `navy-950` | `#00264A` | Deepest shade, rarely used |
| `navy-900` | `#002F58` | Footer background |
| `navy-800` | `#043B65` | **Primary colour**: headings, primary buttons, active menu item, active tab |
| `navy-700` | `#145688` | Hover state of navy buttons, links |
| `navy-600` | `#1D68A7` | Blue promo bands, focus outline |

### Light Blue
| Token class | Hex | Use for |
|---|---|---|
| `lightblue-300` | `#BBD6E5` | Dividers on blue sections |
| `lightblue-200` | `#D7E8F2` | Input focus ring, soft highlights |
| `lightblue-100` | `#E8F1F6` | Alternate section background |
| `lightblue-50` | `#F4F8FB` | Very light page tint |

### Cream and Chikki Tones
| Token class | Hex | Use for |
|---|---|---|
| `cream-50` | `#FFFDF8` | Category card background |
| `cream-100` | `#FAF3E7` | Product image area inside cards, badges |
| `cream-200` | `#EFDBBB` | Category card border |
| `caramel-500` | `#D0964E` | Small accents: star ratings, highlights |
| `caramel-700` | `#995B2E` | Accent text on cream backgrounds |
| `cocoa-900` | `#462B1D` | Rare dark brown accent |

### Nature Accents
| Token class | Hex | Use for |
|---|---|---|
| `leaf-600` | `#4F7A3A` | "In stock", natural/eco badges |
| `peacock-600` | `#1E7F8A` | Decorative use only |

### Neutrals and Status
| Token class | Hex | Use for |
|---|---|---|
| `page` | `#FCFCFC` | Main page background |
| `surface` | `#FFFFFF` | Cards, forms, modals, header |
| `heading` | `#043B65` | All headings |
| `body` | `#34495E` | Paragraph text |
| `muted` | `#5B6C80` | Helper text, placeholders, captions |
| `line` | `#DBE6EE` | Borders, dividers, input borders |
| `success` | `#2E7D4F` | Success messages |
| `warning` | `#C9851B` | Warnings, low stock |
| `error` | `#C0392B` | Errors, validation messages |

**Colour proportions:** about 70% white/light backgrounds, 20% navy, 10% cream and caramel accents. Illustrations carry the other colours.

---

## 4. Typography

Fonts are installed locally (no Google Fonts link):
```bash
npm install @fontsource-variable/merienda @fontsource-variable/nunito
```
They are already imported at the top of `global-styles.css`.

| Role | Font | Tailwind class | Notes |
|---|---|---|---|
| Headings, hero titles, section titles | **Merienda** (calligraphic, friendly) | `font-display` | Applied automatically to `h1`–`h4` |
| Body, menu, buttons, forms, prices | **Nunito** (rounded, easy to read) | `font-sans` (default) | Applied automatically to `body` |

Merienda and Nunito are the closest free matches to the approved design. If the designer supplies the original font names, replace them in `global-styles.css` only.

### Type Scale
| Element | Mobile | Desktop | Weight | Font |
|---|---|---|---|---|
| Hero title ("Pure Goodness from Vrindavan") | `text-3xl` (30px) | `text-5xl` (48px) | 600 | Merienda |
| Page title ("Our Products", "Your Cart") | `text-3xl` | `text-4xl` (36px) | 600 | Merienda |
| Section title ("Our Best Sellers") | `text-2xl` (24px) | `text-3xl` (30px) | 600 | Merienda |
| Card title (product name) | `text-sm` (14px) | `text-sm` | 700 | Nunito |
| Body text | `text-base` (16px) | `text-base` | 400 | Nunito |
| Small text, captions | `text-sm` / `text-xs` | same | 400 | Nunito |
| Buttons | `text-sm` | `text-sm` | 600 | Nunito |
| Price | `text-base` | `text-base` | 700 | Nunito |

Rules:
1. Use Merienda only for headings. Never for paragraphs, buttons, forms or prices.
2. Keep paragraph width under about 70 characters (`max-w-content` or `max-w-prose`).
3. Hero and page titles are centred. Section titles on the Home page are centred. Form labels and body text are left aligned.

---

## 5. Layout and Spacing

| Item | Value | Class |
|---|---|---|
| Maximum page width | 1200px | `page-container` (includes side padding) |
| Maximum text width | 760px | `max-w-content` |
| Vertical space between sections | 48px mobile, 64px desktop | `page-section` |
| Gap between cards | 16px mobile, 24px desktop | `gap-4 md:gap-6` |
| Card inner padding | 16px | `p-4` |
| Form card padding | 24px mobile, 32px desktop | `form-card` |

### Grids
| Content | Mobile | Tablet (`md`) | Desktop (`lg`) |
|---|---|---|---|
| Product cards (Home best sellers, Product Listing) | 2 columns | 3 columns | 4–5 columns (3 when the filter sidebar is shown) |
| Category cards (Shop / Categories page) | 2 columns | 3 columns | 3 columns |
| 56 Bhog carousel on Home | Horizontal scroll | Horizontal scroll | 6 visible, arrows left and right |
| Footer | 1 column | 2 columns | 4 columns (logo, Quick Links, Customer Care, Connect With Us) |
| Product Listing | Filters open in a drawer | Filters in a drawer | Filter sidebar left (about 240px), products right |
| Cart | Stacked | Stacked | Items left, Price Details and Apply Coupon below or right |
| Checkout | Stacked | Stacked | Form left (about 60%), Order Summary right (about 40%) |
| Login / Signup | Form only | Form only | Illustration left, form card right |

---

## 6. Shape, Borders and Shadows

| Item | Value | Class |
|---|---|---|
| Buttons and inputs | 8px radius | `rounded-button` |
| Cards | 14px radius | `rounded-card` |
| Hero banners, promo bands | 20px radius | `rounded-section` |
| Pills, badges, carousel dots | Full | `rounded-full` |
| Default card shadow | Soft navy tint | `shadow-card` |
| Card hover shadow | Stronger | `shadow-card-hover` |
| Login and contact form cards | Large soft shadow | `shadow-form` |
| Header bottom edge | Hairline | `shadow-header` |
| Borders | 1px `line` colour | `border border-line` |

Never use pure black shadows or thick borders.

---

## 7. Components (match the approved design)

Reusable class names are in `global-styles.css`. Component files go in `src/components/`.

### Header — `components/layout/StoreHeader.jsx`
- White background, `shadow-header`, sticky at top.
- Left: logo (`src/assets/brand/laadli-bytes-logo.svg`, height `h-10 md:h-12`).
- Centre menu: Home, About, Shop, Categories, 56 Bhog, Contact. Active item: `text-navy-800 font-semibold` with a 2px underline.
- Right: Search, Account and Cart icons (`lucide-react`: `Search`, `User`, `ShoppingCart`), cart shows a small caramel count badge.
- Mobile: menu hidden; use the mobile bottom navigation (see Section 10).

### Hero Banner — `components/sections/PageHeroSection.jsx`
- Full-width watercolour Vrindavan background image, `rounded-section` inside `page-container` on desktop.
- Heading centred, Merienda, `text-navy-800`; subtitle below in Nunito `text-body`.
- Home hero: one `btn-primary` ("Shop Now") and carousel dots.
- Mascot may appear bottom-right; flowers and leaves in corners (decorations).
- Props: `title`, `subtitle`, `backgroundImage`, `buttonText`, `buttonLink`, `showMascot`.

### Blue Promo Band — `components/sections/PromoBanner.jsx`
- Class `promo-band`. White heading in Merienda, white subtitle, `btn-light` button.
- Examples: "A Taste of Tradition", "56 Bhog", "Goodness in Every Bite".
- Product image or mascot on one side, flowers and peacock feather as decorations.

### Product Card — `components/product/ProductCard.jsx`
- Class `product-card`.
- Top: `product-card-image-area` (cream background) with the product image centred.
- Below: product name (`text-sm font-bold text-navy-800`), price (`product-price`), MRP struck through when higher than price (`product-mrp`), full-width `btn-add-to-cart`.
- Whole card links to the product details page; the Add to Cart button stops the link click.

### Category Card — `components/category/CategoryCard.jsx`
- Class `category-card`. Round product image, category name, small arrow icon (`ArrowRight`) below.

### Buttons
| Class | Look | Use |
|---|---|---|
| `btn-primary` | Navy fill, white text | Main action: Shop Now, Login, Proceed to Checkout, Send Message |
| `btn-light` | White fill, navy text | On blue promo bands: Explore Now, View All Products |
| `btn-outline` | White with border | Secondary: Continue with Google, Read More |
| `btn-add-to-cart` | Small navy, full width | Inside product cards |

### Forms (Login, Signup, Checkout, Contact, Track Order)
- Label: `form-label`. Input: `input-field`. Error: add `input-error` to the input and show `form-error-text` below.
- Required fields marked with a red asterisk.
- Login / Signup uses two tabs at the top of the form card; active tab has navy text and a navy underline.

### Footer — `components/layout/StoreFooter.jsx`
- Class `site-footer`. Four columns: logo (white version), Quick Links, Customer Care, Connect With Us (social icons and newsletter email input with a Subscribe button).
- Jasmine flower decorations in the bottom corners.
- Copyright line: use the current year from code (`new Date().getFullYear()`), not a fixed year.

### Other page components
| Page | Components |
|---|---|
| Cart | `CartItemRow` (image, name, price, quantity stepper, total), `ApplyCouponBox`, `PriceDetailsBox` |
| Checkout | `CheckoutStepper` (1 Shipping Address, 2 Payment, 3 Order Summary), `ShippingAddressForm`, `PaymentMethodOptions`, `OrderSummaryBox` |
| Track Order | `TrackOrderForm`, `OrderTrackingSteps` (Order Placed, Processing, Shipped, Out for Delivery) |
| FAQ | `FaqAccordion` (question rows with `+` / `−`, one open at a time) |
| Contact | `ContactDetails`, `ContactForm` |
| About | `OurStorySection`, `ValuesRow`, `OurPromiseSection` |

---

## 8. Images and Illustrations

### Where images are stored
| Type | Location | How to use |
|---|---|---|
| Logo, backgrounds, decorations, hero scenes, banners, mascot | `src/assets/<folder>/` | `import image from "../../assets/..."` |
| Favicon, social share image | `public/` | Referenced in `index.html` |
| Product and category photos | Backend (uploaded through Admin) | Use the URL returned by the API |

### Asset folders
```
src/assets/
├── brand/            laadli-bytes-logo.svg, laadli-bytes-logo-white.svg
├── backgrounds/      hero and page background scenes
├── decorations/      flowers, leaves, peacock feather
├── mascot/           chikki mascot poses
├── banners/          images inside blue promo bands
└── bhog-varieties/   56 Bhog images (until they become backend products)
```

### Naming
Lowercase words joined with hyphens, describing what and where:
`home-hero-vrindavan-desktop.webp`, `home-hero-vrindavan-mobile.webp`, `jasmine-flowers-top-left.webp`, `peacock-feather.webp`, `mascot-waving.webp`, `mascot-holding-cart.webp`.

### Format and size limits
| Image | Size (px) | Format | Maximum file size |
|---|---|---|---|
| Hero background, desktop | 1920 × 800 | WebP | 150 KB |
| Hero background, mobile | 768 × 900 | WebP | 70 KB |
| Promo band image | 700 × 500 | WebP | 60 KB |
| Flower / leaf decoration | 500 × 500 | WebP, transparent | 40 KB |
| Peacock feather | 300 × 600 | WebP, transparent | 30 KB |
| Mascot pose | 400 × 400 | WebP, transparent | 35 KB |
| Category / 56 Bhog image | 400 × 400 | WebP | 35 KB |
| Product image (from backend) | 800 × 800 | WebP | 80 KB |
| Logo, icons | — | SVG | 25 KB |

### Image loading rules
1. Hero image of each page: `fetchPriority="high"`, no lazy loading.
2. Every other image: `loading="lazy"` and `decoding="async"`.
3. Always set `width` and `height` attributes to prevent layout shift.
4. Large backgrounds use `<picture>` with a separate mobile image.
5. Product images use `object-contain` inside `product-card-image-area`.

### Decorations (flowers, leaves, feather, mascot)
- Use the `decoration-image` class plus a position, e.g. `decoration-image -top-4 -left-4 w-24 md:w-40`.
- Parent section must have `relative overflow-hidden`.
- Content inside must have `relative z-10` so text stays above decorations.
- Always `alt=""` and `aria-hidden="true"`.
- On mobile, make decorations smaller or hide some (`hidden md:block`) so they never cover text or buttons.
- Mascot usage: hero banners, promo bands, empty cart, empty search results, 404 page. Maximum one mascot per screen.

---

## 9. Icons

Use `lucide-react`, size `20` (small `16`), stroke width `1.75`, colour `text-navy-800` (white on blue bands).

| Design element | Icon |
|---|---|
| Search, Account, Cart | `Search`, `User`, `ShoppingCart` |
| 100% Natural Ingredients | `Leaf` |
| Traditional Recipes | `BookOpen` |
| Premium Quality | `Award` |
| Freshly Made with Love | `Heart` |
| Pure Ingredients | `Sprout` |
| Order Placed / Processing / Shipped / Out for Delivery | `ClipboardCheck`, `PackageOpen`, `Truck`, `MapPin` |
| Address, Phone, Email, Working Hours | `MapPin`, `Phone`, `Mail`, `Clock` |
| FAQ expand / collapse | `Plus`, `Minus` |
| Quantity stepper | `Minus`, `Plus` |
| Category card arrow | `ArrowRight` |

Social icons (Instagram, Facebook, YouTube, WhatsApp) should be simple SVG files in `src/assets/icons/`, since brand logos are not included in `lucide-react`.

---

## 10. Responsive Behaviour

Breakpoints (Tailwind defaults): `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px. Design mobile first.

| Area | Mobile | Desktop |
|---|---|---|
| Header menu | Hidden; logo, search and cart only | Full menu |
| Navigation | Fixed bottom bar with Home, Shop, 56 Bhog, Cart, Account icons | Top menu |
| Hero title | `text-3xl` | `text-5xl` |
| Product grid | 2 columns | 4–5 columns |
| Filters | Drawer opened by a "Filter" button | Left sidebar |
| Login illustration | Hidden | Shown left of the form |
| Decorations | Smaller, some hidden | Full size |

Minimum touch target on mobile: 44 × 44 px for buttons and icons.

---

## 11. Pages and Backend Status

| Page | Route | Backend API | Note |
|---|---|---|---|
| Home | `/` | Products, Categories | Ready |
| About Us | `/about` | None (static content) | Ready |
| Shop / Categories | `/categories` | `GET /categories` | Ready |
| Product Listing | `/products` | `GET /products` with filters | Ready |
| Product Details | `/products/:slug` | `GET /products/:idOrSlug` | Not in the design; follow Product Listing style |
| 56 Bhog | `/56-bhog` | Products (filtered) or static | Confirm with manager |
| Login / Signup | `/login`, `/register`, `/verify-otp` | Auth APIs | Ready. The design shows **Continue with Google** and **Forgot password**; the backend has no API for these yet. Do not build them until confirmed. |
| My Account | `/account` | `GET /users/me` | Ready |
| Cart | `/cart` | **Not built** | Build UI only when instructed |
| Checkout | `/checkout` | **Not built** | Build UI only when instructed |
| Track Order | `/track-order` | **Not built** | Build UI only when instructed |
| FAQ | `/faq` | None (static content) | Ready |
| Contact Us | `/contact` | **No contact API** | Confirm how messages should be sent |
| Admin pages | `/admin/...` | Admin APIs | Ready; design not provided, use the same tokens with a simple sidebar layout |

---

## 12. Accessibility and Quality Checklist

Before finishing any page, confirm:
1. Text contrast is readable (navy on white, white on navy; never light blue text on white).
2. Every button and link is reachable with the keyboard and shows the focus outline.
3. Every meaningful image has descriptive `alt` text; decorations use `alt=""`.
4. Form inputs have visible labels, not only placeholders.
5. The page works at 360px width without horizontal scrolling.
6. No image above the size limits in Section 8.
7. Spelling in all visible text is checked (for example "Savouries", "Chikki", "Vrindavan").

---

## 13. Do and Do Not

| Do | Do not |
|---|---|
| Use token classes (`bg-navy-800`, `text-muted`) | Hard-code hex colours or use arbitrary values like `bg-[#043b65]` |
| Use Merienda for headings only | Use Merienda for paragraphs, buttons or prices |
| Keep layouts white and spacious; let illustrations add colour | Add gradients, heavy shadows or extra colours not in the palette |
| Reuse `btn-primary`, `product-card`, `input-field` | Create new button styles for each page |
| Compress every image to WebP within the size limits | Add PNG or JPG files straight from a phone or AI tool |
| Keep one mascot per screen | Place mascot and many decorations everywhere |
| Ask before adding a library or changing the backend | Modify anything in the `backend` folder |