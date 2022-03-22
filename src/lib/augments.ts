import type { SteveCollections } from '@lib/extensions/SteveBoi';
import type { DbGuild } from '@lib/types/database';
import type { WebhookClient } from 'discord.js';
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

	// export interface Container {
	// 	logs: WebhookClient;
	// }
}

declare module '@sapphire/pieces' {
	interface Container {
	  discordLogs?: WebhookClient; // Replace this with the connection type of your database library
	}
}

export default undefined;
