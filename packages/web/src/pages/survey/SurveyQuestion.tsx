import { SURVEY_ANSWER_MAX_LEN, type OpenQuestion } from '@feud/shared';

type Props = Readonly<{ question: OpenQuestion; value: string; disabled: boolean; onChange: (value: string) => void }>;

export function SurveyQuestion({ question, value, disabled, onChange }: Props) {
  return (
    <label className="survey-question">
      <span className="survey-prompt">{question.prompt}</span>
      <input
        className="input survey-input"
        value={value}
        maxLength={SURVEY_ANSWER_MAX_LEN}
        placeholder="Your answer"
        autoComplete="off"
        autoCapitalize="sentences"
        enterKeyHint="next"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="muted small survey-count">{value.length}/{SURVEY_ANSWER_MAX_LEN}</span>
    </label>
  );
}
