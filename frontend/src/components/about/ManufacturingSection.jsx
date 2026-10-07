import vrindavanBackground from "../../assets/backgrounds/morethanchikki.avif";

function ManufacturingSection() {
  return (
    <section
      aria-labelledby="manufacturing-heading"
      className="relative isolate overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:py-20"
    >
      <img
        src={vrindavanBackground}
        alt=""
        aria-hidden="true"
        width="1916"
        height="821"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-20 size-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-r from-cream-50/95 via-cream-50/85 to-cream-50/65"
      />

      <div className="mx-auto max-w-6xl rounded-3xl border border-white/70 bg-white/55 px-5 py-7 shadow-xl shadow-navy-950/10 backdrop-blur-sm sm:px-8 sm:py-9 md:px-12 md:py-12">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-caramel-500/30 bg-cream-50/90 px-4 py-1.5 text-xs font-extrabold tracking-[0.16em] text-caramel-700 uppercase sm:text-sm">
            Made with care
          </p>
          <h2
            id="manufacturing-heading"
            className="mt-4 font-display text-3xl leading-tight font-bold text-navy-900 sm:text-4xl md:text-5xl"
          >
            Tradition in every batch
          </h2>
          <p className="mt-5 text-base leading-relaxed font-semibold text-navy-900 sm:text-lg md:text-xl">
            Our chikkis are slow-cooked in small batches with jaggery, roasted
            nuts and seeds. We give each batch the time and attention it needs,
            following the traditional flavours that inspired Laadli Bytes.
          </p>
          <p className="mt-4 text-base leading-relaxed font-semibold text-navy-900 sm:text-lg md:text-xl">
            It is a simple, thoughtful way of making something special to
            share—from an everyday bite to a festive moment with family.
          </p>
          <ul className="mt-7 flex flex-wrap gap-2.5 text-sm font-bold text-navy-800 sm:gap-3">
            <li className="rounded-full border border-leaf-600/25 bg-[#f4faef]/95 px-4 py-2.5">
              Small batches
            </li>
            <li className="rounded-full border border-caramel-500/30 bg-cream-50/95 px-4 py-2.5">
              Jaggery &amp; nuts
            </li>
            <li className="rounded-full border border-peacock-600/25 bg-lightblue-50/95 px-4 py-2.5">
              Traditional flavour
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export { ManufacturingSection };
export default ManufacturingSection;
