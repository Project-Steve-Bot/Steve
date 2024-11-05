import { ApplyOptions } from '@sapphire/decorators';
import { UserError, type Args, type Command } from '@sapphire/framework';
import { SubcommandOptions } from '@sapphire/plugin-subcommands';
import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle, EmbedBuilder, Guild, time, User, type Message } from 'discord.js';
import { SteveSubcommand } from '@lib/extensions/SteveSubcommand';
import { sendLoadingMessage } from '@lib/utils';
import { createCanvas, loadImage } from 'canvas';
import { readFileSync } from 'fs';

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
			messageRun: 'messageNewMeetup',
			chatInputRun: 'chatInputNewMeetup'
		},
		{
			name: 'leaderboard',
			messageRun: 'messageLeaderboard',
			chatInputRun: 'chatInputLeaderboard'
		}
	]
})
export class UserCommand extends SteveSubcommand {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => {
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand(subcommand => {
					subcommand
						.setName('meetup')
						.setDescription('Create a new meetup')
						.addStringOption(option => option
							.setName('date')
							.setDescription('The date of the meetup (Mon-DD-YYYY)')
							.setRequired(true)
						);

					for (let i = 1; i <= 10; i++) {
						subcommand.addUserOption(option => option.setName(`attendee${i}`).setDescription(`Attendee ${i}`).setRequired(i === 1));
					}
					return subcommand;
				})
				.addSubcommand(subcommand => subcommand
					.setName('leaderboard')
					.setDescription('See the current leaderboard')
				);
		}, { guildIds: ['700378785605877820'] });
	}

	private async newMeetup(id: string, date: Date, author: User, attendees: User[]): Promise<BaseMessageOptions> {
		const confirmedMembers = [author.id];
		const nonUniquePossibleMembers = [author.id, ...attendees.map(user => user.id)];
		const possibleMembers = [...new Set(nonUniquePossibleMembers)];

		await this.container.db.meetups.insertOne({
			id,
			confirmedMembers,
			possibleMembers,
			date
		});

		return {
			content: `<@${possibleMembers.join('>, <@')}>, did you all meet up on ${time(date, 'D')}?`,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel('I was there!')
						.setCustomId(`meetup|${id}`)
						.setStyle(ButtonStyle.Success)
				)
			]
		};
	}

	public async messageNewMeetup(msg: Message, args: Args) {
		const resp = await sendLoadingMessage(msg);
		const date = await args.pick('date');
		const attendees = [...await args.repeat('user')];
		resp.edit(await this.newMeetup(resp.id, date, msg.author, attendees));
	}

	public async chatInputNewMeetup(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const date = new Date(interaction.options.getString('date', true));
		const attendees: User[] = [];

		for (let i = 1; i <= 10; i++) {
			const maybeAttendee = interaction.options.getUser(`attendee${i}`);
			if (maybeAttendee) {
				attendees.push(maybeAttendee);
			}
		}

		interaction.editReply(await this.newMeetup(interaction.id, date, interaction.user, attendees));
	}

	public async messageLeaderboard(msg: Message) {
		const resp = await sendLoadingMessage(msg);
		if (!msg.inGuild()) {
			throw new UserError({ message: 'This command must be run in a server.', identifier: 'NoGuildLeaderboardRun' });
		}
		resp.edit(await this.createLeaderboard(msg.guild));
	}

	public async chatInputLeaderboard(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		if (!interaction.guild) {
			throw new UserError({ message: 'This command must be run in a server.', identifier: 'NoGuildLeaderboardRun' });
		}
		interaction.editReply(await this.createLeaderboard(interaction.guild));
	}

	private async createLeaderboard(committiee: Guild): Promise<BaseMessageOptions> {
		const stats = await this.container.db.meetups.aggregate<LeaderboardStat>([
			{
				$unwind: '$confirmedMembers'
			},
			{
				$group: {
					_id: '$confirmedMembers',
					count: { $sum: 1 },
					latestDate: { $max: '$date' }
				}
			},
			{
				$sort: { count: -1 }
			}
		]).toArray();

		const members = await Promise.all(stats.map(async (stat) => {
			const member = await committiee.members.fetch(stat._id);
			return {
				name: member.displayName,
				pfp: await loadImage(member.displayAvatarURL({ extension: 'png' })),
				count: stat.count,
				latestDate: stat.latestDate
			};
		}));

		const background = await loadImage(readFileSync(`${__dirname}../../../../src/assets/committieeLeaderboardBackground.svg`));
		const canvas = createCanvas(background.width, background.height);
		const ctx = canvas.getContext('2d');
		ctx.font = '35px Sans';
		ctx.fillStyle = '#FFFFFF';

		ctx.drawImage(background, 0, 0);

		const podiumPositions = [
			{ x: 330, y: 20 },
			{ x: 152, y: 80 },
			{ x: 508, y: 158 }
		] as const;

		for (let i = 0; i < members.length; i++) {
			if (i < 3) {
				ctx.resetTransform();
				ctx.save();
				ctx.translate(podiumPositions[i].x, podiumPositions[i].y);
				ctx.beginPath();
				ctx.arc(45, 45, 45, 0, Math.PI * 2);
				ctx.clip();
				ctx.drawImage(members[i].pfp, 0, 0, 90, 90);
				ctx.restore();
			}

			ctx.resetTransform();
			ctx.translate(30, 375 + (i * 45));
			ctx.save();
			ctx.beginPath();
			ctx.arc(35 / 2, 35 / 2, 35 / 2, 0, Math.PI * 2);
			ctx.clip();
			ctx.drawImage(members[i].pfp, 0, 0, 35, 35);
			ctx.restore();
			ctx.fillText(`${members[i].count}|${members[i].name}`, 45, 25);
		}

		return {
			content: '',
			embeds: [
				new EmbedBuilder()
					.setImage('attachment://background.png')
			],
			files: [
				{ attachment: canvas.toBuffer('image/png'), name: 'background.png' }
			]
		};
	}

}

type LeaderboardStat = {
	_id: string;
	count: number;
	latestDate: Date;
};

// Useful for leaderboard
// db.meetups.aggregate([
// 	{
// 	  $unwind: "$confirmedMembers"
// 	},
// 	{
// 	  $group: {
// 		_id: "$confirmedMembers",
// 		count: { $sum: 1 },
// 		latestDate: { $max: "$date" }
// 	  }
// 	},
// 	{
// 	  $sort: { count: -1 }
// 	}
// ]);
