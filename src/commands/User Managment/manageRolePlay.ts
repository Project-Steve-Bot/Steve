import { ApplyOptions } from '@sapphire/decorators';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import type { Subcommand, SubcommandOptions } from '@sapphire/plugin-subcommands';
import { UserError, type Command } from '@sapphire/framework';
import { AutocompleteInteraction, Collection, EmbedBuilder } from 'discord.js';
import type { RPCharter } from '@lib/types/database';
import { type Filter, ObjectId, type WithId } from 'mongodb';
import axios from 'axios';

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
		});
	}

	public async chatInputCreate(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', flags: 'Ephemeral' });
		}
		await interaction.deferReply({ flags: 'Ephemeral' });
		const characters = await this.fetchUserCharacters(interaction.user.id, interaction.guildId);

		if (characters.some(character => character.prefix === interaction.options.getString('prefix'))) {
			return interaction.editReply('You already have another character using that prefix');
		}

		const rpCharacter: RPCharter = {
			user: interaction.user.id,
			guild: interaction.guildId,
			name: interaction.options.getString('name', true),
			pfp: await this.getPfpURL(interaction),
			prefix: interaction.options.getString('prefix') ?? null
		};

		await this.container.db.rpCharacters.insertOne(rpCharacter);

		return interaction.editReply({ embeds: [this.buildCharacterEmbed(rpCharacter, 'add')] });
	}

	public async chatInputEdit(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', flags: 'Ephemeral' });
		}
		await interaction.deferReply({ flags: 'Ephemeral' });
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
			return interaction.editReply('That character was not found');
		}

		const characters = await this.fetchUserCharacters(interaction.user.id, interaction.guildId);

		if (characters.some(character =>
			!character._id.equals(preChange._id)
			&& character.prefix === interaction.options.getString('prefix'))
		) {
			return interaction.editReply('You already have another character using that prefix');
		}

		const rpCharacter: RPCharter = {
			user: interaction.user.id,
			guild: interaction.guildId,
			name: interaction.options.getString('name', true),
			pfp: await this.getPfpURL(interaction),
			prefix: interaction.options.getString('prefix')
		};

		await this.container.db.rpCharacters.replaceOne(
			preChange,
			rpCharacter
		);

		return interaction.editReply({ embeds: [this.buildCharacterEmbed(rpCharacter, 'edit', preChange.name)] });
	}

	public async chatInputRemove(interaction: Subcommand.ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', flags: 'Ephemeral' });
		}
		await interaction.deferReply({ flags: 'Ephemeral' });
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

		if (!response) {
			return interaction.editReply('You have no character in this server to delete.');
		}

		return interaction.editReply({ embeds: [this.buildCharacterEmbed(response, 'delete')] });
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

	private buildCharacterEmbed({ name, pfp, prefix }: RPCharter, operation: 'add' | 'edit' | 'delete', oldName?: string): EmbedBuilder {
		const embed = new EmbedBuilder();

		switch (operation) {
			case 'add':
				embed
					.setTitle(`**${name}** created`)
					.setColor('DarkGreen');
				break;
			case 'edit':
				embed
					.setTitle(`${oldName || 'Your character'} is now **${name}**`)
					.setColor('Yellow');
				break;
			default:
				embed
					.setTitle(`**${name}** deleted`)
					.setColor('DarkRed');
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

	private async getPfpURL(interaction: Subcommand.ChatInputCommandInteraction): Promise<string | undefined> {
		const ephemeralAttachment = interaction.options.getAttachment('pfp');
		if (!ephemeralAttachment) return;

		if (!['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/apng', 'image/tiff'].includes(ephemeralAttachment.contentType ?? '')) {
			throw new UserError({
				identifier: 'InvalidFiletype',
				message: `Sorry but files of type ${ephemeralAttachment.contentType ?? 'unknown'} cannot be used as pfps.`
			});
		}

		const image = await axios.get<Buffer>(ephemeralAttachment.url, { responseType: 'arraybuffer' });

		const data = new FormData();
		data.append('image', image.data.toString('base64'));
		data.append('type', 'base64');
		data.append('title', 'Steve upload');

		const imgurResponse = await axios.post<{data: {link: string}}>('https://api.imgur.com/3/image', data, {
			headers: {
				Authorization: 'Client-ID 546c25a59c58ad7'
			}
		});

		return imgurResponse.data.data.link;
	}

}
