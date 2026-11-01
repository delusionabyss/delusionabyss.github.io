import React from 'react';
import { CORNER_CRYPTIC_PARAGRAPHS } from '../data/abyssContent';
import { getDiagonalSlideVector } from '../utils/gridLogic';
import { TypewriterText } from './TypewriterText';

interface CornerCrypticPanelProps {
  panelId: 'NW' | 'NE' | 'SW' | 'SE';
  isActive: boolean;
  visitCount: number;
}

export const CornerCrypticPanel: React.FC<CornerCrypticPanelProps> = ({
  panelId,
  isActive,
  visitCount,
}) => {
  const paragraph = CORNER_CRYPTIC_PARAGRAPHS[panelId];
  const slideVec = getDiagonalSlideVector(panelId);

  return (
    <section
      aria-label={`${panelId} panel`}
      className="relative w-full h-full bg-black text-[#EAE6DF] flex items-start justify-start p-6 sm:p-10 md:px-14 md:py-12 overflow-hidden select-none"
    >
      <div
        style={{
          transform: isActive
            ? 'translate3d(0, 0, 0)'
            : `translate3d(${slideVec.x * 1.5}px, ${slideVec.y * 1.5}px, 0)`,
          opacity: isActive ? 1 : 0,
          transition: 'transform 1100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 1100ms ease-out',
        }}
        className="w-full h-full flex items-start justify-start"
      >
        <TypewriterText
          text={paragraph}
          isActive={isActive}
          visitTrigger={visitCount}
          speedMs={28}
          className="font-sankofa lowercase w-full text-[clamp(1.35rem,2.45vw,2.6rem)] text-[#EAE6DF]/90 leading-[1.6] font-normal text-left"
        />
      </div>
    </section>
  );
};
