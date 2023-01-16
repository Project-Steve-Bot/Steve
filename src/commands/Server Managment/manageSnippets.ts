import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import type { SubcommandOptions } from '@sapphire/plugin-subcommands';
import type { Message } from 'discord.js';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<SubcommandOptions>({
	description: 'Add, remove or edit snips.',
	requiredUserPermissions: 'ManageMessages',
	aliases: ['managesnippet', 'managesnips', 'managesnip'],
	runIn: 'GUILD_ANY',
	detailedDescription: {
		usage: '<add|remove|edit> <snip name> [snip contents]',
		examples: [
			'add bed Go to sleep!!!!!',
			'edit tacos It\'s TACO TIME',
			'remove "Unhelpful snip"'
		],
		extendedHelp: `If you want the snippet name to be more than one work, put it in quotes.
		*Note: Doing this will still allow auto snips, users will just need to use a \`-\` in place of any spaces.*`
	},
	subcommands: [
		{ name: 'add', messageRun: 'msgAdd' },
		{ name: 'create', messageRun: 'msgAdd' },
		{ name: 'remove', messageRun: 'msgRemove' },
		{ name: 'delete', messageRun: 'msgRemove' },
		{ name: 'edit', messageRun: 'msgEdit' },
		{ name: 'update', messageRun: 'msgEdit' }
	]
})
export class UserCommand extends SteveSubcommand {

	public async msgAdd(msg: Message, args: Args) {
		if (!msg.guildId) {
			return send(msg, 'You must be in a server to manage snips!');
		}

		const response = await sendLoadingMessage(msg);

		const snipName = (await args.pick('string')).toLocaleLowerCase();
		const content = await args.rest('string');
		const snipId = snipName.replaceAll(' ', '-');

		await this.container.db.snips.insertOne({
			guildId: msg.guildId,
			snipId,
			snipName,
			content
		});

		return response.edit(`Created new snippet **${snipName}**${snipId === snipName ? '' : ` with snippet id of **${snipId}**`}.`);
	}

	public async msgRemove(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const snip = await args.pick('snippet');

		await this.container.db.snips.findOneAndDelete(snip);

		return response.edit(`Deleted **${snip.snipName}**.`);
	}

	public async msgEdit(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const snip = await args.pick('snippet');
		const content = await args.rest('string');

		await this.container.db.snips.findOneAndUpdate(snip, { $set: { content } });

		return response.edit(`**${snip.snipName}** has been updated.`);
	}

}
