import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, UnknownCommandPayload } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<Listener.Options>({
	event: Events.UnknownCommand
})
export class UserEvent extends Listener<typeof Events.UnknownCommand> {

	public async run({ message: msg, commandName }: UnknownCommandPayload) {
		if (!msg.guildId) return;

		const snip = await this.container.client.db.snips.findOne({ guildId: msg.guildId, snipId: commandName });

		if (!snip) return;

		send(msg, snip.content);
	}

}
