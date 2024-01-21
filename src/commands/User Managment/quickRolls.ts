import { ApplyOptions } from '@sapphire/decorators';
import { Args, ArgumentError, Command, Result, UserError } from '@sapphire/framework';
import type { SubcommandOptions } from '@sapphire/plugin-subcommands';
import { Message, EmbedBuilder, User, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { sendLoadingMessage } from '@lib/utils';
import type { RollSpec } from '@lib/types/rollSpec';
import { resolveQuickRoll, resolveRollImportCharacter, resolveRollSpec } from '@lib/resolvers';
import type { ObjectId, WithId } from 'mongodb';
import type { QuickRoll, RollImportCharacter, RollType } from '@lib/types/database';
import type { ResolverError } from '@lib/types/resolverError';
import axios from 'axios';
import type { AttackRoll, Roll, RollImport } from '@lib/types/rollImport';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { chunk } from '@sapphire/utilities';

type WrapResult<T> = Result<T, UserError | ArgumentError | ResolverError>;
type MessageParts = {embeds: [EmbedBuilder], components: [ActionRowBuilder<ButtonBuilder>]};

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
										.setName('character')
										.setDescription('The character sheet to delete.')
										.setRequired(true)
										.setAutocomplete(true)
								)
						)
				);
		});
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

	private async view(user: User): Promise<PaginatedMessage> {
		const quickRolls = await this.container.db.quickRolls.find({ user: user.id, active: true }).toArray();

		const paginator = new PaginatedMessage({
			template: {
				content: ' ',
				embeds: [
					new EmbedBuilder()
						.setTitle('Your Quick Rolls')
						.setColor('Random')
				]
			}
		});

		if (quickRolls.length === 0) {
			return paginator.addPageEmbed(embed =>
				embed.setDescription('You currently have no quick rolls')
			);
		}

		paginator.setActions(PaginatedMessage.defaultActions.filter(action => 'customId' in action
			&& [
				'@sapphire/paginated-messages.previousPage',
				'@sapphire/paginated-messages.nextPage',
				'@sapphire/paginated-messages.stop'
			].includes(action.customId))
		);

		const pages = chunk(quickRolls, 25);

		pages.forEach(page => {
			paginator.addPageEmbed(embed =>
				embed
					.addFields(page.map(roll => ({
						name: roll.rollName,
						value: roll.specs.map(spec => spec.map(dice => dice.input).join().slice(1)).join(' '),
						inline: true
					})))
			);
		});

		return paginator;
	}

	public async msgView(msg: Message) {
		const response = await sendLoadingMessage(msg);
		const paginator = await this.view(msg.author);
		return paginator.run(response, msg.author);
	}

	public async chatInputView(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const paginator = await this.view(interaction.user);
		return paginator.run(interaction, interaction.user);
	}

	private formatErrorMessage(identifier: string, message: string): string {
		return `**${identifier}**\n${message}`;
	}

	private async importRolls(user: User, url: string): Promise<MessageParts> {
		const characterId = url.split('/').pop()?.split('.')[0];
		if (!characterId) {
			throw new UserError({
				identifier: 'InvalidURL',
				message: 'Invalid URL provided.'
			});
		}

		if (await this.container.db.rollImportCharacters.countDocuments({ url }) > 0) {
			throw new UserError({
				identifier: 'DuplicateBeyondCharacter',
				message: 'You cannot import rolls for the same character multiple times. Update the rolls instead.'
			});
		}

		const { data: ddbData } = await axios.get<RollImport>(`http://localhost:8080/rolls?characterId=${characterId}`);
		const embed = new EmbedBuilder().setTitle(`Found rolls for ${ddbData.characterName}`);

		const { insertedId } = await this.container.db.rollImportCharacters.insertOne({
			url,
			user: user.id,
			name: ddbData.characterName
		});

		const { display: attackDisplay, quickRolls: attackRolls } = this.parseRolls(user, ddbData.attacks, 'attack', insertedId, ddbData.characterName);
		embed.addFields([
			{ name: 'Attack Rolls', value: attackDisplay, inline: true }
		]);

		const { display: attributeDisplay, quickRolls: attributeRolls } = this.parseRolls(user, ddbData.attributes, 'attribute', insertedId, ddbData.characterName);
		embed.addFields([
			{ name: 'Attribute Rolls', value: attributeDisplay, inline: true }
		]);

		const { display: saveDisplay, quickRolls: saveRolls } = this.parseRolls(user, ddbData.saves, 'save', insertedId, ddbData.characterName);
		embed.addFields([
			{ name: 'Saving throws', value: saveDisplay, inline: true }
		]);

		const { display: abilityDisplay, quickRolls: abilityRolls } = this.parseRolls(user, ddbData.abilityChecks, 'ability', insertedId, ddbData.characterName);
		embed.addFields([
			{ name: 'Ability Check Rolls', value: abilityDisplay, inline: true }
		]);

		await this.container.db.quickRolls.insertMany([
			...attackRolls,
			...abilityRolls,
			...attributeRolls,
			...saveRolls
		]);

		return { embeds: [embed], components: [this.makeImportButtons(user, insertedId)] };
	}

	private parseRolls(user: User, rawRolls: AttackRoll[] | Roll[], type: RollType, characterId: ObjectId, characterName: string): { display: string, quickRolls: QuickRoll[] } {
		const quickRolls: QuickRoll[] = [];
		let display = '';

		rawRolls.forEach(rawRoll => {
			const rollString = `1d20${rawRoll.roll > 0 ? '+' : ''}${rawRoll.roll === 0 ? '' : rawRoll.roll} ${'damage' in rawRoll ? rawRoll.damage : ''}`.trim();

			const specs = resolveRollSpec(rollString);

			display += `**${rawRoll.name}** ${rollString}\n`;

			quickRolls.push({
				rollName: `${characterName}: ${rawRoll.name}`.toLowerCase(),
				user: user.id,
				specs: specs.unwrap(),
				active: false,
				importInfo: { type, character: characterId.toHexString() }
			});
		});

		display = display.trim();
		return { display, quickRolls };
	}


	private makeImportButtons(user: User, character: ObjectId, type: 'Import' | 'Update' = 'Import'): ActionRowBuilder<ButtonBuilder> {
		const idString = `RollImport|${user.id}|${character.toHexString()}`;
		return new ActionRowBuilder<ButtonBuilder>().addComponents([
			new ButtonBuilder()
				.setCustomId(`${idString}|all`)
				.setLabel(`${type} All Rolls`)
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(`${idString}|attack`)
				.setLabel(`${type} Attack Rolls`)
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(`${idString}|attribute`)
				.setLabel(`${type} Attribute Rolls`)
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(`${idString}|save`)
				.setLabel(`${type} Saving Throws`)
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(`${idString}|ability`)
				.setLabel(`${type} Ability Check Rolls`)
				.setStyle(ButtonStyle.Primary)
		]);
	}

	public async chatInputImportNew(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const out = await this.importRolls(interaction.user, interaction.options.getString('url', true));
		return interaction.editReply(out);
	}

	public async msgImportNew(msg: Message, args: Args) {
		const response = await sendLoadingMessage(msg);
		const url = await args.pick('string');
		const out = await this.importRolls(msg.author, url);
		return response.edit({ ...out, content: ' ' });
	}

	private async deleteCharacter(character: WrapResult<WithId<RollImportCharacter>>): Promise<string> {
		if (character.isErr()) {
			const { identifier, message } = character.err().unwrap();
			return this.formatErrorMessage(identifier, message);
		}
		await this.container.db.quickRolls.deleteMany({ 'importInfo.character': character.unwrap()._id.toHexString() });
		await this.container.db.rollImportCharacters.findOneAndDelete(character.unwrap());

		return `${character.unwrap().name}'s quick rolls have been deleted.`;
	}

	public async chatInputImportDelete(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const character = await resolveRollImportCharacter(interaction.options.getString('character', true), interaction.user);

		const out = await this.deleteCharacter(character);

		return interaction.editReply(out);
	}

	private async updateCharacter(character: WrapResult<WithId<RollImportCharacter>>, user: User): Promise<MessageParts|string> {
		if (character.isErr()) {
			const { identifier, message } = character.err().unwrap();
			return this.formatErrorMessage(identifier, message);
		}
		await this.deleteCharacter(character);
		return this.importRolls(user, character.unwrap().url);
	}

	public async chatInputImportUpdate(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const character = await resolveRollImportCharacter(interaction.options.getString('character', true), interaction.user);

		const out = await this.updateCharacter(character, interaction.user);

		return interaction.editReply(out);
	}

}
