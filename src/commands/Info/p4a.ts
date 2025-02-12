import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import ical from 'node-ical';
import { EmbedBuilder, Message, TimestampStyles, time as discordTime } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';
import { writeFileSync } from 'fs';

@ApplyOptions<CommandOptions>({
	description: 'See who\'s live right now on the Project for Awesome',
	preconditions: [['CommitteeOnly', 'DMOnly']]
})
export class UserCommand extends SteveCommand {

	private icalURL25 = 'https://calendar.google.com/calendar/ical/c_b4abece77b5d42e59a82e68ef19a543c873b1177d53296529eb89cee0d179b5b%40group.calendar.google.com/public/basic.ics';

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description);
		}, { guildIds: ['700378785605877820'] });
	}

	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		interaction.reply({ embeds: [await this.buildEmbed()] });
	}

	public async messageRun(msg: Message) {
		return send(msg, { embeds: [await this.buildEmbed()] });
	}

	private async buildEmbed(): Promise<EmbedBuilder> {
		const embed = new EmbedBuilder()
			.setThumbnail('https://www.projectforawesome.com/assets/2025/Social/Profile_Lilac.png')
			.setColor('#1B9C64');

		const schedule = await this.getIcalData();
		writeFileSync('schedule.json', JSON.stringify(schedule, null, '\t'));

		const now = new Date();
		const currentSlot = schedule.find(slot => slot.end > now && slot.start < now);

		if (!currentSlot) {
			return embed.setTitle('The Project for Awesome is almost here! See you soon!');
		}

		const nextSlot = schedule.find(slot => slot.end > currentSlot?.end && slot.start < currentSlot?.end);

		switch (currentSlot.tag) {
			case 'Live':
				embed.setTitle(`Live now: ${currentSlot.hosts}`)
					.setDescription(`**${currentSlot.hosts}** Will be live until ${discordTime(currentSlot.end, TimestampStyles.ShortTime)}
${nextSlot ? `Next up, its ${nextSlot.hosts}` : ''}`)
					.setURL('https://projectforawesome.com/live');
				break;
			case 'Optional':
				embed.setTitle(`${currentSlot.hosts} might be live now, but they might not`)
					.setDescription(`**${currentSlot.hosts}** Will be live until ${discordTime(currentSlot.end, TimestampStyles.ShortTime)}
${nextSlot ? `Next up, its ${nextSlot.hosts}` : ''}`)
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

	private async getIcalData(): Promise<timeslot[]> {
		const rawIcalData = await ical.fromURL(this.icalURL25);

		const events = Object.values(rawIcalData).filter(event => event.type === 'VEVENT') as ical.VEvent[];

		writeFileSync('events.json', JSON.stringify(events, null, '\t'));

		return events.map(event => {
			let tag: 'Live'|'Dark'|'Optional' = 'Live';

			if (event.summary.toLowerCase().includes('optional')) {
				tag = 'Optional';
			}

			if (event.summary.toLowerCase().includes('downtime')) {
				tag = 'Dark';
			}

			return {
				start: event.start,
				end: event.end,
				tag,
				hosts: event.summary
			};
		});
	}

}

type timeslot = {
	start: Date,
	end: Date,
	tag: 'Live'|'Dark'|'Optional'|'Unknown',
	hosts: string
};
