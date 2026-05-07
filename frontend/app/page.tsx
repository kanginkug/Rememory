'use client';

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/hello');
      const data = await response.text();
      setMessage(data);
    } catch (error) {
      setMessage('Error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Rememory</h1>
      
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {loading ? 'Loading...' : 'Call Backend API'}
      </button>

      {message && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-lg">Backend says: <strong>{message}</strong></p>
        </div>
      )}
    </main>
  );
}