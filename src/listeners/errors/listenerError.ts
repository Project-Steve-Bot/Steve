import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, ListenerErrorPayload } from '@sapphire/framework';
import { MessageEmbed, type MessageAttachment } from 'discord.js';
import { sendToFile } from '@lib/utils';

@ApplyOptions<Listener.Options>({
	event: Events.ListenerError,
	name: 'Error log - Listener Error'
})
export class UserEvent extends Listener {

	run(error: Error, { piece }: ListenerErrorPayload) {
		const embed = new MessageEmbed()
			.setColor('RED')
			.setTitle(error.name)
			.addField(`Listener: ${piece.name}`, piece.event)
			.setTimestamp();

		const files: MessageAttachment[] = [];

		if (error.message) {
			if (error.message.length < 1000) {
				embed.setDescription(`\`\`\`\n${error.message}\`\`\``);
			} else {
				embed.setDescription(`Full error message too big\n\`\`\`\n${error.message.slice(0, 950)}...\`\`\``);
				files.push(sendToFile(error.message, { filename: 'ErrorMessage' }));
			}
		}

		if (error.stack) {
			if (error.stack.length < 1000) {
				embed.addField('Stack Trace', `\`\`\`js\n${error.stack}\`\`\``, false);
			} else {
				embed.addField('Stack Trace', 'Full stack too big, sent to file.', false);
				files.push(sendToFile(error.stack, { filename: 'StackTrace', extension: 'js' }));
			}
		}

		this.container.hooks.discordLogs?.send({
			avatarURL: this.container.client.user?.displayAvatarURL(),
			username: this.container.client.user?.username,
			embeds: [embed],
			files
		});
		return;
	}

}
