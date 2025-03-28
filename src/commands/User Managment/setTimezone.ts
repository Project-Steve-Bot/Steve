import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { oneLine } from 'common-tags';
import { IANAZone } from 'luxon';

@ApplyOptions<CommandOptions>({
	description: 'Set the timezone for commands that use date times.',
	detailedDescription: {
		usage: '<timezone>',
		examples: ['America/New_York', 'Australia/Melbourne', 'Europe/London'],
		extendedHelp: 'The full list of timezones can be found [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)'
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		const inputResult = await args.pickResult('string');

		if (inputResult.isErr()) {
			return send(msg, 'Please provide a timezone.');
		}

		const input = inputResult.unwrap();
		const zone = IANAZone.create(input);

		if (!zone.isValid) {
			return send(msg, oneLine`\`${input}\` does not seem to be a valid timezone.
				You can find the full list of timezones [here](<https://en.wikipedia.org/wiki/List_of_tz_database_time_zones>)`);
		}

		await this.container.db.users.findOneAndUpdate({ id: msg.author.id }, { $set: { timezone: zone.name } }, { upsert: true });

		return send(msg, `Your timezone has been set to ${zone.name}`);
	}

}
