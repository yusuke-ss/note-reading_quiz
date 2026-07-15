import { useRef } from 'react';
import type { Letter, Note, NoteId } from '../types';
import { SOLFEGE } from '../lib/notes';
import './PianoKeyboard.css';

export type KeyHighlight = 'correct' | 'wrong' | 'answer';

export interface PianoKeyboardProps {
  keys: Note[];
  showLabels: boolean;
  highlight?: Record<NoteId, KeyHighlight>;
  disabled?: boolean;
  onKeyPress: (id: NoteId) => void;
}

interface PendingTap {
  id: NoteId;
  pointerId: number;
  startedAt: number;
  startX: number;
  startY: number;
}

// A tap should be a quick press-and-release in nearly the same place.
// This prevents swipes/drags on mobile from being judged as quiz answers.
const MAX_TAP_DURATION_MS = 350;
const MAX_TAP_MOVE_PX = 12;

// Letters that have a black key to their right (i.e. all but E and B).
const HAS_SHARP: Record<Letter, boolean> = {
  C: true,
  D: true,
  E: false,
  F: true,
  G: true,
  A: true,
  B: false,
};

export function PianoKeyboard({
  keys,
  showLabels,
  highlight = {},
  disabled = false,
  onKeyPress,
}: PianoKeyboardProps) {
  const pendingTapRef = useRef<PendingTap | null>(null);

  const clearPendingTap = () => {
    pendingTapRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: NoteId) => {
    if (disabled) return;
    pendingTapRef.current = {
      id,
      pointerId: event.pointerId,
      startedAt: performance.now(),
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>, id: NoteId) => {
    if (disabled) return;

    const pendingTap = pendingTapRef.current;
    clearPendingTap();

    if (!pendingTap || pendingTap.id !== id || pendingTap.pointerId !== event.pointerId) return;

    const elapsedMs = performance.now() - pendingTap.startedAt;
    const movedPx = Math.hypot(event.clientX - pendingTap.startX, event.clientY - pendingTap.startY);

    if (elapsedMs <= MAX_TAP_DURATION_MS && movedPx <= MAX_TAP_MOVE_PX) {
      onKeyPress(id);
    }
  };

  return (
    <div className="piano-keyboard" aria-disabled={disabled}>
      {keys.map((note, index) => {
        const id = `${note.letter}${note.octave}`;
        const isMiddleC = note.letter === 'C' && note.octave === 4;
        // The last white key never shows a trailing black key: it would
        // stick out past the end of the visible keyboard.
        const showSharp = HAS_SHARP[note.letter] && index < keys.length - 1;
        const sharpId = `${note.letter}#${note.octave}`;
        const whiteState = highlight[id];
        const sharpState = highlight[sharpId];

        return (
          <div key={id} className="piano-key white">
            <button
              type="button"
              className={`key-hit-area ${whiteState ?? ''}`}
              disabled={disabled}
              onPointerDown={(event) => handlePointerDown(event, id)}
              onPointerUp={(event) => handlePointerUp(event, id)}
              onPointerCancel={clearPendingTap}
              onPointerLeave={clearPendingTap}
              aria-label={id}
            >
              <span className="key-marks">
                {showLabels && <span className="key-label">{SOLFEGE[note.letter]}</span>}
                {isMiddleC && <span className="key-dot" aria-hidden="true" />}
              </span>
            </button>
            {showSharp && (
              <button
                type="button"
                className={`piano-key black ${sharpState ?? ''}`}
                disabled={disabled}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  handlePointerDown(event, sharpId);
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  handlePointerUp(event, sharpId);
                }}
                onPointerCancel={clearPendingTap}
                onPointerLeave={clearPendingTap}
                aria-label={sharpId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
