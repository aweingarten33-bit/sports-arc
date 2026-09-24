import {createPrivacyStore, type PrivacyStore} from '@sideline/ui';
import type {UserSportsContext} from '@sideline/types';

// Single shared privacy store for the whole app. All provider credentials
// stay in apps/api; this store only holds on-device preferences.
export const privacyStore: PrivacyStore = createPrivacyStore();

// Mock fan context used by the Companion and Chirp demos until a real
// PersonalizationEngine exists. Never treated as live data.
export const mockUserContext: UserSportsContext = {
  followedTeamIds: ['nyk'],
  followedPlayerIds: ['brunson'],
  fantasyRosterIds: ['roster-1'],
  recentActivity: ['viewed-player:brunson', 'viewed-prop:prop-1'],
};
