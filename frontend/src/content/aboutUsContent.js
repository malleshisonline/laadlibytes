import { Heart, ShoppingCart, Sprout } from 'lucide-react'

// About Us page copy, as in design-reference/finaLaadliBytesUI.png.
export const ABOUT_HERO = {
  title: 'About Us',
  subtitle: 'Rooted in Tradition, Crafted with Love',
}

export const OUR_STORY = {
  heading: 'Our Story',
  paragraphs: [
    'Laadli Bytes was born from a simple belief — that traditional Indian sweets, especially chikki, are not just treats, but a part of our culture and heritage. We bring you the authentic taste of Vrindavan, made with pure ingredients and a lot of love.',
    'In Vrindavan, food is first offered with devotion before it is shared — the spirit of the 56 Bhog. That same spirit guides our kitchen: every chikki is made as if it were being prepared for the Lord Himself, with patience, care and a pure heart.',
  ],
  // Shown only after "Read More".
  moreParagraphs: [
    'Every batch is slow-cooked in small quantities with jaggery, roasted nuts and seeds, just the way it has been made in Vrindavan kitchens for generations. No shortcuts, no preservatives — only honest goodness you can share with the ones you love.',
    'From festive thalis to everyday cravings, from little ones to grandparents, we want every bite to carry a little of the joy of Vrindavan into your home. Thank you for letting us be a part of your family’s sweet moments.',
  ],
}

// About values row. `highlight` (optional) is the part of the label shown in the accent colour.
export const ABOUT_VALUES = [
  { icon: Sprout, label: 'Bring the grace of 56 Bhog into your home', highlight: '56 Bhog' },
  { icon: ShoppingCart, label: 'Shop the sacred Bhog collection' },
  { icon: Heart, label: 'Experience Bhog inspired food' },
]

export const OUR_PROMISE = {
  heading: 'Our Promise',
  text: 'From the heart of Vrindavan, we bring you healthy, delicious, and authentic chikkis that connect you to tradition, purity and love.',
}

export default { ABOUT_HERO, OUR_STORY, ABOUT_VALUES, OUR_PROMISE }