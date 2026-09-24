import type { ContextEnvelope, ContextSeed } from './index';
export interface ContextStore { envelope: ContextEnvelope|null; setSeed(seed:ContextSeed, screen:string, entities?:string[]):void; clear():void; }
export function createContextStore(): ContextStore { let envelope: ContextEnvelope|null=null; return { get envelope(){return envelope;}, setSeed(seed,screen,entities=[]){envelope={seed,screen,entities,capturedAt:new Date().toISOString()};}, clear(){envelope=null;} }; }
export function useContextEnvelope(store:ContextStore): ContextEnvelope|null { return store.envelope; }
