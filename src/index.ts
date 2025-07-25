import 'reflect-metadata';

import { Container } from 'typedi';
import { createYoga } from 'graphql-yoga';
import { useResponseCache } from '@graphql-yoga/plugin-response-cache';

import Context from './context';
import { schema } from './schema';
import { EnvToken } from './di_tokens';

const yoga = createYoga<Env, Context>({
	schema,
	graphiql: true,
	graphqlEndpoint: '/graphql',
	context: async ({ request }): Promise<Context> => new Context(request),
	plugins: [useResponseCache({ session: () => null })],
});

export default {
	fetch: async (request: Request, env: Env): Promise<Response> => {
		try {
			Container.set(EnvToken, env); // Set the environment in the container for dependency injection
			return yoga.fetch(request, env);
		} catch (error) {
			console.error('Error in fetch handler:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
