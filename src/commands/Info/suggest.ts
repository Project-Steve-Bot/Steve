import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';

@ApplyOptions<CommandOptions>({
	description: 'Send a suggestion to Ben.',
	aliases: ['feedback']
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message, args: Args) {
		if (!this.container.hooks.suggest) return;

		const suggestion = await args.rest('string');
		const components: ActionRowBuilder<ButtonBuilder>[] = [];

		if (this.container.gitHub) {
			components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId('suggestion')
					.setLabel('Create Issue')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('<:open:949846758509391872>')));
		}

		await this.container.hooks.suggest.send({
			username: this.container.client.user?.username,
			avatarURL: this.container.client.user?.displayAvatarURL(),
			embeds: [
				new EmbedBuilder()
					.setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() })
					.setTitle('Feedback')
					.setDescription(suggestion)
					.setTimestamp()
			],
			components
		});

		return send(msg, 'Your feedback has been sent to Ben!');
	}

	public async onLoad() {
		if (!this.container.hooks.suggest) {
			this.enabled = false;
			return;
		}
	}

}
