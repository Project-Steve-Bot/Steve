import { ApplyOptions } from '@sapphire/decorators';
import { Args, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { SubcommandOptions } from '@sapphire/plugin-subcommands';
import { Message, EmbedBuilder } from 'discord.js';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<SubcommandOptions>({
	description: 'View and run snippets.',
	runIn: 'GUILD_ANY',
	aliases: ['snip'],
	detailedDescription: {
		usage: '<snip name | list>',
		examples: ['list', 'server info']
	},
	subcommands: [
		{ name: 'run', messageRun: 'msgRun', default: true },
		{ name: 'list', messageRun: 'msgList' }
	]
})
export class UserCommand extends SteveSubcommand {

	public async msgRun(msg: Message, args: Args): Promise<Message<boolean>> {
		if (args.finished) {
			return this.msgList(msg);
		}

		const snipResult = await args.restResult('snippet');

		if (snipResult.isErr()) {
			throw new UserError({
				identifier: 'InvalidSnippet',
				message: 'Could not find requested snippet.'
			});
		}

		return send(msg, snipResult.unwrap());
	}

	public async msgList(msg: Message): Promise<Message<boolean>> {
		const response = await sendLoadingMessage(msg);

		if (!msg.inGuild()) {
			throw new UserError({ message: 'This command must be run in a server.', identifier: 'NoGuildSnipRun' });
		}

		const snips = await this.container.db.snips.find({ guildId: msg.guildId }).toArray();

		const embed = new EmbedBuilder()
			.setTitle('Snippets')
			.setColor('DarkVividPink')
			.setDescription(`\`${snips.map(snip => snip.snipName).join('`, `')}\``);

		return response.edit({ content: ' ', embeds: [embed] });
	}

}
