export interface ILog {
	message: string;
	hash: string;
}

export type SpawnHandle = (response: Buffer) => void;

export type SpawnClose = (code: number) => void;

