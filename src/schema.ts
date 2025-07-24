import { ObjectType, Field, Resolver, Query, ID, buildSchema, Int, Ctx, FieldResolver, UseMiddleware, Mutation } from 'type-graphql';
import Container, { Inject, Service } from 'typedi';
import { Retryable } from 'typescript-retry-decorator';

import Context from './context';
import { EnvToken } from './di_tokens';
import { WriteLastAcesses } from './middleware';
import { LAST_WRITTEN_TIMESTAMP_KEY } from './constants';

@ObjectType({ description: 'User model' })
class User {
	@Field(() => ID)
	id!: string;

	@Field(() => Address, { nullable: true })
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
	constructor(private readonly userService: UserService, @Inject(EnvToken) private readonly env: Env) {}

	@Query(() => User, { description: 'Get the current viewer/user of the app' })
	public async viewer(@Ctx() ctx: Context): Promise<User> {
		const lastWrittenAt = await this.env.GRAPHQL_WORKER_KV.get(LAST_WRITTEN_TIMESTAMP_KEY);
		console.info({ name: ctx.appName, ipAddress: ctx.ipAddress, lastWrittenAt });

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

@Service()
@Resolver()
@UseMiddleware(WriteLastAcesses)
export class MetricsResolver {
	@Mutation(() => Boolean, { description: 'Write the last accessed time to KV' })
	public async setLastAccessedTime(): Promise<boolean> {
		console.info('Setting last accessed time to KV...');
		return true;
	}
}

export const schema = await buildSchema({
	emitSchemaFile: false,
	resolvers: [UserResolver, MetricsResolver],
	validate: true,
	container: Container,
});
