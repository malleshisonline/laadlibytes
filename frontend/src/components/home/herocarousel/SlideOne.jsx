import React from 'react'

import heroImage from '../../../assets/backgrounds/hero-vrindavan.avif'
import chikkiRevolutionPlaque from '../../../assets/illustrations/chikkirevolution.avif'
import chikkiMascot from '../../../assets/illustrations/mascot-waving-with-flute.avif'
import GoldenDivider from '../../common/GoldenDivider.jsx'

const SlideOne = () => {
    return (

        <div className='relative flex min-h-104 w-full items-center justify-center pt-4 md:min-h-112 lg:aspect-1920/823 lg:min-h-0'>

            <div className='absolute inset-x-0 top-0 -bottom-6 lg:-bottom-8'>
                <img
                    src={heroImage}
                    alt=''
                    aria-hidden='true'
                    width='1920'
                    height='823'
                    fetchPriority='high'
                    className='h-full w-full object-cover object-top-left'
                />
                <div
                    aria-hidden='true'
                    className='absolute inset-0 bg-linear-to-b from-navy-950/35 via-transparent to-navy-950/25'
                />
            </div>


            <div className='relative z-10 md:px-4 text-center md:mb-20'>

                <img
                    src={chikkiRevolutionPlaque}
                    alt='The Chikki Revolution has arrived'
                    width='1771'
                    height='888'
                    fetchPriority='high'
                    className='mx-auto mb-3 h-auto w-56 sm:w-72 md:w-80 lg:w-60 xl:w-80 2xl:w-96'
                />

                <div className='mx-4 max-w-2xl sm:mx-auto'>
                    <p className='text-xs font-extrabold tracking-[0.2em] text-cream-100 text-shadow-sm text-shadow-navy-950 uppercase sm:text-sm'>
                        6 Varieties · One Traditional Taste
                    </p>

                    <h1 className='mt-2 font-display text-2xl leading-tight font-semibold text-cream-50 text-shadow-lg text-shadow-navy-950 sm:text-3xl xl:text-4xl'>
                        Six Variants Of Chikkis,
                        <br />
                        One Love for Tradition
                    </h1>

                    <p className='mx-auto mt-3 max-w-xl text-sm leading-relaxed font-semibold text-white text-shadow-md text-shadow-navy-950 sm:text-base'>
                        Explore our collection of six delicious chikki varieties, crafted with
                        traditional ingredients, jaggery and carefully selected nuts and seeds.
                    </p>
                </div>

                <GoldenDivider className='mt-0 text-caramel-500' />
            </div>

            {/* Chikki mascot, bottom-right. Smaller on mobile so it never covers the content. */}
            <img
                src={chikkiMascot}
                alt=''
                aria-hidden='true'
                width='400'
                height='400'
                decoding='async'
                className='pointer-events-none absolute right-2 bottom-0 w-28 select-none sm:w-36 md:right-6 md:w-48 lg:right-10 lg:w-60'
            />
        </div>
    )
}

export default SlideOne 