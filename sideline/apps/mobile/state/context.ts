import React, {createContext, useContext, useMemo, type PropsWithChildren} from 'react';
import {createContextStore, useContextEnvelope} from '@sideline/context';
import type {ContextSeed} from '@sideline/types';
const store=createContextStore();
const Context=createContext(store);
export function AppContextProvider({children}:PropsWithChildren){return <Context.Provider value={store}>{children}</Context.Provider>}
export function useAppContext(){return useContext(Context)}
export function useCurrentEnvelope(){const value=useContext(Context); return useContextEnvelope(value)}
export function useEmitSeed(seed:ContextSeed, screen:string, entities:string[]=[]){const context=useContext(Context); return useMemo(()=>({emit:()=>context.setSeed(seed,screen,entities)}),[context,seed,screen,entities])}
