/** Pre-loaded sports destinations for the Sites tray. Editable: change this
 *  list (or override per-user) to change what ships in the tray. */

export interface SiteTile {
  id: string;
  name: string;
  url: string;
  /** Tile accent color (hex). */
  color: string;
}

export const defaultSites: SiteTile[] = [
  {id: 'espn', name: 'ESPN', url: 'https://www.espn.com', color: '#d6002a'},
  {id: 'bleacher-report', name: 'Bleacher Report', url: 'https://bleacherreport.com', color: '#ff4d00'},
  {id: 'thescore', name: 'theScore', url: 'https://www.thescore.com', color: '#1a73e8'},
  {id: 'sleeper', name: 'Sleeper', url: 'https://sleeper.app', color: '#00c2a8'},
  {id: 'reddit-nba', name: 'r/nba', url: 'https://www.reddit.com/r/nba', color: '#ff4500'},
  {id: 'reddit-nfl', name: 'r/nfl', url: 'https://www.reddit.com/r/nfl', color: '#ff4500'},
  {id: 'statmuse', name: 'StatMuse', url: 'https://www.statmuse.com', color: '#7c4dff'},
  {id: 'draftkings', name: 'DraftKings', url: 'https://sportsbook.draftkings.com', color: '#53d337'},
  {id: 'fanduel', name: 'FanDuel', url: 'https://www.fanduel.com', color: '#1493ff'},
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
    return host.includes('draftkings.com') || host.includes('fanduel.com');
  } catch {
    return false;
  }
}
