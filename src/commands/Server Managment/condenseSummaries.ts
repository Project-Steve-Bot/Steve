import { ApplyOptions } from '@sapphire/decorators';
import { UserError, type Command, type CommandOptions } from '@sapphire/framework';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { ChannelType } from 'discord.js';

@ApplyOptions<CommandOptions>({
	description: 'Condense a category into a summary channel',
	requiredUserPermissions: ['ManageChannels']
})
export class UserCommand extends SteveCommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addChannelOption(option =>
					option
						.setName('category')
						.setDescription('The category to condense')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildCategory)
				);
		}, { guildIds: ['989658500563095562', '723241105323327578'] });
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.guild) {
			throw new UserError({
				identifier: 'condenseSummariesMissingGuild',
				message: 'This command must be run in a server.'
			});
		}
		await interaction.deferReply({ ephemeral: true });

		const category = interaction.options.getChannel<ChannelType.GuildCategory>('category', true);

		const summaryChannelPromise = interaction.guild.channels.create({
			name: category.name,
			type: ChannelType.GuildText
		});

		const messages: string[] = [];

		for (const channel of category.children.cache.sort((a, b) => a.position - b.position).values()) {
			if (channel.type === ChannelType.GuildText) {
				messages.push(`# ${channel.name
					.replace(/[-_]/g, ' ')
					.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase())
				}`);

				await channel.messages.fetch().then(channelMessages => {
					messages.push(...channelMessages.map(message => message.content));
				});
			}
		};

		const summaryChannel = await summaryChannelPromise;

		for (const message of messages) {
			await summaryChannel.send(message);
		}

		await interaction.editReply({
			content: `Condensed ${category.name} into ${summaryChannel}`
		});
	}

}
