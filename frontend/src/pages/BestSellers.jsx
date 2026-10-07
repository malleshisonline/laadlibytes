import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'

import heroImagesecond from '../assets/backgrounds/heroImagesecond.avif'
import productCatalogue from '../assets/illustrations/product_catalogueimg.avif'
import { Heart } from 'lucide-react'
import ProductCard from '../components/product/ProductCard'
import productApi from '../api/productApi'
import ProductPromiseStrip from '../components/product/ProductPromiseStrip'

const BestSellers = () => {

  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isCancelled = false

    productApi
      .list({ limit: 56 })
      .then((items) => {
        if (isCancelled) return

        // Only products where isFeatured === true
        const featuredProducts = items.filter(
          (product) => product.isFeatured === true
        )

        setProducts(featuredProducts)
        setStatus(featuredProducts.length ? 'ready' : 'hidden')
      })
      .catch(() => {
        if (!isCancelled) setStatus('hidden')
      })

    return () => {
      isCancelled = true
    }
  }, [])


  return (
    <>
      <div className='relative flex min-h-104 w-full items-center justify-center pt-4 md:min-h-112 lg:h-[480px] lg:min-h-0 xl:h-[480px] 2xl:h-[480px]'>        {/* Floating Chikki + Makhan Matki Animation */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-x-0 top-0 bottom-0 z-5 overflow-hidden'
        >
          {/* Chikki */}
          <span className='falling-hero-goodie absolute left-[4%] [animation-duration:13s] [animation-delay:-2s]'>
            <span className='inline-block h-4 w-5 rotate-12 rounded-[3px] border border-amber-300 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-800 shadow-[0_2px_6px_rgba(255,184,55,0.65)]'>
              <span className='block h-full w-full rounded-[3px] bg-[radial-gradient(circle_at_30%_30%,rgba(255,245,190,.9)_0_1px,transparent_1.5px)]' />
            </span>
          </span>

          {/* Makhan Matki */}
          <span className='falling-hero-goodie absolute left-[13%] [animation-duration:17s] [animation-delay:-8s]'>
            <span className='relative block h-5 w-5'>
              <span className='absolute top-0 left-1/2 h-2.5 w-4 -translate-x-1/2 rounded-[50%] bg-white shadow-[0_0_7px_rgba(255,255,255,.95)]' />
              <span className='absolute top-1.25 left-1/2 h-4 w-5 -translate-x-1/2 rounded-b-[45%] rounded-t-[25%] border border-amber-200 bg-gradient-to-br from-orange-300 via-amber-500 to-orange-700 shadow-[0_2px_7px_rgba(255,180,60,.55)]' />
              <span className='absolute top-2 left-1/2 h-0.5 w-5 -translate-x-1/2 bg-white/80' />
            </span>
          </span>

          {/* Chikki */}
          <span className='falling-hero-goodie absolute left-[23%] [animation-duration:15s] [animation-delay:-5s]'>
            <span className='inline-block h-3.5 w-4.5 -rotate-12 rounded-[3px] border border-amber-300 bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-800 shadow-[0_2px_6px_rgba(255,184,55,0.7)]' />
          </span>

          {/* Makhan Matki */}
          <span className='falling-hero-goodie absolute left-[33%] [animation-duration:19s] [animation-delay:-11s]'>
            <span className='relative block h-6 w-6'>
              <span className='absolute top-0 left-1/2 h-3 w-4.5 -translate-x-1/2 rounded-[50%] bg-white shadow-[0_0_8px_rgba(255,255,255,1)]' />
              <span className='absolute top-1.5 left-1/2 h-4.5 w-6 -translate-x-1/2 rounded-b-[45%] rounded-t-[25%] border border-yellow-200 bg-gradient-to-br from-orange-300 via-amber-500 to-orange-700 shadow-[0_2px_8px_rgba(255,180,60,.65)]' />
              <span className='absolute top-2.5 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-white/80' />
            </span>
          </span>

          {/* Chikki */}
          <span className='falling-hero-goodie absolute left-[44%] [animation-duration:14s] [animation-delay:-9s]'>
            <span className='inline-block h-4 w-5 rotate-18 rounded-[3px] border border-yellow-300 bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-800 shadow-[0_2px_7px_rgba(255,190,60,.7)]' />
          </span>

          {/* Makhan Matki */}
          <span className='falling-hero-goodie absolute left-[54%] [animation-duration:18s] [animation-delay:-4s]'>
            <span className='relative block h-5 w-5'>
              <span className='absolute top-0 left-1/2 h-2.5 w-4 -translate-x-1/2 rounded-[50%] bg-white shadow-[0_0_7px_white]' />
              <span className='absolute top-1.25 left-1/2 h-4 w-5 -translate-x-1/2 rounded-b-[45%] rounded-t-[25%] border border-yellow-200 bg-gradient-to-br from-orange-300 via-amber-500 to-orange-700 shadow-lg' />
              <span className='absolute top-2 left-1/2 h-0.5 w-5 -translate-x-1/2 bg-white/80' />
            </span>
          </span>

          {/* Chikki */}
          <span className='falling-hero-goodie absolute left-[64%] [animation-duration:16s] [animation-delay:-12s]'>
            <span className='inline-block h-3.5 w-4.5 rotate-[-18deg] rounded-[3px] border border-amber-300 bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-800 shadow-[0_2px_6px_rgba(255,184,55,.75)]' />
          </span>

          {/* Makhan Matki */}
          <span className='falling-hero-goodie absolute left-[73%] [animation-duration:20s] [animation-delay:-7s]'>
            <span className='relative block h-6 w-6'>
              <span className='absolute top-0 left-1/2 h-3 w-4.5 -translate-x-1/2 rounded-[50%] bg-white shadow-[0_0_8px_white]' />
              <span className='absolute top-1.5 left-1/2 h-4.5 w-6 -translate-x-1/2 rounded-b-[45%] rounded-t-[25%] border border-yellow-200 bg-linear-to-br from-orange-300 via-amber-500 to-orange-700 shadow-lg' />
              <span className='absolute top-2.5 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-white/80' />
            </span>
          </span>

          {/* Chikki */}
          <span className='falling-hero-goodie absolute left-[83%] [animation-duration:15s] [animation-delay:-3s]'>
            <span className='inline-block h-4 w-5 rotate-12 rounded-[3px] border border-yellow-300 bg-linear-to-br from-yellow-400 via-orange-500 to-amber-800 shadow-[0_2px_7px_rgba(255,190,60,.75)]' />
          </span>

          {/* Makhan Matki */}
          <span className='falling-hero-goodie absolute left-[92%] [animation-duration:18s] [animation-delay:-10s]'>
            <span className='relative block h-5 w-5'>
              <span className='absolute top-0 left-1/2 h-2.5 w-4 -translate-x-1/2 rounded-[50%] bg-white shadow-[0_0_7px_white]' />
              <span className='absolute top-1.25 left-1/2 h-4 w-5 -translate-x-1/2 rounded-b-[45%] rounded-t-[25%] border border-yellow-200 bg-linear-to-br from-orange-300 via-amber-500 to-orange-700 shadow-lg' />
              <span className='absolute top-2 left-1/2 h-0.5 w-5 -translate-x-1/2 bg-white/80' />
            </span>
          </span>
        </div>

        {/* Background */}
        <div className='absolute inset-x-0 top-0 -bottom-6 lg:-bottom-8'>
          <img
            src={heroImagesecond}
            alt=''
            aria-hidden='true'
            width='1920'
            height='823'
            fetchPriority='high'
            className='h-full w-full object-cover object-top-right md:object-top-left lg:object-bottom'
          />
        </div>

        {/* Desktop Product Catalogue */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-x-0 top-0 -bottom-6 hidden overflow-hidden @container-size lg:block lg:-bottom-8'
        >
          <div className='absolute top-0 left-0 aspect-1915/821 w-[max(100cqw,calc(100cqh*1915/821))]'>
            <img
              src={productCatalogue}
              alt=''
              width='2076'
              height='757'
              decoding='async'
              className='absolute bottom-[45%] left-[25.8%] w-[34%] -translate-x-1/2 select-none lg:w-[37%]'
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className='relative z-10 mt-6 px-4 lg:mb-4 lg:ml-auto lg:mt-12'>
          <div className='mx-auto max-w-sm text-center text-shadow-xs text-shadow-navy-950/60 lg:mx-0 lg:w-[40vw] lg:max-w-xl lg:text-left'>

            {/* Two-colour heading */}
            <h2 className='font-display leading-[1.05]'>

              <span className='block text-2xl font-light text-white sm:text-3xl lg:text-4xl'>
                A Little Extra Goodness
              </span>

              <span className='mt-1 block text-4xl font-semibold text-amber-500 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl xl:text-7xl'>
                for Laadli Ji
              </span>

            </h2>

            {/* Description */}
            <p className='mt-4 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base md:mt-5 xl:text-lg'>
              Meet the flavours our Laadli family keeps coming back for —
              wholesome ingredients, timeless recipes, and a little extra
              love in every bite.
            </p>

            {/* Best Seller Message */}
            <p className='mt-3 text-sm font-semibold tracking-wide text-white sm:text-base md:mt-4 xl:text-lg'>
              Most Loved • Most Craved • Made to Share
            </p>


          </div>

          {/* Mobile Product Catalogue */}
          <img
            src={productCatalogue}
            alt='Laadli Bytes chikki packs: Strawberry Crush, Pro Focus, Good Gut and Peanut Chikki Vanilla'
            width='2076'
            height='757'
            decoding='async'
            className='mx-auto mt-5 w-72 max-w-full select-none sm:w-96 lg:mt-4 lg:hidden'
          />
        </div>

      </div>

      <ProductPromiseStrip />

      <section className='bg-cream-50 px-4 pt-8 pb-8 sm:px-6 md:pt-10 md:pb-10'>
        <div className='mx-auto max-w-7xl text-center'>

          <h2 className='flex items-center justify-center gap-3 font-display text-3xl font-semibold text-navy-800 sm:text-4xl md:text-5xl'>

            <Heart
              size={26}
              strokeWidth={1.7}
              fill='currentColor'
              className='text-rose-400'
              aria-hidden='true'
            />

            <span>Handpicked by Our Customers</span>

            <Heart
              size={26}
              strokeWidth={1.7}
              fill='currentColor'
              className='text-rose-400'
              aria-hidden='true'
            />

          </h2>
          {status === 'ready' && (
            <div className='mt-20 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6'>
              {products.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                />
              ))}
            </div>
          )}


        </div>
      </section>
    </>

  )
}

export default BestSellers