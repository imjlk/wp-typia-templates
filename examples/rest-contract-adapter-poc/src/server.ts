import { startCounterAdapterServer } from './counter-adapter';

const server = await startCounterAdapterServer();

console.log(
	`REST contract adapter PoC listening on ${server.url}${server.routeTable[0]?.path ?? ''}`
);

for (const signal of [ 'SIGINT', 'SIGTERM' ] as const) {
	process.on(signal, () => {
		void server.close().finally(() => process.exit(0));
	});
}
