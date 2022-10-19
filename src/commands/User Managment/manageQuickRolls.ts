import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import type { SubcommandOptions } from '@sapphire/plugin-subcommands';
import type { Message } from 'discord.js';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<SubcommandOptions>({
	description: 'Add, remove or edit quick rolls.',
	aliases: ['mqr', 'manageroll', 'managerolls'],
	detailedDescription: {
		usage: '<add|remove|edit> <roll name> [roll spec]',
		examples: [
			'add qs 1d20+6 d6+4',
			'edit adv 2d20k1',
			'remove dart'
		]
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
		const response = await sendLoadingMessage(msg);

		const rollName = (await args.pick('string')).toLocaleLowerCase();
		const specs = await args.restResult('rollSpec');

		if (specs.isErr()) {
			return response.edit(specs.err().unwrap().message);
		}

		this.container.db.quickRolls.insertOne({
			user: msg.author.id,
			rollName,
			specs: specs.unwrap()
		});

		return response.edit(`Created new quick roll **${rollName}**`);
	}

	public async msgRemove(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const quickRoll = await args.pick('quickRoll');

		await this.container.db.quickRolls.findOneAndDelete(quickRoll);

		return response.edit(`Deleted **${quickRoll.rollName}**.`);
	}

	public async msgEdit(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const quickRoll = await args.pick('quickRoll');
		const specs = await args.restResult('rollSpec');

		if (specs.isErr()) {
			return response.edit(specs.err().unwrap().message);
		}

		await this.container.db.quickRolls.findOneAndUpdate(quickRoll, { $set: { specs: specs.unwrap() } });

		return response.edit(`**${quickRoll.rollName}** has been updated.`);
	}

}
