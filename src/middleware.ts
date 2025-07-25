import { MiddlewareInterface, ResolverData, NextFn } from 'type-graphql';
import { Inject, Service } from 'typedi';

import Context from './context';
import { EnvToken } from './di_tokens';
import { LAST_WRITTEN_TIMESTAMP_KEY } from './constants';

@Service()
export class WriteLastAcesses implements MiddlewareInterface<Context> {
	constructor(@Inject(EnvToken) private readonly env: Env) {}

	public async use(_resolverData: ResolverData<Context>, next: NextFn) {
		const now = new Date();
		try {
			await this.env.GRAPHQL_WORKER_KV.put(LAST_WRITTEN_TIMESTAMP_KEY, now.toISOString());
		} catch (error) {
			console.error('Error writing to KV:', error);
		} finally {
			console.info(`last written at: ${now.toISOString()}`);
		}

		return next();
	}
}
