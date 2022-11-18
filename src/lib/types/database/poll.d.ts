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
