import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import axios from 'axios';
import { Message, EmbedBuilder } from 'discord.js';
import { SteveCommand } from '@lib/extensions/SteveCommand';
import { dateToTimestamp, sendLoadingMessage } from '@lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'Find out if Discord is on fire.',
	aliases: ['ds', 'isdiscordbroke', 'fire?']
})
export class UserCommand extends SteveCommand {

	public async messageRun(msg: Message) {
		const response = await sendLoadingMessage(msg);

		const { data: currentStatus, statusText } = await axios.get<DiscordStatus>('https://discordstatus.com/api/v2/summary.json');

		if (statusText !== 'OK') {
			return response.edit('Something must really be on fire since I can\'t even get any information about potential fires.');
		}

		const componentsOperational = currentStatus.components?.every(component => component.status === 'operational');
		const ongoingIncidents = currentStatus.incidents.length > 0;
		const isOnFire = !componentsOperational || ongoingIncidents || currentStatus.status.indicator !== 'none';

		const embed = new EmbedBuilder()
			.setColor(isOnFire ? 'Red' : 'Blurple')
			.setTitle(isOnFire ? 'Discord is currently on fire' : currentStatus.status.description)
			.setURL(currentStatus.page.url)
			.setThumbnail(isOnFire
				? 'https://cdn.discordapp.com/attachments/944669817137418333/958870020916650065/unknown.png'
				: 'https://cdn.discordapp.com/attachments/944669817137418333/958869677499629598/unknown.png')
			.setDescription(
				ongoingIncidents
					? currentStatus.incidents.map(i => `[${i.name}](${i.shortlink}): started at ${dateToTimestamp(new Date(i.created_at), 'f')}`).join('\n')
					: `No ongoing incidents.`
			)
			.addFields(componentsOperational
				? [{ name: 'All components operational', value: 'no fires here' }]
				: currentStatus.components
					.filter(component => component.status !== 'operational')
					.map(component => ({ name: component.name, value: component.status, inline: true })));

		return response.edit({ content: ' ', embeds: [embed] });
	}

}

interface DiscordStatus {
	page: Page;
	status: Status;
	components: ComponentsEntity[];
	incidents: IncidentsEntity[];
	scheduled_maintenances: ScheduledMaintenancesEntity[];
}
interface Page {
	id: string;
	name: string;
	url: string;
	updated_at: string;
}
interface Status {
	description: string;
	indicator: string;
}
interface ComponentsEntity {
	created_at: string;
	description?: string | null;
	id: string;
	name: string;
	page_id: string;
	position: number;
	status: string;
	updated_at: string;
	only_show_if_degraded: boolean;
}
interface IncidentsEntity {
	created_at: string;
	id: string;
	impact: string;
	incident_updates?: IncidentUpdatesEntity[] | null;
	monitoring_at?: null;
	name: string;
	page_id: string;
	resolved_at?: null;
	shortlink: string;
	status: string;
	updated_at: string;
}
interface IncidentUpdatesEntity {
	body: string;
	created_at: string;
	display_at: string;
	id: string;
	incident_id: string;
	status: string;
	updated_at: string;
}
interface ScheduledMaintenancesEntity {
	created_at: string;
	id: string;
	impact: string;
	incident_updates?: IncidentUpdatesEntity[] | null;
	monitoring_at?: null;
	name: string;
	page_id: string;
	resolved_at?: null;
	scheduled_for: string;
	scheduled_until: string;
	shortlink: string;
	status: string;
	updated_at: string;
}
