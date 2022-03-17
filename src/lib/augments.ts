import type { SteveCollections } from '@lib/extensions/SteveBoi';
import type { DbGuild } from '@lib/types/database';
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
export default undefined;
