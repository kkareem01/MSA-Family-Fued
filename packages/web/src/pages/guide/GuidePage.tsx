import { Link } from 'react-router-dom';
import { APP_NAME } from '@feud/shared';
import { GUIDE_SECTIONS, type GuideStep } from '../../guide/guideContent';
import './guide.css';

function Step({ step, index }: { step: GuideStep; index: number }) {
  return (
    <li className="guide-step">
      <span className="guide-step-number">{index + 1}</span>
      <div className="stack">
        <strong>{step.title}</strong>
        <p>{step.detail}</p>
        {step.link ? <Link className="btn btn-ghost btn-inline" to={step.link.to}>{step.link.label} →</Link> : null}
      </div>
    </li>
  );
}

/** The complete host guide on one page: setup, survey, testing, play, sounds, troubleshooting. */
export function GuidePage() {
  return (
    <main className="page page-narrow guide stack stack-lg">
      <header className="stack">
        <span className="display-title">{APP_NAME}</span>
        <h1>Host guide</h1>
        <p className="muted">Everything from first setup to the final confetti. Print it, or keep it open on a second phone.</p>
        <nav className="guide-toc" aria-label="Guide sections">
          {GUIDE_SECTIONS.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
        </nav>
      </header>
      {GUIDE_SECTIONS.map((section) => (
        <section key={section.id} className="guide-section stack">
          <h2 id={section.id}>{section.title}</h2>
          <p className="muted">{section.intro}</p>
          <ol className="guide-steps">
            {section.steps.map((step, i) => <Step key={step.title} step={step} index={i} />)}
          </ol>
        </section>
      ))}
      <footer className="row">
        <Link className="btn btn-ghost" to="/">Back to the start</Link>
        <Link className="btn btn-primary" to="/host">Open the host panel</Link>
      </footer>
    </main>
  );
}
