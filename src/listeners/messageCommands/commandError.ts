import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type MessageCommandErrorPayload } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';
import { SubcommandPluginEvents } from '@sapphire/plugin-subcommands';
import type { Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCommandError,
	name: 'Message Commands - CommandError'
})
export class MessageCommandErrorListener extends Listener<typeof Events.MessageCommandError> {

	public async run(error: Error, { message: msg }: MessageCommandErrorPayload) {
		return generateErrorReply(msg, error);
	}

}

@ApplyOptions<Listener.Options>({
	event: SubcommandPluginEvents.MessageSubcommandError,
	name: 'Message Commands - SubcommandError'
})
export class MessageSubcommandErrorListener extends Listener<typeof Events.MessageCommandError> {

	public async run(error: Error, { message: msg }: MessageCommandErrorPayload) {
		return generateErrorReply(msg, error);
	}

}

function generateErrorReply(msg: Message, error: Error) {
	return reply(msg, {
		content: `An error occurred when running that command. More details are below.\n\n**${error.name}**\n${error.message}`,
		allowedMentions: { repliedUser: false }
	});
}
