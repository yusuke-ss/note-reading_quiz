import { useEffect, useRef } from 'react';
import { Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import type { Clef, Level, Note } from '../types';

export interface StaffDisplayProps {
  clef: Clef;
  level: Level;
  note: Note;
}

// Narrow on purpose: a single note only needs the clef plus its own
// width, not a full 4-beat measure. Keeping WIDTH small (vs. HEIGHT, which
// stays tall enough for level 3's 2-3 ledger lines) means object-fit:contain
// below is height-bound in portrait, so the note fills the available
// vertical space instead of leaving large letterboxed blank margins.
const WIDTH = 170;
// Tall enough that level 3's lowest/highest ledger-line notes (bbox bottom
// measured at y=260.47, see LEVEL_Y_RANGE below) never touch the canvas
// edge and get clipped.
const HEIGHT = 270;

// Fixed vertical crop range per level, applied to the SVG's viewBox after
// VexFlow draws. Measured (via headless-browser getBBox() over every note
// in each level's pool, both clefs) content extent is:
//   Lv1: y 39.5-240.5   Lv2: y 29.5-250.5   Lv3: y 19.5-260.5
// (x is 6-162 for all levels/clefs). Each range below pads that by ~4.5px.
//
// This is a *fixed* table rather than a per-render getBBox() crop: cropping
// per-render to the actual note's own bbox would make the note visually
// grow/shrink between questions as the note's ledger-line count changes,
// which is worse than the fixed letterboxing it would remove. Fixing the
// crop per level keeps scale stable within a level while still cropping
// out the (large, level-independent) blank margin that a single
// one-size-fits-all viewBox would otherwise leave for every level below 3.
const LEVEL_Y_RANGE: Record<Level, readonly [number, number]> = {
  1: [35, 245],
  2: [25, 255],
  3: [15, 265],
};
const VIEWBOX_X0 = 2;
const VIEWBOX_X1 = 166;

export function StaffDisplay({ clef, level, note }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(WIDTH, HEIGHT);
    const context = renderer.getContext();

    const stave = new Stave(6, 80, 155);
    stave.addClef(clef);
    stave.setContext(context).draw();

    const key = `${note.letter.toLowerCase()}/${note.octave}`;
    const staveNote = new StaveNote({ clef, keys: [key], duration: 'w' });

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables([staveNote]);

    new Formatter().joinVoices([voice]).format([voice], 90);
    voice.draw(context, stave);

    const svg = container.querySelector('svg');
    if (svg) {
      const [y0, y1] = LEVEL_Y_RANGE[level];
      svg.setAttribute('viewBox', `${VIEWBOX_X0} ${y0} ${VIEWBOX_X1 - VIEWBOX_X0} ${y1 - y0}`);
      // width/height 100% + object-fit: contain scales the note to fit
      // whichever dimension is tighter. Where the container only
      // constrains width (e.g. ResultScreen's fixed-width thumbnails),
      // height:100% against an auto-height parent resolves to 'auto' per
      // the CSS spec, so this degrades to the old width-driven behavior.
      // Where the container also has a bounded height (QuizScreen's
      // flex-shrinkable staff area, used to fit landscape phone screens),
      // both axes are honored so the note shrinks instead of overflowing.
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.objectFit = 'contain';
    }
  }, [clef, level, note.letter, note.octave]);

  return <div ref={containerRef} className="staff-display" />;
}
