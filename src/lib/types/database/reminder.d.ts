import { DurationLikeObject } from 'luxon';

export interface Reminder {
	user: string;
	content: string;
	expires: Date;
	repeat: number | null | DurationLikeObject;
	channel: string;
	mode: 'public' | 'private';
}
