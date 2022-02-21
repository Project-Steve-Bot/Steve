import { SapphireClient } from '@sapphire/framework';
import { Collection, MongoClient } from 'mongodb';
import type { ClientOptions } from 'discord.js';
import type { Reminder } from '../types/reminder';

export type SteveCollections = {
	reminder: Collection<Reminder>;
};

export class SteveBoi  extends SapphireClient {
	public mongo: MongoClient;
	public db: SteveCollections | null = null;

	public constructor(options: ClientOptions) {
		super(options);

		if (!process.env.MONGO_CONNECTION) {
			throw new Error('No database connection string provided.');
		}
		this.mongo = new MongoClient(process.env.MONGO_CONNECTION);

		this.mongo.connect().then(() => {
			const db = this.mongo.db(process.env.BOT_NAME);

			this.db = {
				reminder: db.collection<Reminder>('reminders')
			};

			this.logger.info('Connected to Mongo DB')
		});
	}

	public async destroy() {
		await this.mongo.close();
		super.destroy();
	}
}
