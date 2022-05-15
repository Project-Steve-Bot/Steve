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
		count?: string;
	};
	assignableRoles?: string[];
	count?: CountData;
	voteToPin?: number;
}

export interface CountData {
	counter: number;
	lastUser: string | null;
	max: number;
	maxPin: string | null;
	participants: string[];
	started: Date;
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
	anonymous: boolean;
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

export interface CmdStats {
	data: {
		command: string;
		uses: number;
	}[];
}
