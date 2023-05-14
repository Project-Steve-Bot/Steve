import { ApplyOptions } from '@sapphire/decorators';
import { type ChatInputCommandErrorPayload, Events, Listener } from '@sapphire/framework';
import { type ChatInputSubcommandErrorPayload, SubcommandPluginEvents } from '@sapphire/plugin-subcommands';
import type { CommandInteraction } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.ChatInputCommandError,
	name: 'Slash Commands - CommandError'
})
export class SlashCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {

	public async run(error: Error, { interaction }: ChatInputCommandErrorPayload) {
		return generateErrorReply(interaction, error);
	}

}

@ApplyOptions<Listener.Options>({
	event: SubcommandPluginEvents.ChatInputSubcommandError,
	name: 'Slash Commands - SubcommandError'
})
export class SlashSubcommandErrorListener extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandError> {

	public async run(error: Error, { interaction }: ChatInputSubcommandErrorPayload) {
		return generateErrorReply(interaction, error);
	}

}

function generateErrorReply(interaction: CommandInteraction, error: Error) {
	const reply = {
		content: `An error occurred when running that command. More details are below.\n\n**${error.name}**\n${error.message}`,
		allowedMentions: { repliedUser: false }
	};

	if (interaction.deferred) {
		return interaction.editReply(reply);
	}
	return interaction.reply(reply);
}
