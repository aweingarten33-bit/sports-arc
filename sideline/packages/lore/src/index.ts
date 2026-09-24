export interface LoreNode { id:string; label:string; kind:string; }
export interface LoreEdge { from:string; to:string; relation:string; }
export interface LoreCard { id:string; nodeId:string; title:string; body:string; companionLine?:string; }
export interface LoreTrail { nodeIds:string[]; }
export interface DiscoveryCandidate { node:LoreNode; relevance:number; recency:number; novelty:number; personalRelevance:number; confidence:number; sourceQuality:number; fantasyRelevance:number; bettingRelevance:number; }
export interface LoreSession { id:string; root:string; trail:LoreTrail; }
export function rankCandidates(candidates:DiscoveryCandidate[],seen:string[]):DiscoveryCandidate[]{return [...candidates].filter(c=>!seen.includes(c.node.id)).sort((a,b)=>(b.relevance+b.novelty+b.personalRelevance+b.confidence+b.sourceQuality)-(a.relevance+a.novelty+a.personalRelevance+a.confidence+a.sourceQuality));}
export const mockLoreCards:LoreCard[]=[{id:'l1',nodeId:'usage',title:'The quiet reason behind the prop',body:'Usage, pace, and defensive attention make the number more interesting than it looks.'},{id:'l2',nodeId:'rivalry',title:'A rivalry with receipts',body:'Trace the matchup history before jumping to the headline.'}];
