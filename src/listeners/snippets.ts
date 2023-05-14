import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type UnknownMessageCommandPayload } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<Listener.Options>({
	event: Events.UnknownMessageCommand
})
export class UserEvent extends Listener<typeof Events.UnknownMessageCommand> {

	public async run({ message: msg, commandName }: UnknownMessageCommandPayload) {
		if (!msg.guildId) return;

		const snip = await this.container.db.snips.findOne({ guildId: msg.guildId, snipId: commandName.toLowerCase() });

		if (!snip) return;

		return send(msg, snip.content);
	}

}
