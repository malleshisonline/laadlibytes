import { Link } from 'react-router'

import fruitVariantImage from '../../assets/CategoryCateglogue/FruitVariant.avif'
import kidsWellnessImage from '../../assets/CategoryCateglogue/kidswellness.avif'
import milletsNNutsImage from '../../assets/CategoryCateglogue/milletsnnuts.avif'
import nutsNSeedsImage from '../../assets/CategoryCateglogue/nutsnseeds.avif'
import peanutChikkiImage from '../../assets/CategoryCateglogue/peanutchikki.avif'
import womenWellnessImage from '../../assets/CategoryCateglogue/womenwellness.avif'
import { categoryProductsPath } from '../../content/navigationMenuItems.js'
import { useCategories } from '../../hooks/useCategories.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'

/**
 * The hero's category cards (components/home/herocarousel/SlideOne.jsx), zoomed in on their ingredients. Each card
 * is a tall arch with the ingredients in its lower half; `top` places that part in the middle of the circle (the
 * image is drawn at 170% of the circle's width, so it is 2.55 circles tall).
 */
const CATEGORY_ARTWORK = {
  'fruit-variant': { image: fruitVariantImage, top: 'top-[-113%]' },
  'nuts-n-seeds': { image: nutsNSeedsImage, top: 'top-[-116%]' },
  'millets-n-nuts': { image: milletsNNutsImage, top: 'top-[-123%]' },
  'women-wellness': { image: womenWellnessImage, top: 'top-[-139%]' },
  'kids-wellness': { image: kidsWellnessImage, top: 'top-[-134%]' },
  'peanut-chikki': { image: peanutChikkiImage, top: 'top-[-126%]' },
}

// Circle size per breakpoint: a little larger on big screens.
const CIRCLE_WIDTH_CLASSES = 'w-24 sm:w-28 md:w-36 lg:w-44 xl:w-48'

// Spacing is right padding, not a flex gap, so every copy of the list is exactly the same width and the loop
// never jumps.
const ITEM_CLASSES = 'shrink-0 pr-6 sm:pr-10 md:pr-14 lg:pr-20'

// The list is drawn this many times and the track moves by half its width (the marquee keyframes), so each half
// is already wider than the page and the row never shows a gap.
const COPY_COUNT = 4

const PLACEHOLDER_COUNT = 5

/** The category's picture: the hero artwork cropped to its ingredients, else its uploaded image. */
function CategoryPicture({ category }) {
  const artwork = CATEGORY_ARTWORK[category.slug]
  if (artwork) {
    return (
      <img
        src={artwork.image}
        alt=''
        width='1024'
        height='1536'
        loading='lazy'
        decoding='async'
        className={`absolute left-1/2 h-auto w-[170%] max-w-none -translate-x-1/2 ${artwork.top}`}
      />
    )
  }
  return (
    <img
      src={cloudinaryImageUrl(category.image.url, 400, 400)}
      alt=''
      width='200'
      height='200'
      loading='lazy'
      decoding='async'
      className='size-full object-cover'
    />
  )
}

/** One round category picture with its name below, linking to the products list filtered to it. */
function CategoryCircle({ category, isCopy }) {
  return (
    <li aria-hidden={isCopy || undefined} className={ITEM_CLASSES}>
      <Link
        to={categoryProductsPath(category.slug)}
        tabIndex={isCopy ? -1 : undefined}
        className={`group flex flex-col items-center gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-600 ${CIRCLE_WIDTH_CLASSES}`}
      >
        <span className='block w-full rounded-full bg-surface p-1 shadow-md ring-2 ring-cream-200 transition duration-500 group-hover:shadow-lg group-hover:shadow-caramel-500/25 group-hover:ring-caramel-500 md:p-1.5'>
          <span className='relative block aspect-square w-full overflow-hidden rounded-full bg-cream-100'>
            <span className='absolute inset-0 transition duration-700 group-hover:scale-110'>
              <CategoryPicture category={category} />
            </span>
          </span>
        </span>
        <span className='text-center text-sm font-bold text-navy-800 transition group-hover:text-navy-600 lg:text-base'>
          {category.name}
        </span>
      </Link>
    </li>
  )
}

/**
 * Home "Shop by Category": every category as a circle in a row that rolls slowly sideways without end, like a
 * passing train. Hover or keyboard focus pauses it. Renders nothing when no category has a picture.
 */
function CategoriesSection() {
  const { categories, isLoading } = useCategories()
  const shown = categories.filter((category) => CATEGORY_ARTWORK[category.slug] || category.image?.url)

  if (!isLoading && !shown.length) return null

  return (
    <section aria-labelledby='home-categories-heading' className='relative mt-10 overflow-hidden '>
      {/* A large, faint heading behind the moving circles. It sits outside the faded edges, so it never fades. */}
      <h2
        id='home-categories-heading'
        className='pointer-events-none absolute inset-x-0 top-1/6 z-0 -translate-y-1/2 text-center font-display text-4xl leading-none font-bold whitespace-nowrap text-caramel-500/20 select-none sm:text-6xl md:text-7xl lg:text-8xl '
      >
        Shop by Category
      </h2>
      <div className='relative z-10 mt-8 overflow-hidden mask-x-from-95% mask-x-to-100% md:mt-10'>
        {isLoading ? (
          <ul aria-hidden='true' className='flex justify-center py-3'>
            {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
              <li key={index} className={ITEM_CLASSES}>
                <span className={`flex flex-col items-center gap-3 ${CIRCLE_WIDTH_CLASSES}`}>
                  <span className='block aspect-square w-full animate-pulse rounded-full bg-cream-100' />
                  <span className='h-4 w-3/4 animate-pulse rounded bg-cream-100' />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className='flex w-max animate-[marquee_70s_linear_infinite] py-3 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]'>
            {Array.from({ length: COPY_COUNT }, (_, copy) =>
              shown.map((category) => (
                <CategoryCircle key={`${copy}-${category.id}`} category={category} isCopy={copy > 0} />
              )),
            )}
          </ul>
        )}
      </div>
    </section>
  )
}

export { CategoriesSection }
export default CategoriesSection