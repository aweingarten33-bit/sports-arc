export interface ScoringSettings { format:'half-ppr'|'ppr'|'standard'; superflex:boolean; }
export interface FantasyLeague { id:string; name:string; teamCount:number; settings:ScoringSettings; }
export interface FantasyRoster { id:string; teamId:string; playerIds:string[]; }
export interface FantasyMatchup { id:string; leagueId:string; userRosterId:string; opponentRosterId:string; projectedUser:number; projectedOpponent:number; }
export interface FantasyProvider { getMatchup(id:string):Promise<FantasyMatchup>; }
export const mockLeague:FantasyLeague={id:'league-1',name:'Tuesday Night League',teamCount:12,settings:{format:'half-ppr',superflex:true}};
export class MockFantasyProvider implements FantasyProvider { async getMatchup(){return {id:'matchup-1',leagueId:'league-1',userRosterId:'roster-1',opponentRosterId:'roster-2',projectedUser:118.4,projectedOpponent:114.8};} }
