import { ObjectType, Field, Resolver, Query, ID, buildSchema, Int, Ctx, FieldResolver } from 'type-graphql';
import Container, { Inject, Service } from 'typedi';
import { Retryable } from 'typescript-retry-decorator';

import Context from './context';
import { EnvToken } from './di_tokens';

@ObjectType({ description: 'User model' })
class User {
	@Field(() => ID)
	id!: string;

	@Field(() => Address, { nullable: true })
	address?: Address;
}

@ObjectType({ description: 'Address model' })
class Address {
	@Field(() => String)
	street: string;

	@Field(() => String)
	city: string;

	@Field(() => String)
	state: string;

	@Field(() => Int)
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
		await this.env.GRAPHQL_WORKER.put('firstName', firstName);
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

	@Query(() => User)
	me(@Ctx() ctx: Context): User {
		console.log({ name: ctx.appName, ipAddress: ctx.ipAddress }); // Log the IP address for debugging
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

export const schema = await buildSchema({ emitSchemaFile: false, resolvers: [UserResolver], validate: true, container: Container });
