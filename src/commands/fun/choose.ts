import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';
import { pickRandom } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: `Have ${process.env.BOT_NAME} make up your mind for you.`,
	detailedDescription: {
		usage: '<option1> | <option2> ...'
	}
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		const choices = (await args.rest('string')).split('|');

		send(msg, `${process.env.BOT_NAME} chooses...\n${pickRandom(choices)}`);
	}

}
