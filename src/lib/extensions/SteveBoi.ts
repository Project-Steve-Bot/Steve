import { SapphireClient } from '@sapphire/framework';
import type { Collection, MongoClient } from 'mongodb';
import { ClientOptions, MessageEmbed, TextChannel } from 'discord.js';
import type { DbGuild, Reminder, DbUser, Poll } from '../types/database';
import { schedule, ScheduledTask } from 'node-cron';
import { getChannel } from '../utils';

export type SteveCollections = {
	reminder: Collection<Reminder>;
	guilds: Collection<DbGuild>;
	users: Collection<DbUser>;
	polls: Collection<Poll>;
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
			guilds: db.collection<DbGuild>('guilds'),
			users: db.collection<DbUser>('users'),
			polls: db.collection<Poll>('polls')
		};

		this.logger.info('Connected to Mongo DB');

		this.cronRunner = schedule('*/30 * * * * *', (now) => this.processCron(now));
	}

	public async destroy() {
		await this.mongo.close();
		this.cronRunner.stop();
		super.destroy();
	}

	private async processCron(now: Date) {
		this.runReminder(now);
		this.closePoll(now);
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

	private async closePoll(now: Date) {
		const polls = await this.db.polls.find({ expires: { $lte: now } }).toArray();

		polls.forEach(async (poll) => {
			const channel = (await getChannel(poll.channelId)) as TextChannel;
			const msg = await channel.messages.fetch(poll.messageId, { cache: true });

			const components = msg.components;

			components.forEach((row) => {
				row.components.forEach((c) => {
					c.setDisabled(true);
				});
			});

			const maxVotes = Math.max(...poll.choices.map((c) => c.votes));

			const choiceList = poll.choices.map((c) =>
				c.votes >= maxVotes
					? `**[${c.text} - ${c.votes} vote${c.votes === 1 ? '' : 's'}](https://tenor.com/view/im-the-best-racer-fox-sports-gif-5943746)**`
					: `${c.text} - ${c.votes} vote${c.votes === 1 ? '' : 's'}`
			).join('\n');

			const embed = new MessageEmbed(msg.embeds[0])
				.setDescription(`${choiceList}\n\nThis poll has ended.`);

			await msg.edit({ components, embeds: [embed] });

			this.db.polls.findOneAndDelete({ _id: poll._id });
		});
	}
}
