// @ts-nocheck ts(2445)
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';
import { inspect } from 'util';
import { SteveCommand } from '../lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Test'
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		// args.peek('number');
		// this.client.logger.debug('before', inspect(args.parser, {depth: null}));
		send(msg, `${await args.pick('duration')}`);
		// this.client.logger.debug('after', inspect(args.parser, {depth: null}));
	}

}
