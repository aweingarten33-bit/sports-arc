/** Pre-loaded sports destinations for the Sites tray. Editable: change this
 *  list (or override per-user) to change what ships in the tray. */

export type SiteCategory =
  | 'fantasy'
  | 'betting'
  | 'scores'
  | 'news'
  | 'stats'
  | 'official';

export const CATEGORY_ORDER: SiteCategory[] = [
  'fantasy',
  'betting',
  'scores',
  'news',
  'stats',
  'official',
];

export const CATEGORY_LABELS: Record<SiteCategory, string> = {
  fantasy: 'Fantasy',
  betting: 'Betting',
  scores: 'Scores / Live',
  news: 'News / Analysis',
  stats: 'Stats / Research',
  official: 'Official',
};

export interface SiteTile {
  id: string;
  name: string;
  url: string;
  /** Tile accent color (hex). */
  color: string;
  /** Tray section. Omitted for user-added sites (shown under "Added by you"). */
  category?: SiteCategory;
}

export const defaultSites: SiteTile[] = [
  // ——— Fantasy ———
  {id: 'espn-fantasy', name: 'ESPN Fantasy', url: 'https://fantasy.espn.com', color: '#d6002a', category: 'fantasy'},
  {id: 'yahoo-fantasy', name: 'Yahoo Fantasy', url: 'https://sports.yahoo.com/fantasy/', color: '#6001d2', category: 'fantasy'},
  {id: 'sleeper', name: 'Sleeper', url: 'https://sleeper.app', color: '#00c2a8', category: 'fantasy'},
  {id: 'cbs-fantasy', name: 'CBS Fantasy', url: 'https://www.cbssports.com/fantasy/', color: '#003da5', category: 'fantasy'},
  {id: 'fantasypros', name: 'FantasyPros', url: 'https://www.fantasypros.com', color: '#009e60', category: 'fantasy'},
  {id: 'rotowire', name: 'RotoWire', url: 'https://www.rotowire.com', color: '#c41200', category: 'fantasy'},

  // ——— Betting ———
  {id: 'draftkings', name: 'DraftKings', url: 'https://sportsbook.draftkings.com', color: '#53d337', category: 'betting'},
  {id: 'fanduel', name: 'FanDuel', url: 'https://sportsbook.fanduel.com', color: '#1493ff', category: 'betting'},
  {id: 'underdog', name: 'Underdog', url: 'https://underdogfantasy.com', color: '#7b2ff7', category: 'betting'},
  {id: 'prizepicks', name: 'PrizePicks', url: 'https://www.prizepicks.com', color: '#ff2d78', category: 'betting'},
  {id: 'fanatics', name: 'Fanatics Sportsbook', url: 'https://sportsbook.fanatics.com', color: '#e8e8e8', category: 'betting'},
  {id: 'action-network', name: 'Action Network', url: 'https://www.actionnetwork.com', color: '#00c389', category: 'betting'},

  // ——— Scores / Live ———
  {id: 'thescore', name: 'theScore', url: 'https://www.thescore.com', color: '#1a73e8', category: 'scores'},
  {id: 'apple-sports', name: 'Apple Sports', url: 'https://www.apple.com/apple-sports/', color: '#a3a3a3', category: 'scores'},
  {id: 'espn', name: 'ESPN', url: 'https://www.espn.com', color: '#d6002a', category: 'scores'},
  {id: 'cbs-sports', name: 'CBS Sports', url: 'https://www.cbssports.com', color: '#003da5', category: 'scores'},
  {id: 'sofascore', name: 'SofaScore', url: 'https://www.sofascore.com', color: '#3742fa', category: 'scores'},

  // ——— News / Analysis ———
  {id: 'bleacher-report', name: 'Bleacher Report', url: 'https://bleacherreport.com', color: '#ff4d00', category: 'news'},
  {id: 'the-athletic', name: 'The Athletic', url: 'https://www.nytimes.com/athletic', color: '#e8e8e8', category: 'news'},
  {id: 'sports-illustrated', name: 'Sports Illustrated', url: 'https://www.si.com', color: '#d32f2f', category: 'news'},
  {id: 'barstool', name: 'Barstool', url: 'https://www.barstoolsports.com', color: '#ff0090', category: 'news'},
  {id: 'fox-sports', name: 'FOX Sports', url: 'https://www.foxsports.com', color: '#003087', category: 'news'},
  {id: 'nbc-sports', name: 'NBC Sports', url: 'https://www.nbcsports.com', color: '#ffb300', category: 'news'},

  // ——— Stats / Research ———
  {id: 'statmuse', name: 'StatMuse', url: 'https://www.statmuse.com', color: '#7c4dff', category: 'stats'},
  {id: 'sports-reference', name: 'Sports Reference', url: 'https://www.sports-reference.com', color: '#2e7d32', category: 'stats'},
  {id: 'pff', name: 'PFF', url: 'https://www.pff.com', color: '#1e40af', category: 'stats'},
  {id: 'baseball-savant', name: 'Baseball Savant', url: 'https://baseballsavant.mlb.com', color: '#bf0d3e', category: 'stats'},
  {id: 'fangraphs', name: 'FanGraphs', url: 'https://www.fangraphs.com', color: '#16a34a', category: 'stats'},

  // ——— Official ———
  {id: 'nfl', name: 'NFL', url: 'https://www.nfl.com', color: '#013369', category: 'official'},
  {id: 'nba', name: 'NBA', url: 'https://www.nba.com', color: '#e31837', category: 'official'},
  {id: 'mlb', name: 'MLB', url: 'https://www.mlb.com', color: '#1e3a8a', category: 'official'},
  {id: 'nhl', name: 'NHL', url: 'https://www.nhl.com', color: '#e8e8e8', category: 'official'},
  {id: 'wnba', name: 'WNBA', url: 'https://www.wnba.com', color: '#ff6a00', category: 'official'},
  {id: 'mls', name: 'MLS', url: 'https://www.mlssoccer.com', color: '#0f2a5c', category: 'official'},
  {id: 'ncaa', name: 'NCAA', url: 'https://www.ncaa.com', color: '#0085ca', category: 'official'},
];

export interface RankContext {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  /** 0–23 local hour */
  hour: number;
  followedTeamIds?: string[];
}

/**
 * STUB — future smart reordering for the Sites tray.
 * Planned behavior: surface Sleeper on Sundays (gameday), sportsbooks near
 * game time, news apps in the morning. Returns the input order for now.
 */
export function rankSites(sites: SiteTile[], _ctx: RankContext): SiteTile[] {
  return sites;
}

/** True when the URL belongs to a sportsbook (betting hand-off applies). */
export function isSportsbookUrl(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return (
      host.includes('draftkings.com') ||
      host.includes('fanduel.com') ||
      host.includes('underdogfantasy.com') ||
      host.includes('prizepicks.com') ||
      host.includes('fanatics.com')
    );
  } catch {
    return false;
  }
}
