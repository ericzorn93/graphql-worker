import { MiddlewareInterface, ResolverData, NextFn } from 'type-graphql';
import { Inject, Service } from 'typedi';

import Context from './context';
import { EnvToken } from './di_tokens';

@Service()
export class WriteLastAcesses implements MiddlewareInterface<Context> {
	constructor(@Inject(EnvToken) private readonly env: Env) {}

	public async use(_resolverData: ResolverData<Context>, next: NextFn) {
		const now = new Date();
		try {
			await this.env.GRAPHQL_WORKER_KV.put('lastAccessedAt', now.toISOString());
		} catch (error) {
			console.error('Error writing to KV:', error);
		} finally {
			console.info(`Last accessed at: ${now.toISOString()}`);
		}

		return next();
	}
}
