'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm() {
  const [riotId, setRiotId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = riotId.trim();
    if (!trimmed.includes('#')) {
      setError('Riot IDは「名前#タグ」の形式で入力してください');
      return;
    }

    const hashIndex = trimmed.indexOf('#');
    const name = trimmed.slice(0, hashIndex).trim();
    const tag = trimmed.slice(hashIndex + 1).trim();

    if (!name) {
      setError('プレイヤー名を入力してください');
      return;
    }
    if (!tag) {
      setError('タグを入力してください');
      return;
    }

    router.push(`/player/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            type="text"
            value={riotId}
            onChange={(e) => {
              setRiotId(e.target.value);
              if (error) setError('');
            }}
            placeholder="名前#タグ（例: Player#JP1）"
            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 transition-all text-base shadow-sm"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-lg transition-colors text-sm shadow-sm"
          >
            検索
          </button>
        </div>
        {error && (
          <p className="text-[#E11D48] text-sm">{error}</p>
        )}
      </div>
    </form>
  );
}
