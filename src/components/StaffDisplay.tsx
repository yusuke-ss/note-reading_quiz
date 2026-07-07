import { useEffect, useRef } from 'react';
import { Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import type { Clef, Note } from '../types';

export interface StaffDisplayProps {
  clef: Clef;
  note: Note;
}

const WIDTH = 300;
const HEIGHT = 260;

export function StaffDisplay({ clef, note }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(WIDTH, HEIGHT);
    const context = renderer.getContext();

    const stave = new Stave(10, 80, 280);
    stave.addClef(clef);
    stave.setContext(context).draw();

    const key = `${note.letter.toLowerCase()}/${note.octave}`;
    const staveNote = new StaveNote({ clef, keys: [key], duration: 'w' });

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables([staveNote]);

    new Formatter().joinVoices([voice]).format([voice], 220);
    voice.draw(context, stave);

    const svg = container.querySelector('svg');
    if (svg) {
      if (!svg.getAttribute('viewBox')) {
        svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
      }
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
  }, [clef, note.letter, note.octave]);

  return <div ref={containerRef} className="staff-display" />;
}
