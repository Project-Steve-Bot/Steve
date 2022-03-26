import type { SteveCollections } from '@lib/mongo';
import type { DbGuild } from '@lib/types/database';
import type { WebhookClient } from 'discord.js';
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
		discordLogs?: WebhookClient;
		db: SteveCollections;
		mongo: MongoClient;
	}
}

export default undefined;
