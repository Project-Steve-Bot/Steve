export interface DbUser {
	id: string;
	timezone?: string;
	embedColor?: string;
	fax?: {
		number?: string;
		channel?: string;
		text?: string;
		background?: string;
	};
}
