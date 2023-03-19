import { ApplyOptions } from '@sapphire/decorators';
import type { Args, Command, CommandOptions } from '@sapphire/framework';
import type { AutocompleteInteraction, ChatInputCommandInteraction, Message, User } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { getUserReminders, sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Cancel a reminder',
	aliases: ['cr', 'cancel'],
	detailedDescription: {
		usage: '<reminder number>',
		examples: ['1']
	}
})
export class UserCommand extends SteveCommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option
						.setName('reminder')
						.setDescription('The reminder to cancel')
						.setRequired(true)
						.setAutocomplete(true)
				)
		, { idHints: this.container.idHits.get(this.name) });
	}

	public async chatInputRun(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();

		const remindNumber = parseInt(interaction.options.getString('reminder', true));

		const toSend = await this.cancelReminder(interaction.user, remindNumber);

		return interaction.editReply(toSend);
	}

	public async messageRun(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const remindNumber = await args.pick('number');

		const toSend = await this.cancelReminder(msg.author, remindNumber);

		return response.edit(toSend);
	}

	public async autocompleteRun(interaction: AutocompleteInteraction) {
		const focused = interaction.options.getFocused();
		const reminders = await getUserReminders(interaction.user);

		const filteredOptions = reminders
			.map((reminder, idx) => ({ name: reminder.content, value: `${idx + 1}` }))
			.filter(reminder => reminder.name.startsWith(focused));

		return interaction.respond(filteredOptions.length > 0 ? filteredOptions : [{ name: `Reminder #${focused}`, value: focused }]);
	}

	private async cancelReminder(user: User, remindNumber: number): Promise<string> {
		const reminders = await getUserReminders(user);

		if (reminders.length < 1) {
			return 'It looks like you don\'t have any pending reminders mate.';
		}

		const reminder = reminders[remindNumber - 1];

		if (!reminder) {
			return 'Sorry but it doesn\'t look like that reminder exists.';
		}

		await this.container.db.reminder.findOneAndDelete({ _id: reminder._id });

		return `I have deleted ${
			reminder.mode === 'public'
				? reminder.content
				: 'a private reminder.'
		}`;
	}

}
