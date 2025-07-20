import { ObjectType, Field, Resolver, Query, ID, buildSchema, Int, Ctx, FieldResolver } from 'type-graphql';
import Context from './context';
import Container, { Service } from 'typedi';
import { Retryable } from 'typescript-retry-decorator';

@ObjectType({ description: 'User model' })
class User {
	@Field(() => ID)
	id!: string;

	@Field(() => Address, { nullable: true })
	address?: Address;
}

@ObjectType()
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
	@Retryable({
		maxAttempts: 3,
	})
	public getFirstName(): string {
		console.log('Fetching first name...');
		return 'Eric';
	}

	@Retryable({
		maxAttempts: 3,
	})
	public getLastName(): string {
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
	public firstName(): string {
		return this.userService.getFirstName();
	}

	@FieldResolver(() => String, { description: 'Last name of the user' })
	public lastName(): string {
		return this.userService.getLastName();
	}

	@FieldResolver(() => String, { description: 'Full name of the user' })
	public fullName(): string {
		return `${this.userService.getFirstName()} ${this.userService.getLastName()}`;
	}
}

export const schema = await buildSchema({ emitSchemaFile: false, resolvers: [UserResolver], validate: true, container: Container });
