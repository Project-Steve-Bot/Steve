import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, MessageCommandErrorPayload } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCommandError,
	name: 'Message Commands - CommandError'
})
export default class UserError extends Listener<typeof Events.MessageCommandError> {

	public async run(error: Error, { message: msg }: MessageCommandErrorPayload) {
		return reply(msg, {
			content: `An error occurred when running that command. More details are below.\n\n**${error.name}**\n${error.message}`,
			allowedMentions: { repliedUser: false }
		});
	}

}
