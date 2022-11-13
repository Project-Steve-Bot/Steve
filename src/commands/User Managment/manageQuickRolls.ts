import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import type { SubcommandOptions } from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed } from 'discord.js';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<SubcommandOptions>({
	description: 'Add, remove or edit quick rolls.',
	aliases: ['mqr', 'manageroll', 'managerolls'],
	detailedDescription: {
		usage: '<add|remove|edit|view> <roll name> [roll spec]',
		examples: [
			'add qs 1d20+6 d6+4',
			'edit adv 2d20k1',
			'remove dart',
			'view'
		]
	},
	subcommands: [
		{ name: 'add', messageRun: 'msgAdd' },
		{ name: 'create', messageRun: 'msgAdd' },
		{ name: 'remove', messageRun: 'msgRemove' },
		{ name: 'delete', messageRun: 'msgRemove' },
		{ name: 'edit', messageRun: 'msgEdit' },
		{ name: 'update', messageRun: 'msgEdit' },
		{ name: 'show', messageRun: 'msgShow' },
		{ name: 'view', messageRun: 'msgShow' }
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

		const quickRoll = await args.pickResult('quickRoll');

		if (quickRoll.isErr()) {
			return response.edit(quickRoll.err().unwrap().message);
		}

		await this.container.db.quickRolls.findOneAndDelete(quickRoll.unwrap());

		return response.edit(`Deleted **${quickRoll.unwrap().rollName}**.`);
	}

	public async msgEdit(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const quickRoll = await args.pickResult('quickRoll');
		if (quickRoll.isErr()) {
			return response.edit(quickRoll.err().unwrap().message);
		}

		const specs = await args.restResult('rollSpec');
		if (specs.isErr()) {
			return response.edit(specs.err().unwrap().message);
		}

		await this.container.db.quickRolls.findOneAndUpdate(quickRoll.unwrap(), { $set: { specs: specs.unwrap() } });

		return response.edit(`**${quickRoll.unwrap().rollName}** has been updated.`);
	}

	public async msgShow(msg: Message) {
		const response = await sendLoadingMessage(msg);
		const quickRolls = await this.container.db.quickRolls.find({ user: msg.author.id }).toArray();

		if (quickRolls.length === 0) {
			return response.edit('You currently have no quick rolls');
		}

		const embed = new MessageEmbed()
			.setColor('RANDOM')
			.addFields(quickRolls.map(quickRoll => ({
				name: quickRoll.rollName,
				value: quickRoll.specs.map(spec => spec.map(dice => dice.input).join().slice(1)).join(' '),
				inline: true
			})));


		return response.edit({ embeds: [embed], content: null });
	}

}
