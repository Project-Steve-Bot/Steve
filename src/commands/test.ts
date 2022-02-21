import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
	description: 'Test'
})
export class UserCommand extends Command {

	public async messageRun(msg: Message, args: Args) {
		send(msg, `${await args.pick('number')}`);
	}

}
