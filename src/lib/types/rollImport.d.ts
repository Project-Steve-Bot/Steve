export type RollImport = {
	characterName: string
	attacks: AttackRoll[]
	abilityChecks: Roll[]
	attributes: Roll[]
	saves: Roll[]
}

export type AttackRoll = Roll & {
	damage?: string;
}

export type Roll = {
	name: string;
	roll: number;
}
