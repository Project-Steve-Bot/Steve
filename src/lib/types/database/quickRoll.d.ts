import type { RollSpec } from '../rollSpec';

export interface QuickRoll {
	user: string;
	rollName: string;
	specs: RollSpec[][];
}
