import type { SteveCollections } from '@lib/mongo';
import type { DbGuild } from '@lib/types/database';
import type { Collection, WebhookClient } from 'discord.js';
import type { MongoClient } from 'mongodb';
declare module '@sapphire/framework' {
	export interface DetailedDescriptionCommandObject {
		usage?: string;
		examples?: string[];
		extendedHelp?: string;
	}

	export interface SapphireClient {
		db: SteveCollections;
		countChannels: Map<string, DbGuild>;
		destroy(): Promise<void>;
	}

}

declare module '@sapphire/pieces' {
	interface Container {
		hooks: {
			discordLogs: WebhookClient | null;
			suggest: WebhookClient | null;
		}
		db: SteveCollections;
		mongo: MongoClient;
		cmdStats: Collection<string, number>;
		statusUpdateFlag: number;
	}
}

export default undefined;
