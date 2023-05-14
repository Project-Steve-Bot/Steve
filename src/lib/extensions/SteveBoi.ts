import { container, Events, SapphireClient } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, type ClientOptions, EmbedBuilder, TextChannel } from 'discord.js';
import { schedule, type ScheduledTask } from 'node-cron';
import type { CmdStats, DbGuild } from '@lib/types/database';
import { generateSnoozeButtons, getChannel, pickRandom } from '@lib/utils';

export class SteveBoi extends SapphireClient {

	private cronRunner: ScheduledTask;

	public countChannels: Map<string, DbGuild> = new Map();

	public constructor(options: ClientOptions) {
		super(options);

		this.cronRunner = schedule('*/30 * * * * *', (now) =>
			this.processCron(typeof now === 'string' ? new Date() : now)
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

		return Promise.all(reminders.map(async (reminder) => {
			const channel
				= this.channels.cache.get(reminder.channel)
				?? await this.channels.fetch(reminder.channel);

			if (!channel?.isTextBased()) return;

			await channel.send({
				content: `<@${reminder.user}>, you asked me to remind you about this:\n${reminder.content}`,
				components: generateSnoozeButtons(reminder.user)
			}).catch(() => {
				container.logger.warn(`Could not send reminder to ${reminder.channel}`);
			});

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
			return;
		}));
	}

	private async closePoll(now: Date) {
		const polls = await container.db.polls
			.find({ expires: { $lte: now } })
			.toArray();

		return Promise.all(polls.map(async (poll) => {
			await container.db.polls.findOneAndDelete({ _id: poll._id });
			const channel = (await getChannel(poll.channelId)) as TextChannel;
			const msg = await channel.messages.fetch({ message: poll.messageId,	cache: true }).catch(() => undefined);

			if (!msg) {
				container.logger.warn(`Could not find poll message\n\tchannelId: ${poll.channelId}\n\tmessageId: ${poll.messageId}`);
				return;
			}

			const newButtons: ActionRowBuilder<ButtonBuilder>[] = [];
			msg.components.forEach((row) => {
				newButtons.push(
					new ActionRowBuilder<ButtonBuilder>()
						.addComponents(row.components.map(button =>
							new ButtonBuilder({ ...button.data, disabled: true })
						))
				);
			});

			const maxVotes = Math.max(...poll.choices.map((choice) => choice.votes));

			const choiceList = poll.choices
				.map((choice) =>
					`${choice.votes >= maxVotes
						? `**[${choice.text} - ${choice.votes} vote${
							choice.votes === 1 ? '' : 's'
						  }](${pickRandom(this.victoryGIFs)})**`
						: `${choice.text} - ${choice.votes} vote${
							choice.votes === 1 ? '' : 's'
						  }`}${
						poll.anonymous
							? ''
							: `\nVoters: ${choice.voters.map(voter => `<@${voter}>`).join(', ')}`}`
				)
				.join('\n');

			const embed = new EmbedBuilder(msg.embeds[0].data).setDescription(
				`${choiceList}\n\nThis poll has ended.`
			);

			await msg.edit({ components: newButtons, embeds: [embed] });
			return;
		}));
	}

	private victoryGIFs = [
		'https://c.tenor.com/tQ-WWJwc2BMAAAAC/im-the-best-racer.gif',
		'https://c.tenor.com/STcTDEpZKZUAAAAM/sweet-victory-spongebob.gif',
		'https://c.tenor.com/hSRuZwH79-8AAAAM/hotdog-we-have-a-weiner.gif',
		'https://cdn.discordapp.com/attachments/944669817137418333/972269254399369236/victory_koala.gif',
		'https://c.tenor.com/Cyr2PR6E3kkAAAAM/sacha-baron.gif',
		'https://c.tenor.com/qZ3NrYDnD4YAAAAM/congrats-the-office.gif',
		'https://c.tenor.com/mU6C8c8tmikAAAAM/congratulations.gif',
		'https://tenor.com/view/baby-yes-yeah-happy-celebrate-gif-16085931'
	];

}
