import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Interaction, MessageEmbed } from 'discord.js';
import { envParseArray } from '@lib/env-parser';
import { stripIndents } from 'common-tags';

const OWNERS = envParseArray('OWNERS');

@ApplyOptions<Listener.Options>({
	event: 'interactionCreate'
})
export class UserEvent extends Listener {

	public async run(interaction: Interaction): Promise<unknown> {
		if (!interaction.isButton() || interaction.customId !== 'suggestion') return;
		await interaction.deferUpdate();

		if (!OWNERS.includes(interaction.user.id)) {
			return interaction.followUp({ content: 'Only bot owners can click this button.', ephemeral: true });
		}

		if (!this.container.gitHub || !process.env.REPO_OWNER || !process.env.REPO_NAME) {
			return interaction.followUp({ content: 'It looks like I dont have everything I need to connect to GitHub', ephemeral: true });
		}

		const embed = new MessageEmbed(interaction.message.embeds[0]);
		const title = (embed.description?.length ?? 0) > 100 ? `${embed.description?.slice(0, 99)}...` : embed.description ?? '';
		this.container.logger.debug(title);
		this.container.logger.debug('Length', (embed.description?.length ?? 0) > 100);
		const body = stripIndents`${embed.description?.length ?? 0 > 100 ? embed.description : ''}
		<sub>Requested by ${embed.author?.name}</sub>`;

		const issue = await this.container.gitHub.issues.create({
			owner: process.env.REPO_OWNER,
			repo: process.env.REPO_NAME,
			title,
			body
		});

		embed.addField('An issue has been created', `[View on GitHub](${issue.data.html_url})`);

		return interaction.editReply({ embeds: [embed], components: [] });
	}

}
