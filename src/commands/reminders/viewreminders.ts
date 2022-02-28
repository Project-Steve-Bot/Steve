import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import type { CommandOptions } from '@sapphire/framework';
import { chunk } from '@sapphire/utilities';
import { Message, MessageEmbed } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { SteveCommand } from '../../lib/extensions/SteveCommand';
import type { Reminder } from '../../lib/types/database';
import { dateToTimestamp, getUserReminders, sendLoadingMessage } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Show all your pending reminders.',
	aliases: ['vr', 'showreminders', 'sr'],
	detailedDescription: {
		usage: '',
		examples: ['']
	}
})
export class UserCommand extends SteveCommand {
	public async messageRun(msg: Message) {
		const response = await sendLoadingMessage(msg);

		const reminders = await getUserReminders(msg.author);
		
		if (reminders.length < 1) {
			return response.edit('It looks like you don\'t have any pending reminders mate.');
		}
		
		const color = 0xadcb27;

		const pages = chunk(reminders, 5);

		const paginator = new PaginatedMessage({
			template: new MessageEmbed().setTitle('Your Pending Reminders').setColor(color)
		});

		pages.forEach((page) => {
			paginator.addPageEmbed((embed) => {
				return embed.setDescription(page.map((reminder, i) => `**${i + 1}:** ${this.getReminderContent(reminder)}`).join('\n\n'));
			});
		});

		await paginator.run(response, msg.author);
		return response;
	}

	private getReminderContent(reminder: Reminder): string {
		return `${reminder.mode === 'public' ? reminder.content : 'Private reminder, contents hidden.'}\nThis reminder goes off at ${dateToTimestamp(
			reminder.expires
		)}, thats ${dateToTimestamp(reminder.expires, 'R')}${
			reminder.repeat ? ` and again every ${prettyMilliseconds(reminder.repeat, { verbose: true })}` : ''
		}.`;
	}
}
