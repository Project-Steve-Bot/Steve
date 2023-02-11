export type KeepType = 'highest' | 'lowest' | false;

export interface RollSpec {
	input: string;
	count: number;
	sides: number;
	keep: KeepType;
	modifier: number
	keepCount?: number;
	minimum?: number;
}
