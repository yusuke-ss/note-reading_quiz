import './FeedbackBanner.css';

export type FeedbackKind = 'correct' | 'wrong';

export interface Feedback {
  kind: FeedbackKind;
  // Solfege name of the correct note (SOLFEGE[letter]), shown on a wrong answer.
  answerLabel: string;
}

export interface FeedbackBannerProps {
  feedback: Feedback | null;
}

// Large, color-coded ○/× callout shown after an answer. Renders an empty
// placeholder (same min-height) when there's nothing to show yet, so the
// quiz layout doesn't jump between question and feedback phases.
export function FeedbackBanner({ feedback }: FeedbackBannerProps) {
  if (!feedback) {
    return <div className="feedback-banner" aria-hidden="true" />;
  }

  const message =
    feedback.kind === 'correct' ? '○ せいかい!' : `× こたえは ${feedback.answerLabel}`;

  return (
    <div className={`feedback-banner ${feedback.kind}`} role="status">
      {message}
    </div>
  );
}
