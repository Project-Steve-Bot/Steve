import type { MongoClient } from 'mongodb';
import type { SteveCollections } from './extensions/SteveBoi';
declare module '@sapphire/framework' {
	export interface DetailedDescriptionCommandObject {
		usage?: string;
		examples?: string[];
		extendedHelp?: string;
	}

	export interface SapphireClient {
		db: SteveCollections | null;
		destroy(): Promise<void>;
		mongo: MongoClient;
	}
}
export default undefined;
