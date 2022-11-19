import { ApplyOptions } from '@sapphire/decorators';
import { MessageCommandErrorPayload, Events, Listener, ChatInputCommandErrorPayload } from '@sapphire/framework';
import { buildErrorPayload } from '@lib/utils';
import { ChatInputSubcommandErrorPayload, SubcommandPluginEvents } from '@sapphire/plugin-subcommands';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCommandError,
	name: 'Error log - MessageCommandError'
})
export class MessageCommandErrorLogger extends Listener {

	public run(error: Error, { message: msg, command }: MessageCommandErrorPayload) {
		if (['UserError', 'ArgumentError'].includes(error.name)) return;

		const [embed, files] = buildErrorPayload(error);
		embed.addFields([{ name: `Command: ${command.name}`, value: `\`${msg.content}\`\n[Jump to message](${msg.url})` }]);

		this.container.hooks.discordLogs?.send({
			avatarURL: this.container.client.user?.displayAvatarURL(),
			username: this.container.client.user?.username,
			embeds: [embed],
			files
		});
		return;
	}

}

@ApplyOptions<Listener.Options>({
	event: Events.ChatInputCommandError,
	name: 'Error log - SlashCommandError'
})
export class SlashCommandErrorLogger extends Listener {

	public run(error: Error, { interaction, command }: ChatInputCommandErrorPayload) {
		if (['UserError', 'ArgumentError'].includes(error.name)) return;

		const inputs: string[] = [];

		interaction.options.data.forEach(option => {
			inputs.push(`**${option.name}**: ${option.value}`);
		});

		const [embed, files] = buildErrorPayload(error);
		embed.addFields([{ name: `Command: /${command.name}`, value: `${inputs.length > 0 ? inputs.join('/n') : 'No arguments given'}` }]);

		this.container.hooks.discordLogs?.send({
			avatarURL: this.container.client.user?.displayAvatarURL(),
			username: this.container.client.user?.username,
			embeds: [embed],
			files
		});
		return;
	}

}

@ApplyOptions<Listener.Options>({
	event: SubcommandPluginEvents.ChatInputSubcommandError,
	name: 'Error log - SlashSubcommandError'
})
export class SlashSubcommandErrorLogger extends Listener {

	public run(error: Error, { interaction, command }: ChatInputSubcommandErrorPayload) {
		if (['UserError', 'ArgumentError'].includes(error.name)) return;

		const inputs: string[] = [];

		interaction.options.data.forEach(option => {
			inputs.push(`**${option.name}**: ${option.value}`);
			if (option.options) {
				option.options.forEach(subOption => {
					inputs.push(`└ **${subOption.name}**: ${subOption.value}`);
				});
			}
		});

		const [embed, files] = buildErrorPayload(error);
		embed.addFields([{ name: `Command: /${command.name}`, value: `${inputs.length > 0 ? inputs.join('\n') : 'No arguments given'}` }]);

		this.container.hooks.discordLogs?.send({
			avatarURL: this.container.client.user?.displayAvatarURL(),
			username: this.container.client.user?.username,
			embeds: [embed],
			files
		});
		return;
	}

}
