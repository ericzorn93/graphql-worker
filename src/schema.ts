import { ObjectType, Field, Resolver, Query, ID, buildSchema, Int, Ctx, FieldResolver, Directive, Mutation } from 'type-graphql';
import Container, { Inject, Service } from 'typedi';
import { Retryable } from 'typescript-retry-decorator';

import Context from './context';
import { EnvToken } from './di_tokens';
import { LAST_WRITTEN_TIMESTAMP_KEY } from './constants';

@ObjectType({ description: 'User model' })
class User {
	@Field(() => ID, { description: 'Unique identifier for the user' })
	id!: string;

	@Field(() => Address, { nullable: true, description: 'Address of the user' })
	address?: Address;
}

@ObjectType({ description: 'Address model' })
class Address {
	@Field(() => String, { description: 'Street address' })
	street: string;

	@Field(() => String, { description: 'City of the address' })
	city: string;

	@Field(() => String, { description: 'State of the address' })
	state: string;

	@Field(() => Int, { description: 'ZIP code of the address' })
	zip: number;
}

@Service()
class UserService {
	constructor(@Inject(EnvToken) private readonly env: Env) {}

	@Retryable({
		maxAttempts: 3,
	})
	public async getFirstName(): Promise<string> {
		const firstName = 'Eric';
		console.log('Fetching first name...');
		console.log(this.env.MY_VARIABLE);
		return firstName;
	}

	@Retryable({
		maxAttempts: 3,
	})
	public async getLastName(): Promise<string> {
		console.log('Fetching last name...');
		return 'Zorn';
	}
}

@Service()
@Resolver(User)
class UserResolver {
	constructor(private readonly userService: UserService) {}

	@Query(() => User, { description: 'Get the current viewer/user of the app' })
	public async viewer(@Ctx() ctx: Context): Promise<User> {
		console.info({ name: ctx.appName, ipAddress: ctx.ipAddress });

		return {
			id: '1',
			address: {
				street: '123 Main St',
				city: 'Anytown',
				state: 'CA',
				zip: 12345,
			},
		};
	}

	@FieldResolver(() => String, { description: 'First name of the user' })
	public firstName(): Promise<string> {
		return this.userService.getFirstName();
	}

	@FieldResolver(() => String, { description: 'Last name of the user' })
	public lastName(): Promise<string> {
		return this.userService.getLastName();
	}

	@FieldResolver(() => String, { description: 'Full name of the user' })
	public async fullName(): Promise<string> {
		return `${await this.userService.getFirstName()} ${await this.userService.getLastName()}`;
	}
}

@ObjectType({ description: 'Metrics for the application' })
class Metrics {
	@Field(() => Date, { description: 'Last written timestamp in KV' })
	public lastWrittenAt: Date;

	@Field(() => Date, {
		description: 'Old time from the server',
		deprecationReason: 'This field is deprecated, please use currentTime instead',
	})
	oldTime: Date;

	@Field(() => Date, { description: 'Current timestamp from the server' })
	public currentTime: Date;
}

@Service()
@Resolver(Metrics)
export class MetricsResolver {
	constructor(@Inject(EnvToken) private readonly env: Env) {}

	@Query(() => Metrics, { description: 'Get application metrics' })
	public async metrics(): Promise<Metrics> {
		console.info;
		const lastWrittenAt = await this.env.GRAPHQL_WORKER_KV.get<string>(LAST_WRITTEN_TIMESTAMP_KEY);
		if (!lastWrittenAt) {
			console.error('Last written timestamp not found in KV');
			throw new Error('Last written timestamp not found in KV');
		}

		const now = new Date();
		return {
			lastWrittenAt: new Date(lastWrittenAt),
			oldTime: now,
			currentTime: now,
		};
	}

	@Mutation(() => Boolean, { description: 'Write the last written time to KV' })
	public async setLastWrittenTimestamp(): Promise<boolean> {
		try {
			console.info('Setting last written time to KV...');
			const now = new Date();
			await this.env.GRAPHQL_WORKER_KV.put(LAST_WRITTEN_TIMESTAMP_KEY, now.toISOString());
		} catch (error) {
			console.error('Error writing to KV:', error);
			throw new Error('Failed to write last written timestamp to KV');
		}

		return true;
	}
}

export const schema = await buildSchema({
	emitSchemaFile: false,
	resolvers: [UserResolver, MetricsResolver],
	validate: true,
	container: Container,
});
