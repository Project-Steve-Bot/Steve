import { ApplyOptions } from '@sapphire/decorators';
import { Args, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<SubCommandPluginCommandOptions>({
	description: 'View and run snippets.',
	runIn: 'GUILD_ANY',
	aliases: ['snip'],
	detailedDescription: {
		usage: '<snip name | list>',
		examples: ['list', 'server info']
	},
	subCommands: [
		{ input: 'run', default: true },
		'list'
	]
})
export class UserCommand extends SteveCommand {

	public async run(msg: Message, args: Args) {
		if (args.finished) {
			return this.list(msg);
		}
		const { content } = await args.pick('snippet');

		return send(msg, content);
	}

	public async list(msg: Message) {
		const response = await sendLoadingMessage(msg);

		if (!msg.inGuild()) {
			throw new UserError({ message: 'This command must be run in a server.', identifier: 'NoGuildSnipRun' });
		}

		const snips = await this.container.db.snips.find({ guildId: msg.guildId }).toArray();

		const embed = new MessageEmbed()
			.setTitle('Snippets')
			.setColor('DARK_VIVID_PINK')
			.setDescription(`\`${snips.map(snip => snip.snipName).join('`, `')}\``);

		return response.edit({ content: ' ', embeds: [embed] });
	}

}
