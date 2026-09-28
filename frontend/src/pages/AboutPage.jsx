import heroImage from '../assets/backgrounds/HeroImage.avif'
import OurPromiseSection from '../components/about/OurPromiseSection.jsx'
import OurStorySection from '../components/about/OurStorySection.jsx'
import ValuesRow from '../components/about/ValuesRow.jsx'
import PageHeroSection from '../components/sections/PageHeroSection.jsx'
import { ABOUT_HERO } from '../content/aboutUsContent.js'

/** About Us page, as in design-reference/finaLaadliBytesUI.png. Static content. */
function AboutPage() {
  return (
    <div>
      <PageHeroSection title={ABOUT_HERO.title} subtitle={ABOUT_HERO.subtitle} backgroundImage={heroImage} />
      <OurStorySection />
      <ValuesRow />
      <OurPromiseSection />
    </div>
  )
}

export default AboutPage