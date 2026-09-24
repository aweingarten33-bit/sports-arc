export interface OddsSnapshot { id:string; marketId:string; line:number; odds:number; capturedAt:string; source:'MOCK'; }
export interface LineMovement { marketId:string; from:OddsSnapshot; to:OddsSnapshot; delta:number; }
export interface PlayerProp { id:string; playerId:string; description:string; line:number; odds:number; }
export interface OddsProvider { snapshots(marketId:string):Promise<OddsSnapshot[]>; }
export class MockOddsProvider implements OddsProvider { async snapshots(marketId:string){return [{id:'o1',marketId,line:26.5,odds:-115,capturedAt:'2026-09-23T12:00:00Z',source:'MOCK'},{id:'o2',marketId,line:27.5,odds:-110,capturedAt:'2026-09-24T12:00:00Z',source:'MOCK'}];} }
export function movement(snapshots:OddsSnapshot[]):LineMovement|undefined { const from=snapshots[0],to=snapshots.at(-1); return from&&to?{marketId:to.marketId,from,to,delta:to.line-from.line}:undefined; }
