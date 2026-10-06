import { useEffect, useState } from 'react'
import SlideOne from './herocarousel/SlideOne'
import SlideTwo from './herocarousel/SlideTwo'
import SlideThree from './herocarousel/SlideThree.jsx'

// Slides in the order they rotate.
const SLIDES = [SlideOne, SlideTwo, SlideThree]

// Smaller on phones (8px dots, 20px pill, thin ring); full size from sm.
const DOT_CLASSES = 'h-2 rounded-full shadow-md transition-all duration-300 sm:h-3'
const ACTIVE_DOT_CLASSES = 'w-5 bg-caramel-500 ring-1 ring-white sm:w-8 sm:ring-2'
const INACTIVE_DOT_CLASSES = 'w-2 bg-white ring-1 ring-caramel-500 hover:bg-caramel-500/60 sm:w-3 sm:ring-2'

const HeaderSection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
        }, 3000)

        // Return a functin so the timer is cleared only when the section unmounts.
        return () => clearInterval(interval)
    }, [])

    return (

        <section className='relative -mt-4 pb-10'>
            {SLIDES.map((Slide, index) => currentSlide === index && <Slide key={index} />)}

            <div className='absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:gap-3'>
                {/* Gold and white dots with a contrasting ring, so they read on both the light sky (slide 1) and the
                    dark navy (slide 2) and the sunlit table (slide 3); the active one stretches into a pill. */}
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`${DOT_CLASSES} ${currentSlide === index ? ACTIVE_DOT_CLASSES : INACTIVE_DOT_CLASSES}`}
                    />
                ))}
            </div>
        </section>
    )
}

export default HeaderSection