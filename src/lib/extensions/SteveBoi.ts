import { container, Events, SapphireClient } from '@sapphire/framework';
import { ClientOptions, MessageEmbed, TextChannel } from 'discord.js';
import { schedule, ScheduledTask } from 'node-cron';
import type { CmdStats, DbGuild } from '@lib/types/database';
import { getChannel } from '@lib/utils';

export class SteveBoi extends SapphireClient {

	private cronRunner: ScheduledTask;

	public countChannels: Map<string, DbGuild> = new Map();

	public constructor(options: ClientOptions) {
		super(options);

		this.cronRunner = schedule('*/30 * * * * *', (now) =>
			this.processCron(now)
		);
	}

	public async destroy() {
		await container.mongo.close();
		this.cronRunner.stop();
		super.destroy();
	}

	private async processCron(now: Date) {
		Promise.all([
			this.runReminder(now),
			this.closePoll(now),
			this.updateStats()
		]).catch(async error => this.emit(Events.Error, error));
	}

	private async updateStats() {
		if (container.statusUpdateFlag === 0) {
			return;
		}

		const document: CmdStats = { data: [] };

		container.cmdStats.forEach((uses, command) => document.data.push({ command, uses }));

		await container.db.cmdStats.findOneAndReplace({}, document, { upsert: true });

		container.statusUpdateFlag = 0;
	}

	private async runReminder(now: Date) {
		const reminders = await container.db.reminder
			.find({
				expires: { $lte: now }
			})
			.toArray();

		reminders.forEach(async (reminder) => {
			const channel
				= this.channels.cache.get(reminder.channel)
				?? await this.channels.fetch(reminder.channel);

			if (!channel?.isText()) return;

			channel.send(
				`<@${reminder.user}>, you asked me to remind you about this:\n${reminder.content}`
			);

			if (reminder.repeat) {
				container.db.reminder.findOneAndReplace(
					{ _id: reminder._id },
					{
						...reminder,
						expires: new Date(now.getTime() + reminder.repeat)
					}
				);
			} else {
				container.db.reminder.findOneAndDelete({ _id: reminder._id });
			}
		});
	}

	private async closePoll(now: Date) {
		const polls = await container.db.polls
			.find({ expires: { $lte: now } })
			.toArray();

		polls.forEach(async (poll) => {
			const channel = (await getChannel(poll.channelId)) as TextChannel;
			const msg = await channel.messages.fetch(poll.messageId, {
				cache: true
			});

			const { components } = msg;

			components.forEach((row) => {
				row.components.forEach((button) => {
					button.setDisabled(true);
				});
			});

			const maxVotes = Math.max(...poll.choices.map((choice) => choice.votes));

			const choiceList = poll.choices
				.map((choice) =>
					choice.votes >= maxVotes
						? `**[${choice.text} - ${choice.votes} vote${
							choice.votes === 1 ? '' : 's'
						  }](https://tenor.com/view/im-the-best-racer-fox-sports-gif-5943746)**`
						: `${choice.text} - ${choice.votes} vote${
							choice.votes === 1 ? '' : 's'
						  }`
				)
				.join('\n');

			const embed = new MessageEmbed(msg.embeds[0]).setDescription(
				`${choiceList}\n\nThis poll has ended.`
			);

			await msg.edit({ components, embeds: [embed] });

			container.db.polls.findOneAndDelete({ _id: poll._id });
		});
	}

}
