export interface ChannelRename {
	messageId: string;
	channelId: string;
	newName: string;
	requester: string;
	yesVoters: string[];
	noVoters: string[];
}
