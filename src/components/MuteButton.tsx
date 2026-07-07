import './MuteButton.css';

export interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
}

export function MuteButton({ muted, onToggle }: MuteButtonProps) {
  return (
    <button
      type="button"
      className="mute-button"
      onClick={onToggle}
      aria-label={muted ? 'ミュート解除' : 'ミュート'}
      aria-pressed={muted}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
