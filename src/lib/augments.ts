import type { SteveCollections } from './extensions/SteveBoi';
declare module '@sapphire/framework' {
	export interface DetailedDescriptionCommandObject {
		usage?: string;
		examples?: string[];
		extendedHelp?: string;
	}

	export interface SapphireClient {
		db: SteveCollections;
		destroy(): Promise<void>;
	}
}
export default undefined;
