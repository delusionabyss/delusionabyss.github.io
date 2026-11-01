import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PanelId,
  getCoordForPanel,
  moveByDelta,
  resolveSwipeDelta,
} from './utils/gridLogic';
import { soundEngine } from './utils/soundEngine';
import { CenterAbyssPanel } from './components/CenterAbyssPanel';
import { NorthGamePanel } from './components/NorthGamePanel';
import { WestCreativePanel } from './components/WestCreativePanel';
import { EastSoftwarePanel } from './components/EastSoftwarePanel';
import { SouthAboutPanel } from './components/SouthAboutPanel';
import { CornerCrypticPanel } from './components/CornerCrypticPanel';

export default function App() {
  const [activePanel, setActivePanel] = useState<PanelId>('C');

  const [visitCounts, setVisitCounts] = useState<Record<PanelId, number>>({
    NW: 0,
    N: 0,
    NE: 0,
    W: 0,
    C: 1,
    E: 0,
    SW: 0,
    S: 0,
    SE: 0,
  });

  const [audioStarted, setAudioStarted] = useState<boolean>(false);

  // Drag / Swipe state with single-axis lock (strictly up/down OR left/right)
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    lockedAxis: 'x' | 'y' | null;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
    lockedAxis: null,
  });

  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wheelCooldownRef = useRef<number>(0);

  const ensureAudioAwake = useCallback(() => {
    if (!audioStarted) {
      const ok = soundEngine.init();
      if (ok) setAudioStarted(true);
    }
  }, [audioStarted]);

  const navigateToPanel = useCallback(
    (target: PanelId) => {
      ensureAudioAwake();
      setActivePanel((prev) => {
        if (prev !== target) {
          soundEngine.playPanelTransition(target);
          setVisitCounts((counts) => ({
            ...counts,
            [target]: (counts[target] || 0) + 1,
          }));
        }
        return target;
      });
    },
    [ensureAudioAwake]
  );

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateToPanel(moveByDelta(activePanel, -1, 0));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateToPanel(moveByDelta(activePanel, 1, 0));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToPanel(moveByDelta(activePanel, 0, -1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToPanel(moveByDelta(activePanel, 0, 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePanel, navigateToPanel]);

  // Global window pointermove / pointerup listeners with strict single-axis locking
  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      const rawDx = e.clientX - dragRef.current.startX;
      const rawDy = e.clientY - dragRef.current.startY;

      if (!dragRef.current.lockedAxis && Math.hypot(rawDx, rawDy) > 6) {
        dragRef.current.lockedAxis = Math.abs(rawDx) > Math.abs(rawDy) ? 'x' : 'y';
      }

      const axis = dragRef.current.lockedAxis;
      const lockedDx = axis === 'x' ? rawDx : 0;
      const lockedDy = axis === 'y' ? rawDy : 0;

      dragRef.current.dx = lockedDx;
      dragRef.current.dy = lockedDy;

      setDragOffset({ x: lockedDx * 0.42, y: lockedDy * 0.42 });
    };

    const onWindowPointerUp = () => {
      if (!dragRef.current.active) return;
      const { dx, dy } = dragRef.current;
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
      dragRef.current.lockedAxis = null;
      setDragOffset({ x: 0, y: 0 });

      const { dRow, dCol } = resolveSwipeDelta(dx, dy, 24);
      if (dRow !== 0 || dCol !== 0) {
        const next = moveByDelta(activePanel, dRow, dCol);
        navigateToPanel(next);
      }
    };

    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', onWindowPointerUp, { passive: true });
    window.addEventListener('pointercancel', onWindowPointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, [activePanel, navigateToPanel]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    ensureAudioAwake();
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      lockedAxis: null,
    };
  };

  // Trackpad / Wheel 2D swipe support anywhere
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    ensureAudioAwake();
    const now = performance.now();
    if (now - wheelCooldownRef.current < 520) return;

    if (Math.abs(e.deltaX) > 22 || Math.abs(e.deltaY) > 22) {
      const { dRow, dCol } = resolveSwipeDelta(-e.deltaX * 1.6, -e.deltaY * 1.6, 24);
      if (dRow !== 0 || dCol !== 0) {
        wheelCooldownRef.current = now;
        navigateToPanel(moveByDelta(activePanel, dRow, dCol));
      }
    }
  };

  const { row: activeRow, col: activeCol } = getCoordForPanel(activePanel);

  return (
    <main
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      data-active-panel={activePanel}
      className="relative w-screen h-screen overflow-hidden bg-black text-[#EAE6DF] select-none cursor-grab active:cursor-grabbing"
    >
      <div
        style={{
          transform: `translate3d(calc(${-activeCol * 100}vw + ${dragOffset.x}px), calc(${-activeRow * 100}vh + ${dragOffset.y}px), 0)`,
          transition: dragRef.current.active
            ? 'none'
            : 'transform 640ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="w-[300vw] h-[300vh] grid grid-cols-3 grid-rows-3 will-change-transform"
      >
        {/* Row 0: NW, N, NE */}
        <div className="w-screen h-screen overflow-hidden">
          <CornerCrypticPanel
            panelId="NW"
            isActive={activePanel === 'NW'}
            visitCount={visitCounts.NW}
          />
        </div>

        <div className="w-screen h-screen overflow-hidden">
          <NorthGamePanel />
        </div>

        <div className="w-screen h-screen overflow-hidden">
          <CornerCrypticPanel
            panelId="NE"
            isActive={activePanel === 'NE'}
            visitCount={visitCounts.NE}
          />
        </div>

        {/* Row 1: W, C, E */}
        <div className="w-screen h-screen overflow-hidden">
          <WestCreativePanel />
        </div>

        <div className="w-screen h-screen overflow-hidden">
          <CenterAbyssPanel />
        </div>

        <div className="w-screen h-screen overflow-hidden">
          <EastSoftwarePanel />
        </div>

        {/* Row 2: SW, S, SE */}
        <div className="w-screen h-screen overflow-hidden">
          <CornerCrypticPanel
            panelId="SW"
            isActive={activePanel === 'SW'}
            visitCount={visitCounts.SW}
          />
        </div>

        <div className="w-screen h-screen overflow-hidden">
          <SouthAboutPanel />
        </div>

        <div className="w-screen h-screen overflow-hidden">
          <CornerCrypticPanel
            panelId="SE"
            isActive={activePanel === 'SE'}
            visitCount={visitCounts.SE}
          />
        </div>
      </div>
    </main>
  );
}
