import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import date from 'date-and-time';
import meridiem from 'date-and-time/plugin/meridiem';
import { EmbedBuilder, Message, TimestampStyles, time as discordTime } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { p4aSchedule } from '../../assets/P4A24Schedule.json';
import { send } from '@sapphire/plugin-editable-commands';

date.plugin(meridiem);

@ApplyOptions<CommandOptions>({
	description: 'See who\'s live right now on the Project for Awesome',
	preconditions: ['CommitteeOnly']
})
export class UserCommand extends SteveCommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description);
		}, { guildIds: ['700378785605877820'] });
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		interaction.reply({ embeds: [this.buildEmbed()] });
	}

	public async messageRun(msg: Message) {
		return send(msg, { embeds: [this.buildEmbed()] });
	}

	private buildEmbed(): EmbedBuilder {
		const embed = new EmbedBuilder()
			.setThumbnail('https://projectforawesome.com/assets/2024/Social/p4a_2024_profile.png')
			.setColor('#1B9C64');

		const trueDateSchedule: timeslot[] = p4aSchedule.map(({ tag, hosts, time }) => ({
			tag: tag === 'Live' || tag === 'Dark' || tag === 'Optional' ? tag : 'Unknown',
			hosts,
			time: date.parse(time, 'M/D/YYYY h:mma Z')
		}));

		const nextSlotIdx = trueDateSchedule.findIndex(timeslot => timeslot.time.getTime() > Date.now());

		if (nextSlotIdx < 0) {
			return embed
				.setTitle('The P4A is over. See you next year');
		}

		const currentSlot = trueDateSchedule[nextSlotIdx - 1];
		const nextSlot = trueDateSchedule[nextSlotIdx];

		switch (currentSlot.tag) {
			case 'Live':
				embed.setTitle(`Live now: ${currentSlot.hosts}`)
					.setDescription(`**${currentSlot.hosts}** Will be live until ${discordTime(nextSlot.time, TimestampStyles.ShortTime)}
Next up, its ${nextSlot.hosts}`)
					.setURL('https://projectforawesome.com/live');
				break;
			case 'Optional':
				embed.setTitle(`${currentSlot.hosts} might be live now, but they might not`)
					.setDescription(`**${currentSlot.hosts}** Will be live until ${discordTime(nextSlot.time, TimestampStyles.ShortTime)}
Next up, its ${nextSlot.hosts}`)
					.setURL('https://projectforawesome.com/live'); ;
				break;
			case 'Dark':
				embed.setTitle('The Project for Awesome is taking a break.')
					.setDescription('Take this time to catch some sleep')
					.setColor('DarkButNotBlack');
				break;
			case 'Unknown':
			default:
				embed.setTitle('Something broke!')
					.setDescription('If you think this is an issue, contact Ben');
				break;
		}

		return embed;
	}

}

type timeslot = {
	time: Date,
	tag: 'Live'|'Dark'|'Optional'|'Unknown',
	hosts: string
};
