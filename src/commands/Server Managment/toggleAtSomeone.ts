import { ApplyOptions } from '@sapphire/decorators';
import { UserError, type CommandOptions, Command } from '@sapphire/framework';
import { PermissionFlagsBits, type Message, type ChatInputCommandInteraction } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
	description: 'Toggle allowing people to use `@someone` or `@anyone`',
	requiredUserPermissions: 'ManageRoles',
	runIn: 'GUILD_ANY',
	aliases: ['toggleatanyone', 'tas', 'taa']
})
export class ToggleAtSomeoneCommand extends SteveCommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		);
	}

	private async toggle(guildId: string): Promise<string> {
		const dbGuild = await this.container.db.guilds.findOne({ id: guildId });
		const setTo = !dbGuild?.mentionSomeone;
		await this.container.db.guilds.findOneAndUpdate(
			{ id: guildId },
			{ $set: { mentionSomeone: setTo } },
			{ upsert: true }
		);

		return `Mention \`@someone\` now ${setTo ? 'enabled' : 'disabled'}`;
	}

	public async messageRun(msg: Message) {
		if (!msg.inGuild()) {
			throw new UserError({
				identifier: 'toggleAtSomeoneMissingGuild',
				message: 'This command must be run in a server.'
			});
		}
		send(msg, await this.toggle(msg.guildId));
	}

	public async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			throw new UserError({
				identifier: 'toggleAtSomeoneMissingGuild',
				message: 'This command must be run in a server.'
			});
		}

		interaction.reply(await this.toggle(interaction.guildId));
	}

}
