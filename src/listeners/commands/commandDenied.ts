import { ApplyOptions } from '@sapphire/decorators';
import { CommandDeniedPayload, Events, Listener, UserError } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<Listener.Options>({
	event: Events.CommandDenied,
	name: 'Commands - CommandDenied'
})
export class UserEvent extends Listener<typeof Events.CommandDenied> {

	public async run({ context, message: content }: UserError,	{ message: msg }: CommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		// Use cases for this are for example permissions error when running the `eval` command.
		if (Reflect.get(Object(context), 'silent')) return;

		return send(msg, {
			content,
			allowedMentions: { users: [msg.author.id], roles: [] }
		});
	}

}
