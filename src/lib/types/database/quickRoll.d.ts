import type { RollSpec } from '../rollSpec';

export type RollType = 'attack'|'ability'|'attribute'|'save';
export interface QuickRoll {
	user: string;
	rollName: string;
	specs: RollSpec[][];
	active: boolean;
	importInfo?: {
		character: string;
		type: RollType;
	}
}
