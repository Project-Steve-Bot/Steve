export interface Reminder {
	user: string;
	content: string;
	expires: Date;
	repeat: number | null;
	channel: string;
	mode: 'public' | 'private';
}

export interface Guild {
	id: string;
	channels?: {
		reminder?: string;
	};
}

export interface User {
	id: string;
	embedColor?: string;
	fax?: {
		number?: string;
		channel?: string;
		text?: string;
		background?: string;
	};
}
