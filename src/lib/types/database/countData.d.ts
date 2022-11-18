export interface CountData {
	counter: number;
	lastUser: string | null;
	max: number;
	maxPin: string | null;
	participants: string[];
	started: Date;
}
