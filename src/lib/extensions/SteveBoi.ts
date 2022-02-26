import { SapphireClient } from '@sapphire/framework';
import type { Collection, MongoClient } from 'mongodb';
import type { ClientOptions } from 'discord.js';
import type { Guild, Reminder, User } from '../types/database';
import { schedule, ScheduledTask } from 'node-cron';

export type SteveCollections = {
	reminder: Collection<Reminder>;
	guilds: Collection<Guild>;
	users: Collection<User>;
};

export class SteveBoi extends SapphireClient {
	private mongo: MongoClient;
	public db: SteveCollections;

	private cronRunner: ScheduledTask;

	public constructor(options: ClientOptions, mongo: MongoClient) {
		super(options);

		this.mongo = mongo;

		const db = this.mongo.db(process.env.BOT_NAME);

		this.db = {
			reminder: db.collection<Reminder>('reminders'),
			guilds: db.collection<Guild>('guilds'),
			users: db.collection<User>('users')
		};

		this.logger.info('Connected to Mongo DB');

		this.cronRunner = schedule('*/30 * * * * *', (now) => this.runReminder(now));
	}

	public async destroy() {
		await this.mongo.close();
		this.cronRunner.stop();
		super.destroy();
	}

	private async runReminder(now: Date) {
		const reminders = await this.db.reminder
			.find({
				expires: { $lte: now }
			})
			.toArray();

		reminders.forEach(async (reminder) => {
			const channel = this.channels.cache.get(reminder.channel) ?? (await this.channels.fetch(reminder.channel));

			if (!channel?.isText()) return;

			channel.send(`<@${reminder.user}>, you asked me to remind you about this:\n${reminder.content}`);

			if (reminder.repeat) {
				this.db.reminder.findOneAndReplace(
					{ _id: reminder._id },
					{
						...reminder,
						expires: new Date(now.getTime() + reminder.repeat)
					}
				);
			} else {
				this.db.reminder.findOneAndDelete({ _id: reminder._id });
			}
		});
	}
}
