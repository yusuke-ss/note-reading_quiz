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
  const handlePress = (id: NoteId) => {
    if (disabled) return;
    onKeyPress(id);
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
              onPointerDown={() => handlePress(id)}
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
                  handlePress(sharpId);
                }}
                aria-label={sharpId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
