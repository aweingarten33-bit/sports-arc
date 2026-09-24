import type { EntityId } from '@sideline/types';
export type ContextSeed =
 | { kind:'search-query'; query:string }
 | { kind:'web-page'; url:string; title?:string }
 | { kind:'article'; articleId:EntityId; title:string; url?:string }
 | { kind:'player'; playerId:EntityId; name:string }
 | { kind:'team'; teamId:EntityId; name:string }
 | { kind:'game'; gameId:EntityId }
 | { kind:'score'; gameId:EntityId; home:number; away:number }
 | { kind:'standings'; sport:string; season:string }
 | { kind:'injury'; playerId:EntityId; status:string }
 | { kind:'fantasy-team'; teamId:EntityId }
 | { kind:'fantasy-roster'; rosterId:EntityId }
 | { kind:'fantasy-matchup'; matchupId:EntityId }
 | { kind:'waiver'; leagueId:EntityId }
 | { kind:'betting-market'; marketId:EntityId }
 | { kind:'player-prop'; propId:EntityId; playerId:EntityId; line:number; odds:number }
 | { kind:'bet-slip'; slipId:EntityId }
 | { kind:'parlay'; parlayId:EntityId }
 | { kind:'odds'; marketId:EntityId };
export interface ContextEnvelope { seed: ContextSeed; screen: string; entities: EntityId[]; fantasyState?: string; bettingState?: string; capturedAt: string; }
export function contextLabel(seed: ContextSeed): string { switch(seed.kind){case 'player':return `Ask about ${seed.name}`;case 'player-prop':return 'Ask about this prop';case 'fantasy-matchup':return 'Analyze my matchup';case 'article':return `Ask about ${seed.title}`;case 'web-page':return 'Ask about this page';default:return 'Ask about what you are seeing';} }
