import 'reflect-metadata';

import { createYoga } from 'graphql-yoga';

import { schema } from './schema';
import Context from './context';

const yoga = createYoga({
	schema,
	graphiql: true,
	graphqlEndpoint: '/graphql',
	context: async ({ request }): Promise<Context> => new Context(request),
});

export default {
	fetch: yoga.fetch,
} satisfies ExportedHandler<Env>;
