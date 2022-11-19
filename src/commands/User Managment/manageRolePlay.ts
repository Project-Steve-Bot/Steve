import { ApplyOptions } from '@sapphire/decorators';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import type { Subcommand, SubcommandOptions } from '@sapphire/plugin-subcommands';
import type { Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import type { RPCharter } from '@lib/types/database';

@ApplyOptions<SubcommandOptions>({
	name: 'character',
	description: 'Create and manage role play characters.',
	preconditions: ['HasRolePlay'],
	subcommands: [
		{ name: 'create', chatInputRun: 'chatInputCreate' },
		{ name: 'edit', chatInputRun: 'chatInputEdit' },
		{ name: 'delete', chatInputRun: 'chatInputRemove' }
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
						.setDescription('Create a role play character.')
						.addStringOption(option =>
							option
								.setName('name')
								.setDescription('Your characters name')
								.setRequired(true)
						)
						.addAttachmentOption(option => option.setName('pfp').setDescription('Your characters profile picture'))
				)
				.addSubcommand(command =>
					command
						.setName('edit')
						.setDescription('Edit your role play character.')
						.addStringOption(option =>
							option
								.setName('name')
								.setDescription('Your characters new name')
								.setRequired(true)
						)
						.addAttachmentOption(option => option.setName('pfp').setDescription('Your characters new profile picture'))
				)
				.addSubcommand(command =>
					command
						.setName('delete')
						.setDescription('Delete your role play character.')
				);
		}, { idHints: this.container.idHits.get(this.name) });
	}

	public async chatInputCreate(interaction: Subcommand.ChatInputInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
		}

		if (await this.container.db.rpCharacters.countDocuments({ user: interaction.user.id, guild: interaction.guildId }) > 0) {
			return interaction.reply({ content: 'You already have a character in this a server.', ephemeral: true });
		}

		const rpCharacter: RPCharter = {
			user: interaction.user.id,
			guild: interaction.guildId,
			name: interaction.options.getString('name', true),
			pfp: interaction.options.getAttachment('pfp')?.url
		};

		await this.container.db.rpCharacters.insertOne(rpCharacter);

		return interaction.reply({ embeds: [this.buildCharacterEmbed(rpCharacter, 'add')], ephemeral: true });
	}

	public async chatInputEdit(interaction: Subcommand.ChatInputInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
		}

		const rpCharacter: RPCharter = {
			user: interaction.user.id,
			guild: interaction.guildId,
			name: interaction.options.getString('name', true),
			pfp: interaction.options.getAttachment('pfp')?.url
		};

		const response = await this.container.db.rpCharacters.replaceOne(
			{ user: interaction.user.id, guild: interaction.guildId },
			rpCharacter
		);

		if (response.modifiedCount === 0) {
			return interaction.reply({ content: 'You must create a character in this server before you can edit it.', ephemeral: true });
		}

		return interaction.reply({ embeds: [this.buildCharacterEmbed(rpCharacter, 'edit')], ephemeral: true });
	}

	public async chatInputRemove(interaction: Subcommand.ChatInputInteraction) {
		if (!interaction.inGuild()) {
			return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });
		}

		const response = await this.container.db.rpCharacters.findOneAndDelete(
			{ user: interaction.user.id, guild: interaction.guildId }
		);

		if (!response.value) {
			return interaction.reply({ content: 'You have no character in this server to delete.', ephemeral: true });
		}

		return interaction.reply({ embeds: [this.buildCharacterEmbed(response.value, 'delete')], ephemeral: true });
	}

	private buildCharacterEmbed({ name, pfp }: RPCharter, operation: 'add' | 'edit' | 'delete'): MessageEmbed {
		const embed = new MessageEmbed();

		switch (operation) {
			case 'add':
				embed
					.setDescription(`**${name}** created`)
					.setColor('DARK_GREEN');
				break;
			case 'edit':
				embed
					.setDescription(`Your character is now **${name}**`)
					.setColor('YELLOW');
				break;
			default:
				embed
					.setDescription(`**${name}** deleted`)
					.setColor('DARK_RED');
				break;
		}
		if (pfp) {
			embed.setThumbnail(pfp);
		}

		return embed;
	}

}
