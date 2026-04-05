'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import MatchDetail from './MatchDetail';

interface MatchDetailModalProps {
  matchId: string | null;
  open: boolean;
  onClose: () => void;
  playerName: string;
  playerTag: string;
}

export default function MatchDetailModal({
  matchId,
  open,
  onClose,
  playerName,
  playerTag,
}: MatchDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) onClose(); }}>
      <DialogContent
        className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">マッチ詳細</DialogTitle>
        <div className="p-4 sm:p-6">
          {matchId && (
            <MatchDetail
              matchId={matchId}
              highlightName={playerName}
              highlightTag={playerTag}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
