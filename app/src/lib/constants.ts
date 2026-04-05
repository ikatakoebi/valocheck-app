export const RANK_TIERS: Record<string, string> = {
  'Iron': 'アイアン',
  'Bronze': 'ブロンズ',
  'Silver': 'シルバー',
  'Gold': 'ゴールド',
  'Platinum': 'プラチナ',
  'Diamond': 'ダイヤモンド',
  'Ascendant': 'アセンダント',
  'Immortal': 'イモータル',
  'Radiant': 'レディアント',
};

export function translateRankTier(tierName: string): string {
  if (!tierName || tierName === 'Unrated' || tierName === 'Unranked') {
    return 'ランクなし';
  }
  // tierName format: "Diamond 1", "Iron 3", "Radiant" etc.
  const parts = tierName.split(' ');
  const englishTier = parts[0];
  const division = parts[1] || '';
  const japaneseTier = RANK_TIERS[englishTier];
  if (!japaneseTier) return tierName;
  return division ? `${japaneseTier}${division}` : japaneseTier;
}

export const RANK_ICON_BASE_URL =
  'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04';

export function getRankIconUrl(tier: number): string {
  if (!tier || tier === 0) return '';
  return `${RANK_ICON_BASE_URL}/${tier}/largeicon.png`;
}

export const DEFAULT_REGION = 'ap';
export const DEFAULT_PLATFORM = 'pc';
