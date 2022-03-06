import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { SteveCommand } from '../../lib/extensions/SteveCommand';
import { getChannel } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Send a suggestion to Ben.',
	aliases: ['feedback']
})
export class UserCommand extends SteveCommand {

	private suggestChannel: TextChannel | null = null;

	public async messageRun(msg: Message, args: Args) {
		if (!process.env.SUGGEST_CHANNEL) return;
		if (!this.suggestChannel) {
			this.suggestChannel = await getChannel(process.env.SUGGEST_CHANNEL) as TextChannel;
		}

		const suggestion = await args.rest('string');

		await this.suggestChannel?.send({ embeds: [
			new MessageEmbed()
				.setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
				.setTitle('Feedback')
				.setDescription(suggestion)
				.setTimestamp()
		] });

		return send(msg, 'Your feedback has been sent to Ben!');
	}

	public async onLoad() {
		if (!process.env.SUGGEST_CHANNEL) {
			this.enabled = false;
			return;
		}

		this.suggestChannel = await getChannel(process.env.SUGGEST_CHANNEL) as TextChannel;
	}

}
