import { Link } from 'react-router-dom';
import { APP_NAME } from '@feud/shared';
import { START_HERE } from '../guide/guideContent';
import './guide/guide.css';

const PAGES = [
  { to: '/display', title: 'Projector display', hint: 'Open this on the big screen, click once' },
  { to: '/host', title: 'Host control panel', hint: 'Run the game from your phone' },
  { to: '/host/questions', title: 'Questions and surveys', hint: 'Write questions, open surveys, build boards' },
  { to: '/host/share', title: 'Share the survey QR', hint: 'The code the audience scans' },
  { to: '/host/checks', title: 'Pre-show checks', hint: 'Projector, sound, buzzers, boards' },
  { to: '/survey', title: 'Audience survey', hint: 'What the QR code opens' },
  { to: '/buzzer', title: 'Buzzer', hint: 'For the two face-off players' },
] as const;

export function LandingPage() {
  return (
    <main className="page page-narrow stack stack-lg">
      <header className="stack">
        <h1 className="display-title">{APP_NAME}</h1>
        <p className="muted">Family Feud for the MSA: a projector board, a host panel on your phone, an audience survey, and phone buzzers.</p>
      </header>
      <section className="stack">
        <h2>Start here</h2>
        <div className="start-here">
          {START_HERE.map((card, i) => (
            <article key={card.section} className="start-card">
              <div className="start-card-head">
                <span className="guide-step-number">{i + 1}</span>
                <h3>{card.title}</h3>
              </div>
              <ul>
                {card.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
              <Link className="btn btn-primary" to={card.to}>{card.cta}</Link>
            </article>
          ))}
        </div>
        <Link className="btn btn-ghost" to="/guide">Full guide (setup, survey, testing, play, troubleshooting)</Link>
      </section>
      <section className="stack">
        <h2>All pages</h2>
        <nav className="link-list" aria-label="Pages">
          {PAGES.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.title}
              <span>{link.hint}</span>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
