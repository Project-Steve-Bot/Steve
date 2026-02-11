import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import ical from 'node-ical';
import { EmbedBuilder, Message, TimestampStyles, time as discordTime } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { send } from '@sapphire/plugin-editable-commands';
import axios from 'axios';

@ApplyOptions<CommandOptions>({
	description: 'See who\'s live right now on the Project for Awesome',
	preconditions: [['CommitteeOnly', 'DMOnly']]
})
export class UserCommand extends SteveCommand {

	private icalURL26 = 'https://calendar.google.com/calendar/ical/c_5d6b041dcd674b0c1348d0c1dda354027dbb9b361e57fae4f7f16e5256ba1735%40group.calendar.google.com/public/basic.ics';
	private apiBaseURL = 'https://api.projectforawesome.com/api';

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
			.setThumbnail('https://p4a-assets.sfo3.cdn.digitaloceanspaces.com/dev/P4_A_Logo_Characters_04dd9f5f9d.png')
			.setColor('#363a94');

		const statsPromise = this.getStats();
		const schedule = await this.getIcalData();

		const now = new Date();
		const currentSlot = schedule.find(slot => slot.end > now && slot.start < now);

		if (!currentSlot) {
			const earliest = schedule.map(slot => slot.start).reduce((a, b) => a < b ? a : b, schedule[0].start);
			if (now < earliest) {
				return embed.setTitle(`The project for awesome starts ${discordTime(earliest, TimestampStyles.RelativeTime)}`);
			}
			return embed.setTitle('The Project for Awesome is over. See you next year!');
		}

		const nextSlotTime = new Date(currentSlot.end);
		nextSlotTime.setMinutes(currentSlot.end.getMinutes() + 1);
		const nextSlot = schedule.find(slot => slot.end > nextSlotTime && slot.start < nextSlotTime);

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

		const stats = await statsPromise.catch(() => null);

		if (stats) {
			embed.addFields([
				{ name: 'Total Raised', value: stats.total, inline: true },
				{ name: 'Total Videos Submitted', value: stats.submissions, inline: true }
			]);
			if (stats.featured) {
				embed.addFields({
					name: 'Featured Video',
					value: `[${stats.featured.title}](${stats.featured.link})`,
					inline: false
				});
			}
		}

		return embed;
	}

	private async getIcalData(): Promise<Timeslot[]> {
		const rawIcalData = await ical.fromURL(this.icalURL26);

		const events = Object.values(rawIcalData).filter(event => event.type === 'VEVENT') as ical.VEvent[];

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

	private async getStats(): Promise<Stats> {
		const summaryResponse = await axios.get<Summary>(`${this.apiBaseURL}/raised-funds/v1/summary`);

		const params = {
			'filters[Phase][$eq]': 'Approved',
			'pagination[page]': '1',
			'pagination[pageSize]': '1',
			'fields[0]': 'Title',
			'fields[1]': 'Slug',
			'fields[2]': 'externalThumbnailUrl',
			'fields[3]': 'Phase',
			'fields[4]': 'featuredAt',
			'fields[5]': 'publishedAt',
			'fields[6]': 'isFeatured',
			'fields[7]': 'isUpdated',
			'fields[8]': 'oembed',
			'populate[charity]': 'true',
			'populate[thumbnail]': 'true',
			'sort[0]': 'featuredAt:desc',
			'sort[1]': 'isUpdated:desc'
		};
		const submissionResponse = await axios.get<Submissions>(`${this.apiBaseURL}/submissions`, { params });
		const featuredResponse = await axios.get<Submissions>(`${this.apiBaseURL}/submissions`, { params: {
			...params,
			'filters[isFeatured][$eq]': 'true'
		} });

		const usDollar = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		});

		const rawFeatured = featuredResponse.data.data.pop();
		const featured = rawFeatured
			? {
				title: rawFeatured.Title,
				thumbnail: rawFeatured.externalThumbnailUrl,
				link: `https://projectforawesome.com/videos/${rawFeatured.Slug}`
			}
			: null;
		return {
			total: usDollar.format(summaryResponse.data.totals.grandTotal),
			submissions: `${submissionResponse.data.meta.pagination.total}`,
			featured
		};
	}

}

type Timeslot = {
	start: Date,
	end: Date,
	tag: 'Live'|'Dark'|'Optional'|'Unknown',
	hosts: string
};

type Stats = {
	total: string,
	submissions: string,
	featured: {
		title: string,
		thumbnail: string,
		link: string
	} | null
};

type Summary = {
	tiltify: {
		amountRaised: number
		currency: string
	}
	bankAmount: number
	funds: {
		key: string
		label: string
		type: string
		baseAmount: number
		matchAmount: number
		displayAmount: number
		bucketTotal: number
		cap?: number
		remainingCap?: number
		percentToCap?: number
		currency: string
		secondaryBase?: number
		pmi1Amount?: number
	}[],
	totals: {
		matchRate: number
		totalPrimaryMatching: number
		totalSecondaryMatching: number
		totalMatching: number
		secondaryBase: number
		pmi1Amount: number
		grandTotal: number
	}
	settings: {
		subhead: string
		headline: string
		tickerIntervalMs: number
		directDonationLabel: string
		gridBorderColor: string
		gridHeader: string
	}
	debugMode: boolean
	fetchedAt: string
}

type Submissions = {
	data: {
		id: number
		documentId: string
		Title: string
		Slug: string
		Phase: string
		featuredAt: string | null
		externalThumbnailUrl: string
		publishedAt: string
		isFeatured: boolean
		isUpdated: string
		oembed: {
			oembed: {
				title: string
				thumbnail_url: string
				html: string
			}
		}
		charity: {
			id: number
			documentId: string
			Title: string
			URL: null
		}
		categories: {
			id: number
			documentId: string
			name: string
			slug: string
		}[]
		thumbnail: null
	}[]
	meta: {
		pagination: {
			page: number
			pageSize: number
			pageCount: number
			total: number
		}
	}
}

