export declare function runCli(options?: {
	argv?: string[];
	stdout?: { write(chunk: string): unknown };
	stderr?: { write(chunk: string): unknown };
}): number;
