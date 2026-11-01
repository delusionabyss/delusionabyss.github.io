import React from 'react';

export const WestCreativePanel: React.FC = () => {
  return (
    <section
      aria-label="creative endeavors"
      className="relative w-full h-full bg-black text-[#EAE6DF] min-[1025px]:flex min-[1025px]:items-center min-[1025px]:justify-center overflow-hidden select-none"
    >
      <div className="w-full h-full min-[1025px]:w-full min-[1025px]:max-w-[1024px] min-[1025px]:h-auto min-[1025px]:aspect-[4/3] min-[1025px]:max-h-full min-[1025px]:translate-y-4 flex flex-col justify-between px-8 py-12 md:px-20 md:py-16">
        <div className="min-[1025px]:mt-4">
          <h2 className="font-redaction-35 text-3xl md:text-5xl tracking-tight text-[#EAE6DF] font-normal">
            creative endeavors
          </h2>
        </div>

        <div className="my-auto max-w-4xl">
          <p className="font-tangerine lowercase text-4xl sm:text-5xl md:text-6xl text-[#EAE6DF]/85 leading-snug tracking-wide">
            lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>

        <div />
      </div>
    </section>
  );
};
