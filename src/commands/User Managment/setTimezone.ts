import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Set the timezone for commands that use date times.',
	detailedDescription: {
		usage: '<timezone>',
		examples: ['+5', '-3:30', '+0'],
		extendedHelp: 'Timezones must be hours relative to GMT.'
	}
})
export class UserCommand extends SteveCommand {

	private timezoneRegex = /[-+]\d?\d(:[03]0)?/i;

	public async messageRun(msg: Message, args: Args) {
		const input = await args.pickResult('string');

		if (!input.success) {
			return send(msg, 'Please provide a timezone.');
		}

		if (!this.timezoneRegex.test(input.value)) {
			return send(msg, `${input.value} is not a valid timezone.`);
		}

		const timezone = input.value.includes(':') ? input.value : `${input.value}:00`;

		await this.client.db.users.findOneAndUpdate({ id: msg.author.id }, { $set: { timezone } }, { upsert: true });

		return send(msg, `Your timezone has been set to ${timezone}`);
	}

}
