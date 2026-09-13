import { Brand } from '../../components/Brand';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useHostSession } from '../../auth/HostPinContext';
import { HostNav } from './HostNav';

type Props = Readonly<{ title: string; back?: { to: string; label: string }; children?: ReactNode }>;

/** Shared header for the host sub-pages (questions, tally, share, checks). */
export function HostChrome({ title, back, children }: Props) {
  const { signOut } = useHostSession();
  return (
    <header className="host-header stack">
      <div className="row row-between">
        <span className="display-title"><Brand /></span>
        <button className="btn btn-ghost btn-inline" type="button" onClick={signOut}>Sign out</button>
      </div>
      <HostNav />
      {back ? <Link className="small" to={back.to}>← {back.label}</Link> : null}
      <h1>{title}</h1>
      {children}
    </header>
  );
}
