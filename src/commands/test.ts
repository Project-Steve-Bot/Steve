/*eslint-disable*/
// @ts-nocheck ts(2445)
import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed } from 'discord.js';
import { inspect } from 'util';
import { SteveCommand } from '../lib/extensions/SteveCommand';
import { dateToTimestamp } from '../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Test'
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		const embed = new MessageEmbed()
			.setDescription('test')
			.setFooter({ text: dateToTimestamp(new Date()) });
		send(msg, { embeds: [embed] });
	}

}
