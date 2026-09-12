import { Link } from 'react-router-dom';
import { APP_NAME } from '@feud/shared';

const LINKS = [
  { to: '/display', title: 'Projector display', hint: 'Open this on the big screen, fullscreen it' },
  { to: '/host', title: 'Host control panel', hint: 'Run the game from a phone or second window' },
  { to: '/host/questions', title: 'Questions and surveys', hint: 'Write questions, open surveys, build boards' },
  { to: '/survey', title: 'Audience survey', hint: 'What the QR code opens' },
  { to: '/buzzer', title: 'Buzzer', hint: 'For the two face-off players' },
] as const;

export function LandingPage() {
  return (
    <main className="page page-narrow stack stack-lg">
      <h1 className="display-title">{APP_NAME}</h1>
      <nav className="link-list" aria-label="Pages">
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.title}
            <span>{link.hint}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
