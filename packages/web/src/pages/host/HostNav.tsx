import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/host', label: 'Play', end: true },
  { to: '/host/questions', label: 'Questions', end: false },
  { to: '/host/share', label: 'Share QR', end: true },
  { to: '/host/checks', label: 'Checks', end: true },
  { to: '/guide', label: 'Guide', end: true },
] as const;

/** Tabs across every host page so the four parts of the job are always one tap away. */
export function HostNav() {
  return (
    <nav className="host-nav" aria-label="Host pages">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'active' : '')}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
