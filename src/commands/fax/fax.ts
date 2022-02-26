import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { ColorResolvable, Message, MessageAttachment, MessageEmbed, TextChannel, Util } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { SteveCommand } from '../../lib/extensions/SteveCommand';

const WIDTH = 750;
const HEIGHT = WIDTH;
const HEADER_HEIGHT = 150;
const FONT_HEIGHT = 35;

@ApplyOptions<CommandOptions>({
	description: 'Send someone a fax!',
	detailedDescription: {
		usage: '<fax number> <message>',
		examples: ['867-5309 Thanks for being awesome!', '01189998819991197253 HELP! FIRE! Help, there is a fire. ~Moss']
	}
})
export class UserCommand extends SteveCommand {
	public async messageRun(msg: Message, args: Args) {
		const faxNumber = await args.pick('string');
		const recipient = await this.client.db.users.findOne({ 'fax.number': faxNumber });

		if (!recipient || !recipient.fax?.channel) {
			return send(msg, "Sorry, Lorna doesn't have that number in her rolodex");
		}

		const response = await send(msg, `Dialing ${faxNumber}...`);

		let message = Util.cleanContent(await args.rest('string'), msg.channel).replace(/<a?(:[a-zA-Z0-9_-]{2,}:)\d+>/g, '$1');

		const attachments: Array<MessageAttachment> = [];

		const canvas = createCanvas(WIDTH, HEIGHT);
		const ctx = canvas.getContext('2d');

		ctx.fillStyle = recipient.fax?.background || '#ffffff';
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		ctx.fillStyle = recipient.fax?.text || '#000000';
		ctx.textAlign = 'center';
		ctx.font = '50px serif';
		ctx.fillText('From the desk of', WIDTH / 2, 50);

		ctx.font = '45px serif';
		ctx.fillText(msg.author.username, WIDTH / 2, 100);

		const pfp = await loadImage(msg.author.displayAvatarURL({ format: 'png' }));
		ctx.save();
		ctx.translate(HEADER_HEIGHT / 2 - 50, HEADER_HEIGHT / 2 - 50);
		ctx.beginPath();
		ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
		ctx.clip();
		ctx.drawImage(pfp, 0, 0, 100, 100);
		ctx.restore();

		ctx.translate(HEADER_HEIGHT / 2 - 25, HEADER_HEIGHT + 25);
		ctx.textAlign = 'left';
		ctx.font = `${FONT_HEIGHT - 5}px serif`;

		let i = 0,
			j = 0,
			currentHeight = HEADER_HEIGHT + 25,
			pageIdx = 1;

		while (message.length) {
			for (i = message.length; ctx.measureText(message.substring(0, i)).width > WIDTH - 75; i--);

			let result = message.substring(0, i);

			if (result.indexOf('\n') !== -1) {
				result = result.substring(0, result.indexOf('\n') + 1);
			} else if (i !== message.length) {
				for (j = 0; result.indexOf(' ', j) !== -1; j = result.indexOf(' ', j) + 1);
				result = result.substring(0, j || result.length);
			}

			ctx.fillText(result, 0, 0);
			ctx.translate(0, FONT_HEIGHT);
			currentHeight += FONT_HEIGHT;
			message = message.substring(result.length, message.length);

			if (currentHeight >= HEIGHT - 25) {
				attachments.push(new MessageAttachment(canvas.toBuffer(), `page${pageIdx++}.png`));

				ctx.resetTransform();

				ctx.fillStyle = recipient.fax?.background || '#ffffff';
				ctx.fillRect(0, 0, WIDTH, HEIGHT);

				ctx.fillStyle = recipient.fax?.text || '#000000';
				ctx.translate(HEADER_HEIGHT / 2 - 25, HEADER_HEIGHT / 2 - 25);
				currentHeight = HEADER_HEIGHT / 2 - 25;
			}
		}

		attachments.push(new MessageAttachment(canvas.toBuffer(), `page${pageIdx++}.png`));

		if (attachments.length > 10) {
			return response.edit("The fax machine doesn't have enough paper for a fax that long.");
		}

		const embeds = attachments.map((attachment) =>
			new MessageEmbed()
				.setImage(`attachment://${attachment.name}`)
				.setTimestamp(msg.createdTimestamp)
				.setColor((recipient.embedColor || 0xadcb27) as ColorResolvable)
		);

		const faxDest = (this.client.channels.cache.get(recipient.fax.channel) ||
			(await this.client.channels.fetch(recipient.fax.channel))) as TextChannel;

		await faxDest.send({
			content: `<@${recipient.id}>! I got a fax here for ya darlin`,
			files: attachments,
			embeds
		});

		return response.edit('The fax confirmation just came through. Your message has been delivered.');
	}
}
