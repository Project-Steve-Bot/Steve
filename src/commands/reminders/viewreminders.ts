import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import type { CommandOptions } from '@sapphire/framework';
import { chunk } from '@sapphire/utilities';
import { ChannelType, type ColorResolvable, Message, EmbedBuilder, time, TimestampStyles } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import type { Reminder } from '@lib/types/database';
import { getUserReminders, sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Show all your pending reminders.',
	aliases: ['vr', 'reminders', 'showreminders', 'sr']
})
export class UserCommand extends SteveCommand {

	private pageLen = 5;

	public async messageRun(msg: Message) {
		const response = await sendLoadingMessage(msg);

		const reminders = await getUserReminders(msg.author);

		if (reminders.length < 1) {
			return response.edit(
				"It looks like you don't have any pending reminders mate."
			);
		}

		const user = await this.container.db.users.findOne({ id: msg.author.id });

		const color = user?.embedColor as ColorResolvable ?? '#adcb27';

		const pages = chunk(reminders, this.pageLen);

		const paginator = new PaginatedMessage({
			template: {
				content: ' ',
				embeds: [
					new EmbedBuilder()
						.setTitle('Your Pending Reminders')
						.setColor(color)
				]
			}
		});

		pages.forEach((page, pageNum) => {
			paginator.addPageEmbed((embed) =>
				embed.setDescription(page.map((reminder, remindNum) =>
					`**${(pageNum * this.pageLen) + remindNum + 1}:** ${this.getReminderContent(reminder, msg)}`
				).join('\n\n'))
			);
		});

		await paginator.run(response, msg.author);
		return response;
	}

	private getReminderContent(reminder: Reminder, msg: Message): string {
		return `${
			reminder.mode === 'public' || msg.channel.type === ChannelType.DM
				? reminder.content
				: 'Private reminder, contents hidden.'
		}\nThis reminder goes off at ${time(
			reminder.expires, TimestampStyles.ShortDateTime
		)}, thats ${time(reminder.expires, TimestampStyles.RelativeTime)}${
			reminder.repeat
				? ` and again every ${prettyMilliseconds(reminder.repeat, {
					verbose: true
				  })}`
				: ''
		}.`;
	}

}
