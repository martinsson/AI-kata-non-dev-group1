import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

type HelloResponse = { message: string; count: number };

export function App() {
  const [data, setData] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/hello`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>Walking Skeleton</h1>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {data && (
        <p>
          {data.message}, count: <strong>{data.count}</strong>
        </p>
      )}
      {!data && !error && <p>Loading…</p>}
    </main>
  );
}
