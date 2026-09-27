import HeaderSection from "../components/home/HeaderSection"
import BhogCollectionSection from "../components/home/BhogCollectionSection.jsx"
import WhyChooseUsSection from "../components/home/WhyChooseUsSection.jsx"
import BhogShowcaseSection from "../components/home/BhogShowcaseSection.jsx"
import TasteOfVrindavanSection from "../components/home/TasteOfVrindavanSection.jsx"

function HomePage() {
  return (
    <div>
      <HeaderSection />
      <BhogCollectionSection />
      <BhogShowcaseSection />
      <TasteOfVrindavanSection />
      <WhyChooseUsSection />
    </div>)
}

export default HomePage