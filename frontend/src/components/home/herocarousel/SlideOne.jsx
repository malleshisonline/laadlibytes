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

                <h1 style={{ color: '#FFC83C', textShadow: '2px 2px 4px rgba(60,20,10,0.85)' }} className='font-display text-3xl leading-tight font-semibold text-shadow-xs text-shadow-cocoa-900/30 sm:text-4xl xl:text-5xl'>
                    Made with Devotion,
                    <br />
                    Shared with Love
                </h1>
                <p className='mt-4 text-base text-navy-950 font-extrabold text-shadow-xs text-shadow-cocoa-900/30 md:text-lg'>
                    Traditional Chikkis • Made with Love
                </p>

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