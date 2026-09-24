import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
export interface HistoryItem {url:string; title?:string; visitedAt:string}
interface MobileState {history:HistoryItem[]; loadHistory:()=>Promise<void>; addHistory:(item:HistoryItem)=>Promise<void>; clearHistory:()=>Promise<void>}
const key='sideline.history';
export const useMobileStore=create<MobileState>((set,get)=>({history:[],async loadHistory(){const raw=await AsyncStorage.getItem(key);set({history:raw?JSON.parse(raw) as HistoryItem[]:[]})},async addHistory(item){const next=[item,...get().history.filter(entry=>entry.url!==item.url)].slice(0,50);set({history:next});await AsyncStorage.setItem(key,JSON.stringify(next))},async clearHistory(){set({history:[]});await AsyncStorage.removeItem(key)}}));
