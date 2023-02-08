import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { pluralize } from '@lib/utils';


@ApplyOptions<Listener.Options>({
	event: Events.ApplicationCommandRegistriesRegistered
})
export class UserEvent extends Listener {

	public async run() {
		const commands = this.container.client.stores.get('commands');
		const hints = new Map<string, string[]>();

		commands.forEach(command => {
			if (command.supportsChatInputCommands() || command.supportsContextMenuCommands()) {
				const { chatInputCommands, contextMenuCommands } = command.applicationCommandRegistry;
				const ids = [...chatInputCommands].concat([...contextMenuCommands]);
				hints.set(command.name, ids);
			}
		});

		this.container.logger.info(`Updating ${hints.size} ID ${pluralize('hint', hints.size)}`);
		hints.forEach((ids, command) => {
			this.container.db.idHints.findOneAndUpdate(
				{ command },
				{ $set: { ids } },
				{ upsert: true }
			);
		});
	}

}
