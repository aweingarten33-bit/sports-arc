import type { Player, Team, UserSportsContext } from '@sideline/types';
export interface SportsProvider { getPlayer(id:string):Promise<Player>; getTeam(id:string):Promise<Team>; }
export const mockPlayer:Player={id:'brunson',name:'Jalen Brunson',teamId:'nyk',position:'G',sport:'nba'};
export const mockTeam:Team={id:'nyk',name:'New York Knicks',abbreviation:'NYK',sport:'nba'};
export class MockSportsProvider implements SportsProvider { async getPlayer(){return mockPlayer;} async getTeam(){return mockTeam;} }
export const mockUserContext:UserSportsContext={followedTeamIds:['nyk'],followedPlayerIds:['brunson'],fantasyRosterIds:['roster-1'],recentActivity:['Opened Brunson prop']};
