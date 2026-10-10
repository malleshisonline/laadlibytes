import React from 'react'
import { Link } from 'react-router'

import heroImage from '../../../assets/backgrounds/hero-vrindavan.avif'
import chikkiRevolutionPlaque from '../../../assets/illustrations/chikkirevolution.avif'
import chikkiMascot from '../../../assets/illustrations/mascot-waving-with-flute.avif'
import peacockRight from '../../../assets/illustrations/peacockright.avif'
import { APP_ROUTES } from '../../../constants/appRoutepoints.js'
import GoldenDivider from '../../common/GoldenDivider.jsx'

const chikkiVarieties = [
    {
        name: 'Women Wellness',
        description: 'Classic & Crunchy',
    },
    {
        name: 'Millets n Nuts',
        description: 'Rich & Nutty',
    },
    {
        name: 'Kids Wellness',
        description: 'Roasted Sesame Goodness',
    },
    {
        name: 'Fruits Variants',
        description: 'Pure Traditional Sweetness',
    },
    {
        name: 'Nuts n Seeds',
        description: 'A Delicious Combination',
    },
    {
        name: 'Peanut Chikkis',
        description: 'Light & Guilt-Free',
    },
]

const SlideOne = () => {
    return (
        <div className='relative flex min-h-104 w-full items-center justify-center pt-4 md:min-h-112 lg:aspect-1920/823 lg:min-h-0'>

            {/* Background */}
            <div className='absolute inset-x-0 top-0 -bottom-6 overflow-hidden lg:-bottom-8'>
                <img
                    src={heroImage}
                    alt=''
                    aria-hidden='true'
                    width='1920'
                    height='823'
                    fetchPriority='high'
                    className='h-full w-full scale-[1.02] object-cover object-top-left blur-[2px]'
                />

                <div
                    aria-hidden='true'
                    className='absolute inset-0 bg-linear-to-b from-navy-950/35 via-transparent to-navy-950/25'
                />
            </div>

            <img
                src={peacockRight}
                alt=''
                aria-hidden='true'
                width='1312'
                height='1199'
                decoding='async'
                className='pointer-events-none absolute top-1 right-0 z-10 w-16 select-none sm:w-20 md:hidden'
            />

            {/* Content */}
            <div className='relative z-10 w-full px-3 mt-20 pb-5 text-center sm:px-4 md:mb-12 md:px-6 md:pb-0 lg:mb-16'>

                {/* Revolution banner - unchanged */}
                <img
                    src={chikkiRevolutionPlaque}
                    alt='The Chikki Revolution has arrived'
                    width='1771'
                    height='888'
                    fetchPriority='high'
                    className='mx-auto mb-2 h-auto w-56 sm:w-72 md:w-80 lg:w-60 xl:w-80 2xl:w-96'
                />

                {/* Main heading */}
                <div className='mx-auto max-w-3xl'>

                    <p className='text-[12px] md:text-[14px] font-extrabold tracking-[0.14em] text-[#01101b] sm:text-[#0a0040] text-shadow-sm text-shadow-cream-50 uppercase sm:text-xs sm:tracking-[0.2em] '>
                        Traditional Taste · Six Delicious Varieties
                    </p>

                    <h1 className='mt-1 font-display text-xl leading-tight font-semibold text-navy-950 text-shadow-md text-shadow-cream-50 sm:text-2xl sm:text-caramel-700 sm:text-shadow-cream-100 md:text-3xl xl:text-4xl'>
                        Six Varieties. One Love for Tradition.
                    </h1>

                    <p className='mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-navy-950 font-bold md:text-lg sm:text-sm sm:font-extrabold'>
                        Discover our collection of traditionally crafted chikkis,
                        made with jaggery, nuts and seeds for an authentic taste.
                    </p>

                </div>

                {/* Six category cards */}
                <div className='mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6'>

                    {chikkiVarieties.map((item) => (
                        <div
                            key={item.name}
                            className='group relative overflow-hidden rounded-2xl border border-white/80 bg-linear-to-br from-white/95 via-cream-50/95 to-cream-100/90 px-2 py-3 shadow-[0_6px_18px_-10px_rgba(0,38,74,0.65)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-caramel-500/60 hover:shadow-lg sm:px-3 sm:py-3.5'
                        >
                            <div className='mx-auto mb-2 h-1 w-8 rounded-full bg-caramel-500 transition-all duration-300 group-hover:w-12' />

                            <h2 className='font-display text-[11px] font-bold leading-tight text-navy-950 sm:text-sm'>
                                {item.name}
                            </h2>

                            <p className='mt-1 text-[10px] font-medium leading-snug text-navy-800/75 sm:text-[11px]'>
                                {item.description}
                            </p>
                        </div>
                    ))}

                </div>

               

                <GoldenDivider className='mt-3 text-caramel-500 sm:mt-4' />

            </div>

            {/* Mascot */}
            <img
                src={chikkiMascot}
                alt=''
                aria-hidden='true'
                width='400'
                height='400'
                decoding='async'
                className='pointer-events-none absolute right-2 bottom-0 hidden w-28 select-none md:block md:right-6 md:w-40 lg:right-10 lg:w-52'
            />

        </div>
    )
}

export default SlideOne