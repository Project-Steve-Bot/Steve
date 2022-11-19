import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, ChatInputCommandSuccessPayload } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({
	event: Events.ChatInputCommandSuccess,
	name: 'Stats - SlashCommandSuccess'
})
export class UserEvent extends Listener {

	public run({ command }: ChatInputCommandSuccessPayload) {
		if (command.options.preconditions?.includes('OwnerOnly')) {
			return;
		}

		const uses = this.container.cmdStats.get(command.name) ?? 0;

		this.container.cmdStats.set(command.name, uses + 1);

		this.container.statusUpdateFlag++;
		return;
	}

}
