import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';
import { getUserReminders, sendLoadingMessage } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Cancel a reminder',
	aliases: ['cr', 'cancel'],
	detailedDescription: {
		usage: '<reminder number>',
		examples: ['1']
	}
})
export class UserCommand extends SteveCommand {
	public async messageRun(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const remindNumber = (await args.pick('number'));

		const reminders = await getUserReminders(msg.author);

		if (reminders.length < 1) {
			return response.edit({ content: "It looks like you don't have any pending reminders mate.", embeds: [] });
		}

		const reminder = reminders[remindNumber - 1];

		if (!reminder) {
			return response.edit({ content: "Sorry but it doesn't look like that reminder exists.", embeds: [] });
		}

		await this.client.db.reminder.findOneAndDelete({ _id: reminder._id });

		return response.edit({ content: `I have deleted ${reminder.mode === 'public' ? reminder.content : 'a private reminder.'}`, embeds: [] });
	}
}
