import { ApplyOptions } from '@sapphire/decorators';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import type { Subcommand, SubcommandOptions } from '@sapphire/plugin-subcommands';
import type { Command } from '@sapphire/framework';
import { AutocompleteInteraction, Collection, MessageEmbed } from 'discord.js';
import type { RPCharter } from '@lib/types/database';
import { Filter, ObjectId, WithId } from 'mongodb';

@ApplyOptions<SubcommandOptions>({
	name: 'character',
	description: 'Create and manage role play characters.',
	detailedDescription: {
		extendedHelp: 'This command only supports slash commands.'
	},
	preconditions: ['HasRolePlay'],
	subcommands: [
		{ name: 'create', chatInputRun: 'chatInputCreate' },
		{ name: 'edit', chatInputRun: 'chatInputEdit' },
		{ name: 'delete', chatInputRun: 'chatInputRemove' }
	]
})
export class UserCommand extends SteveSubcommand {

	private characterCache = new Collection<string, { lastCached: number, characters: WithId<RPCharter>[] }>();

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(command =>
					command
						.setName('create')
						.setDescription('Create a role play character.')
						.addStringOption(option =>
							option
								.setName('name')
								.setDescription('Your characters name.')
								.setRequired(true)
						)
						.addStringOption(option =>
							option
								.setName('prefix')
								.setDescription('The prefix you want to type when using this character.')
						)
						.addAttachmentOption(option => option.setName('pfp').setDescription('Your characters profile picture.'))
				)
				.addSubcommand(command =>
					command
						.setName('edit')
						.setDescription('Edit your role play character.')
						.addStringOption(option =>
							option
								.setName('character')
								.setDescription('The character to edit.')
								.setRequired(true)
								.setAutocomplete(true)
						)
						.addStringOption(option =>
							option
								.setName('name')
								.setDescription('Your characters new name.')
								.setRequired(true)

						)
						.addStringOption(option =>
							option
								.setName('prefix')
								.setDescription('The prefix you want to type when using this character.')
						)
						.addAttachmentOption(option => option.setName('pfp').setDescription('Your characters new profile picture.'))
				)
				.addSubcommand(command =>
					command
						.setName('delete')
						.setDescription('Delete your role play character.')
						.addStringOption(option =>
							option
								.setName('character')
								.setDescription('The character to delete.')
								.setRequired(true)
								.setAutocomplete(true)
						)
				);
		}, { idHints: this.container.idHits.get(this.name) });
	}

	public async chatInputCreate(interaction: Subcommand.ChatInputInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
		}

		const characters = await this.fetchUserCharacters(interaction.user.id, interaction.guildId);

		if (characters.some(character => character.prefix === interaction.options.getString('prefix'))) {
			return interaction.reply({ content: 'You already have another character using that prefix', ephemeral: true });
		}

		const rpCharacter: RPCharter = {
			user: interaction.user.id,
			guild: interaction.guildId,
			name: interaction.options.getString('name', true),
			pfp: interaction.options.getAttachment('pfp')?.url,
			prefix: interaction.options.getString('prefix') ?? null
		};

		await this.container.db.rpCharacters.insertOne(rpCharacter);

		return interaction.reply({ embeds: [this.buildCharacterEmbed(rpCharacter, 'add')], ephemeral: true });
	}

	public async chatInputEdit(interaction: Subcommand.ChatInputInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
		}

		let filter: Filter<RPCharter>;

		try {
			filter = { _id: new ObjectId(interaction.options.getString('character', true)) };
		} catch (_) {
			filter = {
				user: interaction.user.id,
				guild: interaction.guildId,
				name: interaction.options.getString('character', true)
			};
		}

		const preChange = await this.container.db.rpCharacters.findOne(filter);

		if (!preChange) {
			return interaction.reply({ content: 'That character was not found', ephemeral: true });
		}

		const characters = await this.fetchUserCharacters(interaction.user.id, interaction.guildId);

		if (characters.some(character =>
			!character._id.equals(preChange._id)
			&& character.prefix === interaction.options.getString('prefix'))
		) {
			return interaction.reply({ content: 'You already have another character using that prefix', ephemeral: true });
		}

		const rpCharacter: RPCharter = {
			user: interaction.user.id,
			guild: interaction.guildId,
			name: interaction.options.getString('name', true),
			pfp: interaction.options.getAttachment('pfp')?.url,
			prefix: interaction.options.getString('prefix')
		};

		await this.container.db.rpCharacters.replaceOne(
			preChange,
			rpCharacter
		);

		return interaction.reply({ embeds: [this.buildCharacterEmbed(rpCharacter, 'edit', preChange.name)], ephemeral: true });
	}

	public async chatInputRemove(interaction: Subcommand.ChatInputInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
		}

		let filter: Filter<RPCharter>;

		try {
			filter = { _id: new ObjectId(interaction.options.getString('character', true)) };
		} catch (_) {
			filter = {
				user: interaction.user.id,
				guild: interaction.guildId,
				name: interaction.options.getString('character', true)
			};
		}

		const response = await this.container.db.rpCharacters.findOneAndDelete(filter);

		if (!response.value) {
			return interaction.reply({ content: 'You have no character in this server to delete.', ephemeral: true });
		}

		return interaction.reply({ embeds: [this.buildCharacterEmbed(response.value, 'delete')], ephemeral: true });
	}

	public async autocompleteRun(interaction: AutocompleteInteraction) {
		if (!interaction.guildId) return;

		const options = await this.fetchUserCharacters(interaction.user.id, interaction.guildId);
		interaction.respond(options.map(option => ({ name: option.name, value: option._id.toHexString() })));
	}

	private async fetchUserCharacters(userId: string, guildId: string): Promise<WithId<RPCharter>[]> {
		this.characterCache.sweep(({ lastCached }) => Date.now() - lastCached > 5e3);

		const cashedOptions = this.characterCache.get(`${userId}|${guildId}`);

		if (cashedOptions) {
			return cashedOptions.characters;
		}

		const fetchedCharacters = await this.container.db.rpCharacters.find({ user: userId, guild: guildId }).toArray();
		this.characterCache.set(`${userId}|${guildId}`, { lastCached: Date.now(), characters: fetchedCharacters });

		return fetchedCharacters;
	}
	private buildCharacterEmbed({ name, pfp, prefix }: RPCharter, operation: 'add' | 'edit' | 'delete', oldName?: string): MessageEmbed {
		const embed = new MessageEmbed();

		switch (operation) {
			case 'add':
				embed
					.setTitle(`**${name}** created`)
					.setColor('DARK_GREEN');
				break;
			case 'edit':
				embed
					.setTitle(`${oldName || 'Your character'} is now **${name}**`)
					.setColor('YELLOW');
				break;
			default:
				embed
					.setTitle(`**${name}** deleted`)
					.setColor('DARK_RED');
				break;
		}

		if (pfp) {
			embed.setThumbnail(pfp);
		}

		if (prefix) {
			embed.addFields([{ name: 'Prefix', value: prefix }]);
		}

		return embed;
	}

}
