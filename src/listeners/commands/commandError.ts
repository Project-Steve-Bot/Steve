import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, CommandErrorPayload } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';

@ApplyOptions<Listener.Options>({
	event: Events.CommandError,
	name: 'Commands - CommandError'
})
export default class UserError extends Listener<typeof Events.CommandError> {

	public async run(error: Error, { message: msg }: CommandErrorPayload) {
		return reply(msg, {
			content: `An error occurred when running that command. More details are below.\n\n**${error.name}**\n${error.message}`,
			allowedMentions: { repliedUser: false }
		});
	}

}
