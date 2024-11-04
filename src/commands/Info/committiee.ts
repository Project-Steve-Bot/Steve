import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { SubcommandOptions } from '@sapphire/plugin-subcommands';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, time, type Message } from 'discord.js';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { sendLoadingMessage } from '@lib/utils';

@ApplyOptions<SubcommandOptions>({
	description: 'Find out and log Committee meetups',
	preconditions: ['CommitteeOnly'],
	detailedDescription: {
		usage: 'meetup <Date in Mon-DD-YYYY> <list of attendees>\nleaderboard',
		examples: [
			'meetup Apr-28-2023 <@696783853267976202>',
			'leaderboard'
		]
	},
	subcommands: [
		{
			name: 'meetup',
			messageRun: 'newMeetup'
		},
		{
			name: 'leaderboard',
			messageRun: 'leaderboard'
		}
	]
})
export class UserCommand extends SteveSubcommand {

	public async newMeetup(msg: Message, args: Args) {
		const resp = await sendLoadingMessage(msg);
		const date = await args.pick('date');
		const confirmedMembers = [msg.author.id];
		const possibleMembers = [msg.author.id];

		possibleMembers.push(...await args.repeat('user').then(users => users.map(user => user.id)));

		await this.container.db.meetups.insertOne({
			id: resp.id,
			confirmedMembers,
			possibleMembers,
			date
		});

		resp.edit({
			content: `<@${possibleMembers.join('>, <@')}>, did you all meet up on ${time(date, 'D')}?`,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel('I was there!')
						.setCustomId(`meetup|${resp.id}`)
						.setStyle(ButtonStyle.Success)
				)
			]
		});
	}

}
