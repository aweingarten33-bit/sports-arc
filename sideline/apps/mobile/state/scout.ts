import {create} from 'zustand';
import type {ContextSeed} from '@sideline/context';

export interface ScoutAsk {
  question: string;
  seed: ContextSeed;
}

interface ScoutState {
  /** Panel visibility. Toggled by the bottom-bar Scout item and the floating pill. */
  open: boolean;
  /** A question pushed from outside the page (e.g. Lore's "Scout this"). Consumed once. */
  externalAsk: ScoutAsk | null;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Queue a question from another screen; the panel consumes it on open. */
  askAbout: (ask: ScoutAsk) => void;
  consumeAsk: () => ScoutAsk | null;
}

export const useScoutStore = create<ScoutState>((set, get) => ({
  open: false,
  externalAsk: null,
  setOpen: open => set({open}),
  toggle: () => set({open: !get().open}),
  askAbout: ask => set({externalAsk: ask, open: true}),
  consumeAsk: () => {
    const ask = get().externalAsk;
    if (ask) set({externalAsk: null});
    return ask;
  },
}));
