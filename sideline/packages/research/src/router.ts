import type { ContextEnvelope } from '@sideline/context';
export type RouteNeed = 'app-context'|'sports-data'|'fantasy-data'|'odds-data'|'web-research';
export interface QueryPlan { needs: RouteNeed[]; reason: string; }
export interface QueryRequest { question:string; context:ContextEnvelope; }
export function routeQuery(request:QueryRequest):QueryPlan { const {seed}=request.context; const needs:RouteNeed[]=['app-context']; if(seed.kind==='player'||seed.kind==='team'||seed.kind==='game'||seed.kind==='article') needs.push('sports-data'); if(seed.kind==='fantasy-matchup'||seed.kind==='fantasy-roster'||seed.kind==='fantasy-team') needs.push('fantasy-data'); if(seed.kind==='player-prop'||seed.kind==='betting-market'||seed.kind==='odds'||seed.kind==='bet-slip'||seed.kind==='parlay') needs.push('odds-data'); if(/why|latest|news|source|report/i.test(request.question)) needs.push('web-research'); return {needs:[...new Set(needs)],reason:`Resolved “this” to ${seed.kind}`}; }
