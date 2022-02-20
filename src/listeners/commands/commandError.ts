import { Events, Listener, ListenerOptions, PieceContext, CommandErrorPayload } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';

export default class UserError extends Listener<typeof Events.CommandError> {
	public constructor(context: PieceContext, options?: ListenerOptions) {
		super(context, {
			...options,
			event: Events.CommandError
		});
	}
	public async run(error: Error, { message: msg }: CommandErrorPayload) {
		reply(msg, {
			content: `An error occurred when running that command. More details are below.\n\n**${error.name}**\n${error.message}`,
			allowedMentions: { repliedUser: false }
		});
	}
}
