import React from 'react'
import { Link } from 'react-router'

import heroImagesecond from '../../../assets/backgrounds/heroImagesecond.avif'
import productCatalogue from '../../../assets/illustrations/product_catalogueimg.avif'

const SlideOne = () => {
  return (

    <div className='relative flex min-h-104 w-full items-center justify-center pt-4 md:min-h-112 lg:aspect-1920/823 lg:min-h-0'>

      <div className='absolute inset-x-0 top-0 -bottom-6 lg:-bottom-8'>
        <img
          src={heroImagesecond}
          alt=''
          aria-hidden='true'
          width='1920'
          height='823'
          fetchPriority='high'
          className='h-full w-full object-cover object-top-right md:object-top-left'
        />
      </div>


      <div aria-hidden='true' className='pointer-events-none absolute inset-x-0 top-0 -bottom-6 hidden overflow-hidden @container-size md:block lg:-bottom-8'>
        <div className='absolute top-0 left-0 aspect-1915/821 w-[max(100cqw,calc(100cqh*1915/821))]'>
          <img
            src={productCatalogue}
            alt=''
            width='2076'
            height='757'
            decoding='async'
            className='absolute bottom-[23%] left-[25.8%] w-[34%] -translate-x-1/2 select-none lg:w-[37%]'
          />
        </div>
      </div>


      <div className='relative z-10 px-4 md:mr-[2%] md:mb-20 md:ml-auto lg:mr-[10%] mt-10 lg:mt-40'>
        
        <div className='mx-auto max-w-sm text-center text-white text-shadow-xs text-shadow-navy-950/60 md:mx-0 md:w-[40vw] md:max-w-xl md:text-left'>
          {/* One heading, two lines: a light lead-in and the large key word. h2 because slide 1 owns the h1. */}
          <h2 className='font-display leading-tight'>
            <span className='block text-2xl font-light sm:text-3xl lg:text-4xl'>A Taste of</span>
            <span className='block text-4xl font-semibold sm:text-5xl md:text-6xl xl:text-7xl'>Tradition</span>
          </h2>

          <p className='mt-3 text-sm leading-relaxed text-white/90 sm:text-base md:mt-4 xl:text-lg'>
            At Laadli Bytes, every pack is made with attention to quality, flavour, and customer satisfaction.
          </p>

          <p className='mt-3 text-sm font-semibold tracking-wide text-caramel-500 sm:text-base md:mt-4 xl:text-lg'>
            Join the Laadli Bytes Family
          </p>

          {/* Centred under the text block on every screen, even where the text itself is right-aligned. */}
          <div className='mt-8 flex justify-center md:mt-10 xl:mt-12'>
            <Link
              to='/shop'
              className='inline-flex min-h-11 min-w-44 items-center justify-center rounded-lg bg-white px-12 text-sm sm:min-w-52 font-semibold text-navy-800 shadow-md transition text-shadow-none hover:bg-lightblue-100'
            >
              Explore Now
            </Link>
          </div>
        </div>


        <img
          src={productCatalogue}
          alt='Laadli Bytes chikki packs: Strawberry Crush, Pro Focus, Good Gut and Peanut Chikki Vanilla'
          width='2076'
          height='757'
          decoding='async'
          className='mx-auto mt-5 md:mt-4 w-72 max-w-full select-none sm:w-96 md:hidden'
        />
      </div>
    </div>
  )
}

export default SlideOne 