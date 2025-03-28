import { ApplyOptions } from '@sapphire/decorators';
import type { Command } from '@sapphire/framework';
import { SubcommandOptions } from '@sapphire/plugin-subcommands';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { DateTime, IANAZone } from 'luxon';
import { oneLine } from 'common-tags';

@ApplyOptions<SubcommandOptions>({
	description: 'Manage your reminder settings',
	subcommands: [
		{
			name: 'format',
			type: 'group',
			entries: [
				{ name: 'create', chatInputRun: 'createFormat' },
				{ name: 'view', chatInputRun: 'viewFormats' },
				{ name: 'delete', chatInputRun: 'deleteFormat' }
			]
		},
		{ name: 'settimezone', chatInputRun: 'setTimeZone' }
	]
})
export class RemindSettingsCommand extends SteveSubcommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(commandBuilder => {
			commandBuilder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommandGroup(groupBuilder =>
					groupBuilder
						.setName('format')
						.setDescription('Manage your datetime input formats')
						.addSubcommand(subcommandBuilder =>
							subcommandBuilder
								.setName('create')
								.setDescription('Create a new datetime format')
								.addStringOption(option =>
									option
										.setName('format')
										.setDescription('The format to add')
										.setRequired(true)
								)
						)
						.addSubcommand(subcommandBuilder =>
							subcommandBuilder
								.setName('view')
								.setDescription('View your current datetime formats')
						)
						.addSubcommand(subcommandBuilder =>
							subcommandBuilder
								.setName('delete')
								.setDescription('Deletes a datetime format')
								.addStringOption(option =>
									option
										.setName('format')
										.setDescription('The format to delete')
										.setRequired(true)
										.setAutocomplete(true)
								)
						)
				)
				.addSubcommand(subcommandBuilder =>
					subcommandBuilder
						.setName('settimezone')
						.setDescription('Set your timezone')
						.addStringOption(option =>
							option
								.setName('timezone')
								.setDescription('Your current timezone')
								.setRequired(true)
						)
				);
		});
	}

	public async createFormat(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: 'Ephemeral' });
		const format = interaction.options.getString('format', true);

		await this.container.db.users.findOneAndUpdate(
			{ id: interaction.user.id },
			{ $push: { dateTimeFormats: format } },
			{ upsert: true }
		);

		return await interaction.editReply(`\`${format}\` has been added to your formats. That looks like ${DateTime.now().toFormat(format)}`);
	}

	public async viewFormats(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: 'Ephemeral' });

		const dbUser = await this.container.db.users.findOne({ id: interaction.user.id });
		const now = DateTime.now();

		const formats = dbUser?.dateTimeFormats?.map(format => `${format} | ${now.toFormat(format)}`) ?? [];

		return await interaction.editReply(formats.length === 0 ? 'You don\'t have any datetime formats yet!' : formats.join('\n'));
	}

	public async deleteFormat(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: 'Ephemeral' });
		const format = interaction.options.getString('format', true);

		await this.container.db.users.findOneAndUpdate(
			{ id: interaction.user.id },
			{ $pull: { dateTimeFormats: format } },
			{ upsert: true }
		);

		return await interaction.editReply(`\`${format}\` has been removed to your formats.`);
	}

	public async setTimeZone(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: 'Ephemeral' });
		const input = interaction.options.getString('timezone', true);
		const zone = IANAZone.create(input);

		if (!zone.isValid) {
			return await interaction.editReply(oneLine`\`${input}\` does not seem to be a valid timezone.
				You can find the full list of timezones [here](<https://en.wikipedia.org/wiki/List_of_tz_database_time_zones>)`);
		}

		await this.container.db.users.findOneAndUpdate({ id: interaction.user.id }, { $set: { timezone: zone.name } }, { upsert: true });

		return interaction.editReply(`Your timezone has been set to ${zone.name}`);
	}

	public async autocompleteRun(interaction: AutocompleteInteraction) {
		const dbUser = await this.container.db.users.findOne({ id: interaction.user.id });
		const now = DateTime.now();

		const formats = dbUser?.dateTimeFormats?.map(format => ({ name: `${format} | ${now.toFormat(format)}`, value: format }));

		return interaction.respond(formats ?? []);
	}

}
