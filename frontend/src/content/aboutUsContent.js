import { Heart, ShoppingCart, Sprout } from 'lucide-react'

// About Us page copy, as in design-reference/finaLaadliBytesUI.png.
export const ABOUT_HERO = {
  title: 'About Us',
  subtitle: 'Rooted in Tradition, Crafted with Love',
}

export const OUR_STORY = {
  heading: 'Our Story',
  paragraphs: [
    'In Vrindavan, food is first offered with devotion before it is shared — the spirit of the Chhappan Bhog. That same spirit guides our kitchen: every chikki is made as if it were being prepared for the Lord Himself, with devotion, care and a pure heart.',
    'Laadli Bytes was born from a simple belief — that traditional Indian sweets, especially chikki, are not just treats, but a part of our culture and heritage. We bring you the authentic taste , made with pure ingredients and a lot of love.',
  ],
  // Shown only after "Read More".
  moreParagraphs: [
    'Every batch is made in small quantities , roasted nuts and seeds. No shortcuts, no artificial flavours, no chemicals — only pure goodness you can share with the ones you love.',
    'From festive thalis to everyday cravings, from little ones to grandparents, we want every bite to carry a little of the joy into your home. Thank you for letting laadlibytes be a part of your family’s sweet moments.',
  ],
}

// About values row. `highlight` (optional) is the part of the label shown in the accent colour.
export const ABOUT_VALUES = [
  { icon: Sprout, label: 'Bring the grace of Chhappan Bhog into your home', highlight: 'Chhappan Bhog' },
  { icon: ShoppingCart, label: 'Shop the sacred Bhog collection' },
  { icon: Heart, label: 'Experience Bhog inspired food' },
]

export const OUR_PROMISE = {
  heading: 'Our Promise',
  text: 'We bring you healthy, delicious, and authentic chikkis that connect you to tradition, purity and love.',
}

export default { ABOUT_HERO, OUR_STORY, ABOUT_VALUES, OUR_PROMISE }