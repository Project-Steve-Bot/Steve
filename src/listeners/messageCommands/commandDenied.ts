import { ApplyOptions } from '@sapphire/decorators';
import { type MessageCommandDeniedPayload, Events, Listener, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCommandDenied,
	name: 'Message Commands - CommandDenied'
})
export class UserEvent extends Listener<typeof Events.MessageCommandDenied> {

	public async run({ context, message: content }: UserError,	{ message: msg }: MessageCommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		// Use cases for this are for example permissions error when running the `eval` command.
		if (Reflect.get(Object(context), 'silent')) return;

		return send(msg, {
			content,
			allowedMentions: { users: [msg.author.id], roles: [] }
		});
	}

}
