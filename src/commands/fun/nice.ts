import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'nice'
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		return msg.react('👌');
	}

}
