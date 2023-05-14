import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { oneLine } from 'common-tags';

@ApplyOptions<CommandOptions>({
	description: 'Set the timezone for commands that use date times.',
	detailedDescription: {
		usage: '<timezone>',
		examples: ['+5', '-3:30', '+0'],
		extendedHelp: 'Timezones must be hours relative to GMT.'
	}
})
export class UserCommand extends SteveCommand {

	private timezoneRegex = /^[-+]\d?\d(:[03]0)?$/i;

	public async messageRun(msg: Message, args: Args) {
		const inputResult = await args.pickResult('string');

		if (inputResult.isErr()) {
			return send(msg, 'Please provide a timezone.');
		}

		const input = inputResult.unwrap();
		if (!this.timezoneRegex.test(input)) {
			return send(msg, oneLine`${input} is not a valid timezone.
			Timezones are assumed to be relative to GMT and should be in the format of \`(+|-)<hours>(:minutes)\``);
		}

		const timezone = input.includes(':') ? input : `${input}:00`;

		await this.container.db.users.findOneAndUpdate({ id: msg.author.id }, { $set: { timezone } }, { upsert: true });

		return send(msg, `Your timezone has been set to ${timezone}`);
	}

}
