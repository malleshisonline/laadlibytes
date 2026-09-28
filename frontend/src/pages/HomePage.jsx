import HeaderSection from "../components/home/HeaderSection"
import BhogCollectionSection from "../components/home/BhogCollectionSection.jsx"
import WhyChooseUsSection from "../components/home/WhyChooseUsSection.jsx"
import BhogShowcaseSection from "../components/home/BhogShowcaseSection.jsx"
import TopRatedSection from "../components/home/TopRatedSection.jsx"
import TestimonialsSection from "../components/home/TestimonialsSection.jsx"

function HomePage() {
  return (
    <div>
      <HeaderSection />
      <BhogCollectionSection />
      <BhogShowcaseSection />
      <TopRatedSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
    </div>)
}

export default HomePage