import { ApplyOptions } from '@sapphire/decorators';
import { MessageCommandSuccessPayload, Events, Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({
	event: Events.MessageCommandSuccess,
	name: 'Stats - MessageCommandSuccess'
})
export class UserEvent extends Listener {

	public run({ command }: MessageCommandSuccessPayload) {
		if (command.options.preconditions?.includes('OwnerOnly')) {
			return;
		}

		const uses = this.container.cmdStats.get(command.name) ?? 0;

		this.container.cmdStats.set(command.name, uses + 1);

		this.container.statusUpdateFlag++;
		return;
	}

}
