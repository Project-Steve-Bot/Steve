export interface Reminder {
	user: string;
	content: string;
	expires: Date;
	repeat: number | null;
	channel: string;
	mode: 'public' | 'private';
}

export interface DbGuild {
	id: string;
	channels?: {
		reminder?: string;
		fax?: string[];
	};
	assignableRoles?: string[];
}

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

export interface Poll {
	messageId: string;
	channelId: string;
	multiSelect: boolean;
	choices: {
		votes: number;
		text: string;
		voters: string[];
	}[];
	expires: Date;
	allVoters: string[];
}

export interface Snippet {
	guildId: string;
	snipId: string;
	snipName: string;
	content: string;
}
