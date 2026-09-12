import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="page page-center">
      <div className="card stack">
        <h1>Page not found</h1>
        <Link to="/">Back to the start</Link>
      </div>
    </main>
  );
}
