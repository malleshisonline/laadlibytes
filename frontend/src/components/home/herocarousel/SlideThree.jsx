import { Link } from 'react-router'

import chikkiPlatters from '../../../assets/backgrounds/headerbgthree.avif'
import { APP_ROUTES } from '../../../constants/appRoutepoints.js'
import GoldenDivider from '../../common/GoldenDivider.jsx'


const SlideThree = () => {
  return (
    <div className='relative flex min-h-104 w-full items-center pt-4 md:min-h-112 lg:aspect-1920/823 lg:min-h-0'>
      <div className='absolute inset-x-0 top-0 -bottom-6 lg:-bottom-8'>
        <img
          src={chikkiPlatters}
          alt=''
          aria-hidden='true'
          width='1672'
          height='941'
          fetchPriority='high'
          className='h-full w-full object-cover object-right md:object-center'
        />
        <div
          aria-hidden='true'
          className='absolute inset-0 bg-linear-to-b from-white/85 via-white/60 to-white/10 md:bg-linear-to-r md:from-white/70 md:via-white/20 md:to-transparent'
        />
      </div>

      <div className='relative z-10 mx-auto w-full px-4 text-center sm:px-8 md:mx-0 md:w-1/2 md:pl-12 md:text-left lg:pl-20 xl:pl-28'>
        <p className='text-sm font-bold tracking-[0.25em] text-caramel-700 uppercase'>
          Traditional Chikkis · Made with Love
        </p>

        <h2 className='mt-3 font-display text-3xl leading-tight font-semibold text-navy-800 sm:text-4xl xl:text-5xl'>
          Made with Devotion,
          <br />
          Shared with Love
        </h2>

        <GoldenDivider className='mt-3 md:mx-0' />

        <p className='mx-auto mt-3 max-w-md text-base font-semibold text-body md:mx-0 md:text-lg'>
          Every chikki is made with devotion, bringing together traditional recipes,
          carefully selected ingredients and the rich sweetness of jaggery. Share a
          wholesome, joyful taste of tradition with every bite.
        </p>
        <Link
          to={APP_ROUTES.PRODUCTS}
          className='mt-8 inline-flex min-h-11 min-w-44 items-center justify-center rounded-lg bg-navy-800 px-10 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 sm:min-w-52'
        >
          Shop Now
        </Link>
      </div>
    </div>
  )
}

export default SlideThree