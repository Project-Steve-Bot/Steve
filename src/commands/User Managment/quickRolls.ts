import { ApplyOptions } from '@sapphire/decorators';
import type { Args, ArgumentError, Command, Result, UserError } from '@sapphire/framework';
import type { SubcommandOptions } from '@sapphire/plugin-subcommands';
import { Message, EmbedBuilder, User, ChatInputCommandInteraction } from 'discord.js';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { sendLoadingMessage } from '@lib/utils';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveQuickRoll, resolveRollSpec } from '@lib/resolvers';
import type { WithId } from 'mongodb';
import type { QuickRoll } from '@lib/types/database';
import type { ResolverError } from '@lib/types/resolverError';
import axios from 'axios';

type WrapResult<T> = Result<T, UserError | ArgumentError | ResolverError>;

@ApplyOptions<SubcommandOptions>({
	description: 'Add, remove or edit quick rolls.',
	aliases: ['quickroll', 'manageroll', 'managerolls', 'mqr'],
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
		{ name: 'create', messageRun: 'msgCreate', chatInputRun: 'chatInputCreate' },
		{ name: 'delete', messageRun: 'msgDelete', chatInputRun: 'chatInputDelete' },
		{ name: 'edit', messageRun: 'msgEdit', chatInputRun: 'chatInputEdit' },
		{ name: 'view', messageRun: 'msgView', chatInputRun: 'chatInputView' },
		{ name: 'add', messageRun: 'msgCreate' },
		{ name: 'remove', messageRun: 'msgDelete' },
		{ name: 'update', messageRun: 'msgEdit' },
		{ name: 'show', messageRun: 'msgView' },
		{ name: 'import', type: 'group', entries: [
			{ name: 'new', chatInputRun: 'chatInputImportNew' },
			{ name: 'update', chatInputRun: 'chatInputImportUpdate' },
			{ name: 'delete', chatInputRun: 'chatInputImportDelete' }
		] }
	]
})
export class UserCommand extends SteveSubcommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(command =>
					command
						.setName('create')
						.setDescription('Create a quick roll.')
						.addStringOption(option =>
							option
								.setName('name')
								.setDescription('Your the quick rolls name')
								.setRequired(true)
						)
						.addStringOption(option =>
							option
								.setName('spec')
								.setDescription('The rolls spec.')
								.setRequired(true)
						)
				)
				.addSubcommand(command =>
					command
						.setName('edit')
						.setDescription('Edit a quick roll.')
						.addStringOption(option =>
							option
								.setName('roll')
								.setDescription('The roll to edit.')
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addStringOption(option =>
							option
								.setName('spec')
								.setDescription('The rolls new spec.')
								.setRequired(true)

						)
				)
				.addSubcommand(command =>
					command
						.setName('delete')
						.setDescription('Delete a quick roll.')
						.addStringOption(option =>
							option
								.setName('roll')
								.setDescription('The quick roll to delete.')
								.setRequired(true)
								.setAutocomplete(true)
						)
				)
				.addSubcommand(command =>
					command
						.setName('view')
						.setDescription('View all your quick rolls.')
				)
				.addSubcommandGroup(group =>
					group
						.setName('import')
						.setDescription('Manage imported quick rolls.')
						.addSubcommand(command =>
							command
								.setName('new')
								.setDescription('Import quick rolls from a new character sheet.')
								.addStringOption(option =>
									option
										.setName('url')
										.setDescription('The D&D Beyond PDF url of your character sheet.')
										.setRequired(true)
								)
						)
						.addSubcommand(command =>
							command
								.setName('update')
								.setDescription('Update an existing character sheet\'s quick rolls.')
								.addStringOption(option =>
									option
										.setName('character')
										.setDescription('The character sheet to update.')
										.setRequired(true)
										.setAutocomplete(true)
								)
						)
						.addSubcommand(command =>
							command
								.setName('delete')
								.setDescription('Delete a character sheet\'s quick rolls.')
								.addStringOption(option =>
									option
										.setName('url')
										.setDescription('The D&D Beyond PDF url of your character sheet.')
										.setRequired(true)
								)
						)
				);
		}, { idHints: this.container.idHits.get(this.name) });
	}

	private async create(user: User, rollName: string, specs: WrapResult<RollSpec[][]>): Promise<string> {
		if (specs.isErr()) {
			const { identifier, message } = specs.err().unwrap();
			return this.formatErrorMessage(identifier, message);
		}

		await this.container.db.quickRolls.insertOne({
			user: user.id,
			rollName,
			specs: specs.unwrap(),
			active: true
		});

		return `Created new quick roll **${rollName}**`;
	}

	public async msgCreate(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const rollName = (await args.pick('string')).toLocaleLowerCase();
		const specs = await args.restResult('rollSpec');

		const out = await this.create(msg.author, rollName, specs);

		return response.edit(out);
	}

	public async chatInputCreate(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();

		const rollName = interaction.options.getString('name', true);
		const rawSpec = interaction.options.getString('spec', true);
		const specs = resolveRollSpec(rawSpec);

		const out = await this.create(interaction.user, rollName, specs);

		return interaction.editReply(out);
	}

	private async delete(roll: WrapResult<WithId<QuickRoll>>): Promise<string> {
		if (roll.isErr()) {
			const { identifier, message } = roll.err().unwrap();
			return this.formatErrorMessage(identifier, message);
		}


		await this.container.db.quickRolls.findOneAndDelete(roll.unwrap());
		return `Deleted **${roll.unwrap().rollName}**.`;
	}

	public async msgDelete(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const quickRoll = await args.pickResult('quickRoll');

		const out = await this.delete(quickRoll);
		return response.edit(out);
	}

	public async chatInputDelete(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();

		const rawRoll = interaction.options.getString('roll', true);
		const roll = await resolveQuickRoll(rawRoll, interaction.user);

		const out = await this.delete(roll);
		return interaction.editReply(out);
	}

	private async edit(roll: WrapResult<WithId<QuickRoll>>, newSpecs: WrapResult<RollSpec[][]>): Promise<string> {
		if (roll.isErr()) {
			const { identifier, message } = roll.err().unwrap();
			return this.formatErrorMessage(identifier, message);
		}

		if (newSpecs.isErr()) {
			const { identifier, message } = newSpecs.err().unwrap();
			return this.formatErrorMessage(identifier, message);
		}

		await this.container.db.quickRolls.findOneAndUpdate(roll.unwrap(), { $set: { specs: newSpecs.unwrap() } });
		return `**${roll.unwrap().rollName}** has been updated.`;
	}

	public async msgEdit(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);

		const quickRoll = await args.pickResult('quickRoll');
		const specs = await args.restResult('rollSpec');

		const out = await this.edit(quickRoll, specs);

		return response.edit(out);
	}

	public async chatInputEdit(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();

		const rawRoll = interaction.options.getString('roll', true);
		const roll = await resolveQuickRoll(rawRoll, interaction.user);

		const rawSpec = interaction.options.getString('spec', true);
		const specs = resolveRollSpec(rawSpec);

		const out = await this.edit(roll, specs);
		return interaction.editReply(out);
	}

	private async view(user: User): Promise<EmbedBuilder> {
		const quickRolls = await this.container.db.quickRolls.find({ user: user.id }).toArray();
		const embed = new EmbedBuilder().setColor('Random');
		if (quickRolls.length === 0) {
			return embed.setDescription('You currently have no quick rolls');
		}

		return embed
			.addFields(quickRolls.map(quickRoll => ({
				name: quickRoll.rollName,
				value: quickRoll.specs.map(spec => spec.map(dice => dice.input).join().slice(1)).join(' '),
				inline: true
			})));
	}

	public async msgView(msg: Message) {
		const response = await sendLoadingMessage(msg);
		const out = await this.view(msg.author);
		return response.edit({ embeds: [out], content: null });
	}

	public async chatInputView(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const out = await this.view(interaction.user);
		return interaction.editReply({ embeds: [out] });
	}

	private formatErrorMessage(identifier: string, message: string): string {
		return `**${identifier}**\n${message}`;
	}

	private async importRolls(_user: User, url: string) {
		const pdf = await axios.get(url);
		console.log(pdf.data);
	}

	public async chatInputImportNew(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		await this.importRolls(interaction.user, 'http://localhost:8080/rolls?characterId=segalb855_97199668');
		return interaction.editReply('Logged');
	}

}
