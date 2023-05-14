import { ApplyOptions } from '@sapphire/decorators';
import { type ChatInputCommandDeniedPayload, Events, Listener, UserError } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({
	event: Events.ChatInputCommandDenied,
	name: 'Slash Commands - CommandDenied'
})
export class UserEvent extends Listener<typeof Events.ChatInputCommandDenied> {

	public async run({ context, message: content }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		// Use cases for this are for example permissions error when running the `eval` command.
		if (Reflect.get(Object(context), 'silent')) return;

		const reply = {
			content,
			allowedMentions: { users: [interaction.user.id], roles: [] },
			ephemeral: true
		};

		if (interaction.deferred) {
			return interaction.editReply(reply);
		}

		return interaction.reply(reply);
	}

}
