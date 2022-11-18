import type { CountData } from './countData';

export interface DbGuild {
	id: string;
	channels?: {
		reminder?: string;
		fax?: string[];
		count?: string;
		rolls?: string;
	};
	assignableRoles?: string[];
	count?: CountData;
	voteToPin?: number;
}
