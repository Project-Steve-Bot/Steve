import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { buildErrorPayload } from '@lib/utils';

@ApplyOptions<Listener.Options>({
	event: Events.Error,
	name: 'Error log - Error'
})
export class UserEvent extends Listener {

	public run(error: Error) {
		const [embed, files] = buildErrorPayload(error);

		this.container.hooks.discordLogs?.send({
			avatarURL: this.container.client.user?.displayAvatarURL(),
			username: this.container.client.user?.username,
			embeds: [embed],
			files
		});
		return;
	}

}
