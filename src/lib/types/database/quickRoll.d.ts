import type { RollSpec } from '../rollSpec';
import type { ObjectId } from 'mongodb';

export interface QuickRoll {
	user: string;
	rollName: string;
	specs: RollSpec[][];
	active: boolean;
	importInfo?: {
		character: ObjectId;
		type: 'attack'|'ability'|'save';
	}
}
