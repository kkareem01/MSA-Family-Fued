type Props = Readonly<{ prompt: string | null }>;

export function QuestionBanner({ prompt }: Props) {
  return (
    <header className="question-banner">
      <span className="question-text">{prompt ?? ' '}</span>
    </header>
  );
}
