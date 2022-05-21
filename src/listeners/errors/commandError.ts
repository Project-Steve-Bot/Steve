import { ApplyOptions } from '@sapphire/decorators';
import { CommandErrorPayload, Events, Listener } from '@sapphire/framework';
import { buildErrorPayload } from '@lib/utils';

@ApplyOptions<Listener.Options>({
	event: Events.CommandError,
	name: 'Error log - CommandError'
})
export class UserEvent extends Listener {

	public run(error: Error, { message: msg, command }: CommandErrorPayload) {
		if (['UserError', 'ArgumentError'].includes(error.name)) return;

		const [embed, files] = buildErrorPayload(error);
		embed.addField(`Command: ${command.name}`, `\`${msg.content}\`\n[Jump to message](${msg.url})`);

		this.container.hooks.discordLogs?.send({
			avatarURL: this.container.client.user?.displayAvatarURL(),
			username: this.container.client.user?.username,
			embeds: [embed],
			files
		});
		return;
	}

}
