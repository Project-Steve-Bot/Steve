import type { SteveCollections } from './extensions/SteveBoi';
import type { DbGuild } from './types/database';
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
