'use client';

export default function LoadingSpinner({ message = 'データを取得中...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#E2E8F0]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#0D9488] animate-spin" />
      </div>
      <p className="text-[#64748B] text-sm">{message}</p>
    </div>
  );
}
