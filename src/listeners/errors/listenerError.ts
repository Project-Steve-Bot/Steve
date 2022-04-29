import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, ListenerErrorPayload } from '@sapphire/framework';
import { buildErrorPayload } from '@lib/utils';

@ApplyOptions<Listener.Options>({
	event: Events.ListenerError,
	name: 'Error log - Listener Error'
})
export class UserEvent extends Listener {

	run(error: Error, { piece }: ListenerErrorPayload) {
		const [embed, files] = buildErrorPayload(error);
		embed.addField(`Listener: ${piece.name}`, piece.event);

		this.container.hooks.discordLogs?.send({
			avatarURL: this.container.client.user?.displayAvatarURL(),
			username: this.container.client.user?.username,
			embeds: [embed],
			files
		});
		return;
	}

}
