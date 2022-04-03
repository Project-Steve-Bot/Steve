import { ApplyOptions } from '@sapphire/decorators';
import { CommandSuccessPayload, Events, Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({
	event: Events.CommandSuccess
})
export class UserEvent extends Listener {

	run({ command }: CommandSuccessPayload) {
		if (command.options.preconditions?.includes('OwnerOnly')) {
			return;
		}

		const uses = this.container.cmdStats.get(command.name) ?? 0;

		this.container.cmdStats.set(command.name, uses + 1);

		this.container.statusUpdateFlag++;
	}

}
