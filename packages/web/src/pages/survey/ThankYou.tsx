type Props = Readonly<{ answeredCount: number; waiting: boolean }>;

export function ThankYou({ answeredCount, waiting }: Props) {
  return (
    <section className="survey-card survey-thanks">
      <span className="survey-big">{answeredCount > 0 ? 'JazakAllah khair!' : 'Nothing open yet'}</span>
      <p>
        {answeredCount > 0
          ? `Your ${answeredCount === 1 ? 'answer is' : `${answeredCount} answers are`} in. Keep this page open, more questions may appear.`
          : 'The host has not opened a survey question yet. Keep this page open, it refreshes on its own.'}
      </p>
      {waiting ? <span className="survey-pulse">Watching for new questions…</span> : null}
    </section>
  );
}
