import React from 'react'
import { Link } from 'react-router'

import heroImage from '../../../assets/backgrounds/hero-vrindavan.avif'
import fruitVariantCardImage from '../../../assets/CategoryCateglogue/FruitVariant.avif'
import milletsNNutsCardImage from '../../../assets/CategoryCateglogue/milletsnnuts.avif'
import nutsNSeedsCardImage from '../../../assets/CategoryCateglogue/nutsnseeds.avif'
import womenWellnessCardImage from '../../../assets/CategoryCateglogue/womenwellness.avif'
import kidsWellsnessCardImage from '../../../assets/CategoryCateglogue/kidswellness.avif'
import peanutChikkiCardImage from '../../../assets/CategoryCateglogue/peanutchikki.avif'

import chikkiRevolutionPlaque from '../../../assets/illustrations/chikkirevolution.avif'
import peacockRight from '../../../assets/illustrations/peacockright.avif'
import { APP_ROUTES } from '../../../constants/appRoutepoints.js'
import GoldenDivider from '../../common/GoldenDivider.jsx'

// Text colours per card image: cream and gold on the deep green images, brown on the cream one.
const CARD_TONE_CLASSES = {
    dark: {
        heading: 'text-cream-50 text-shadow-sm text-shadow-navy-950/60',
        description: 'text-caramel-500',
    },
    light: {
        heading: 'text-cocoa-900',
        description: 'text-caramel-700',
    },
}

const chikkiCategories = [
    {
        name: 'Fruits Variants',
        description: 'Natural Fruit Sweetness',
        image: fruitVariantCardImage,
        tone: 'dark',
    },
    {
        name: 'Nuts n Seeds',
        description: 'Classic & Crunchy',
        image: nutsNSeedsCardImage,
        tone: 'dark',
    },
     {
        name: 'Millets n Nuts',
        description: 'Rich & Nutty',
        image: milletsNNutsCardImage,
        tone: 'light',
    },
    {
        name: 'Women Wellness',
        description: '',
        image: womenWellnessCardImage,
        tone: 'dark',
    },

    {
        name: 'Kids Wellness',
        description: '',
        image: kidsWellsnessCardImage,
        tone: 'light',
    },


    {
        name: 'Peanut Chikkis',
        description: 'Light & Guilt-Free',
        image: peanutChikkiCardImage,
        tone: 'dark',
    },
]

const SlideOne = () => {
    return (
        <div className='relative flex min-h-104 w-full items-center justify-center pt-4 md:min-h-112 lg:min-h-148 lg:pt-12 xl:min-h-160'>

            {/* Background */}
            <div className='absolute inset-x-0 top-0 -bottom-6 overflow-hidden lg:-bottom-8 min-[1025px]:bottom-0'>
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
            <div className='relative z-10 w-full px-3 mt-20 md:mt-0 pb-5 text-center sm:px-4 md:mb-12 md:px-6 md:pb-0 lg:mb-0 lg:pb-12'>

                {/* Revolution banner - unchanged */}
                <img
                    src={chikkiRevolutionPlaque}
                    alt='The Chikki Revolution has arrived'
                    width='1771'
                    height='888'
                    fetchPriority='high'
                    className='mx-auto  h-auto w-56 sm:w-72 md:w-80 lg:w-60 xl:w-80 2xl:w-96'
                />

                {/* Main heading */}
                <div className='mx-auto max-w-3xl'>

                    <p className='text-[12px] md:text-[14px] font-extrabold tracking-[0.14em] text-[#01101b] sm:text-[#0a0040] text-shadow-sm text-shadow-cream-50 uppercase sm:text-xs sm:tracking-[0.2em] '>
                        Traditional Taste · Six Delicious Categories · 56 Varieties
                    </p>

                    <h1 className='mt-1 font-display text-xl leading-tight font-semibold text-navy-950 text-shadow-md text-shadow-cream-50 sm:text-2xl sm:text-caramel-700 sm:text-shadow-cream-100 md:text-3xl xl:text-4xl'>
                         One Love for Tradition.
                    </h1>

                    <p className='mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-[#fffcf6]
                     md:text-navy-950 font-bold md:text-lg min-[1025px]:mt-5 sm:text-sm sm:font-extrabold'>
                        Discover our unique collection of traditionally crafted chikkis,
                        millets n Nuts , Nuts & Seeds, made with honey for an authentic taste.
                    </p>

                </div>

                {/* Six category cards */}
                <div className='mx-auto mt-2 grid max-w-sm grid-cols-3 gap-2 sm:mt-5 sm:max-w-md md:max-w-2xl md:grid-cols-6 md:gap-4 lg:max-w-5xl'>

                    {chikkiCategories.map((item) => {
                        const toneClasses = CARD_TONE_CLASSES[item.tone]

                        return (
                            <div
                                key={item.name}
                                className='group  relative overflow-hidden rounded-2xl shadow-[0_6px_18px_-10px_rgba(0,38,74,0.65)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'
                            >
                                <img
                                    src={item.image}
                                    alt=''
                                    aria-hidden='true'
                                    width='1024'
                                    height='1536'
                                    decoding='async'
                                    className='block h-auto w-full'
                                />

                                {/* Text sits in the empty space at the top of the arch */}
                                <div className='absolute inset-x-[12%] top-[20%] text-center lg:inset-x-[14%]'>
                                    <div className='mx-auto mb-1.5 h-0.5 w-6 rounded-full bg-caramel-500 transition-all duration-300 group-hover:w-10 sm:mb-2 sm:h-1' />

                                    <h2 className={`font-display text-[10px] font-bold leading-tight sm:text-xs md:text-[11px] lg:text-sm ${toneClasses.heading}`}>
                                        {item.name}
                                    </h2>

                                    <p className={`mt-0.5 text-[8px] font-semibold leading-tight sm:mt-1 sm:text-[10px] md:text-[9px] lg:text-[11px] lg:leading-snug ${toneClasses.description}`}>
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}

                </div>

               

                <GoldenDivider className='mt-3 text-caramel-500 sm:mt-4' />

            </div>

        </div>
    )
}

export default SlideOne