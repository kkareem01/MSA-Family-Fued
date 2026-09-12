import { useState, type FormEvent } from 'react';
import { QUESTION_PROMPT_MAX_LEN } from '@feud/shared';

type Props = Readonly<{ onCreate: (prompt: string) => Promise<boolean>; busy: boolean }>;

export function QuestionForm({ onCreate, busy }: Props) {
  const [prompt, setPrompt] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onCreate(prompt.trim())) setPrompt('');
  };
  return (
    <form className="panel stack" onSubmit={(e) => void submit(e)}>
      <label className="field">
        <span>New question</span>
        <input
          value={prompt}
          maxLength={QUESTION_PROMPT_MAX_LEN}
          placeholder="Name something people forget to bring to Jumu'ah…"
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
        />
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy || prompt.trim().length === 0}>
        Add question
      </button>
    </form>
  );
}
