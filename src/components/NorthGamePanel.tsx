import React, { useState } from 'react';
import placeholderImg from '../assets/images/abyss_game_placeholder_1793528417830.jpg';

export const NorthGamePanel: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section
      aria-label="game"
      className="relative w-full h-full bg-black text-[#EAE6DF] min-[1025px]:flex min-[1025px]:items-center min-[1025px]:justify-center overflow-hidden select-none"
    >
      <div className="w-full h-full min-[1025px]:w-full min-[1025px]:max-w-[1024px] min-[1025px]:h-auto min-[1025px]:aspect-[4/3] min-[1025px]:max-h-full min-[1025px]:translate-y-4 flex flex-col justify-between px-8 py-12 md:px-20 md:py-16">
        <div className="min-[1025px]:mt-4">
          <h2 className="font-redaction-35 text-3xl md:text-5xl tracking-tight text-[#EAE6DF] font-normal">
            game
          </h2>
        </div>

        <div className="my-auto flex flex-col items-center justify-center gap-6 w-full max-h-[72vh]">
          {!imgFailed ? (
            <img
              src={placeholderImg}
              alt="Solitary monolith in the dark"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              draggable={false}
              className="max-h-[48vh] w-auto max-w-full object-contain opacity-90 pointer-events-none select-none"
            />
          ) : (
            <div className="w-full max-w-3xl aspect-video bg-[#080807] flex items-center justify-center">
              <div className="w-16 h-32 bg-[#EAE6DF]/15" />
            </div>
          )}

          <p className="font-tangerine lowercase text-3xl sm:text-4xl md:text-5xl text-[#EAE6DF]/85 max-w-3xl text-center leading-snug tracking-wide">
            lorem ipsum dolor sit amet, consectetur adipiscing elit. sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        <div />
      </div>
    </section>
  );
};
