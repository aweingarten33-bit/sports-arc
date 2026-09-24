export type Sport = 'nba' | 'nfl' | 'mlb' | 'nhl' | 'soccer';
export type EntityId = string;
export interface Team { id: EntityId; name: string; abbreviation: string; sport: Sport; }
export interface Player { id: EntityId; name: string; teamId: EntityId; position: string; sport: Sport; }
export interface Game { id: EntityId; homeTeamId: EntityId; awayTeamId: EntityId; startsAt: string; status: 'scheduled'|'live'|'final'; }
export interface UserSportsContext { followedTeamIds: EntityId[]; followedPlayerIds: EntityId[]; fantasyRosterIds: EntityId[]; recentActivity: string[]; }
export interface PrivacyPreferences { personalization: boolean; privateBrowsing: boolean; analytics: boolean; notifications: boolean; }
