'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlatformChip } from '@/components/PlatformChip';

export default function ConnectPage() {
  const router = useRouter();
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['leetcode']));
  const [usernames, setUsernames] = useState<Record<string, string>>({
    leetcode: '',
    codeforces: '',
    codechef: '',
    hackerrank: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const platforms = [
    { id: 'leetcode', name: 'LeetCode', url: 'leetcode.com/u/…' },
    { id: 'codeforces', name: 'Codeforces', url: 'codeforces.com/profile/…' },
    { id: 'codechef', name: 'CodeChef', url: 'codechef.com/users/…' },
    { id: 'hackerrank', name: 'HackerRank', url: 'hackerrank.com/…' },
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConnect = async () => {
    if (selectedPlatforms.size === 0) {
      setError('Please select at least one platform.');
      return;
    }

    // Validate all selected platforms have a username
    for (const platformId of selectedPlatforms) {
      if (!usernames[platformId]?.trim()) {
        const name = platforms.find(p => p.id === platformId)?.name;
        setError(`Please enter your ${name} username.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      const results = [];

      for (const platform of selectedPlatforms) {
        const res = await fetch(`${API_URL}/platforms/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform,
            username: usernames[platform].trim()
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to connect ${platform}`);
        }

        results.push(platform);
      }

      setSuccess(`Connected ${results.length} platform${results.length > 1 ? 's' : ''}! Redirecting to dashboard...`);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brand-d)', fontWeight: 700 }}>Step 1 of 2</div>
      <h1 style={{ fontSize: 26, letterSpacing: '-.02em', margin: '8px 0 6px' }}>Connect your platforms</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 24 }}>Select platforms and enter your usernames. We pull your public stats instantly.</p>

      <div className="panel">
        {/* Platform selector cards */}
        <div className="plats">
          {platforms.map(p => (
            <button
              key={p.id}
              className={`pcard ${selectedPlatforms.has(p.id) ? 'sel' : ''}`}
              type="button"
              onClick={() => togglePlatform(p.id)}
            >
              <PlatformChip platformId={p.id} size="lg" showName={false} variant="ghost" />
              <div>
                <div className="nm">{p.name}</div>
                <div className="m">{p.url}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Username inputs for each selected platform */}
        {Array.from(selectedPlatforms).map(platformId => {
          const p = platforms.find(p => p.id === platformId)!;
          return (
            <div key={p.id} style={{ marginTop: 20, padding: 16, border: '1px solid var(--border-2)', borderRadius: 12, background: 'var(--paper)' }}>
              <label htmlFor={`uname-${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <PlatformChip platformId={p.id} size="sm" showName={false} variant="ghost" />
                Your {p.name} username
              </label>
              <div className="inwrap">
                <span className="pfx">@</span>
                <input 
                  id={`uname-${p.id}`}
                  type="text" 
                  placeholder="e.g. gaurav"
                  autoComplete="off" 
                  value={usernames[p.id]}
                  onChange={(e) => setUsernames(prev => ({ ...prev, [p.id]: e.target.value }))}
                />
              </div>
            </div>
          );
        })}

        {selectedPlatforms.size === 0 && (
          <div style={{ marginTop: 20, padding: 16, textAlign: 'center', color: 'var(--faint)', border: '1px dashed var(--border-2)', borderRadius: 12, fontSize: 14 }}>
            Select at least one platform above.
          </div>
        )}

        {/* Error / Success messages */}
        {error && <p style={{ color: 'var(--brand-d)', fontSize: 13, marginTop: 16, fontWeight: 600 }}>{error}</p>}
        {success && <p style={{ color: '#1aa260', fontSize: 13, marginTop: 16, fontWeight: 600 }}>{success}</p>}

        {/* Connect button */}
        <button 
          type="button"
          disabled={isSubmitting || selectedPlatforms.size === 0}
          onClick={handleConnect}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 24, 
            width: '100%',
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'inherit',
            color: '#fff',
            background: 'var(--brand)',
            border: '2px solid var(--brand)',
            borderRadius: 12,
            cursor: selectedPlatforms.size > 0 ? 'pointer' : 'not-allowed',
            opacity: selectedPlatforms.size > 0 ? 1 : 0.5,
          }}
        >
          {isSubmitting ? '⏳ Connecting...' : `Connect ${selectedPlatforms.size} platform${selectedPlatforms.size !== 1 ? 's' : ''}`}
        </button>
        <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 12, textAlign: 'center' }}>We only pull your public stats. No passwords or tokens needed.</div>
      </div>
    </div>
  );
}
