import { ObjectType, Field, Resolver, Query, ID, buildSchema, Int, Ctx } from 'type-graphql';
import Context from './context';
import Container, { Service } from 'typedi';

@ObjectType({ description: 'User model' })
class User {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { description: 'Name of the user' })
	name: string;

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
@Resolver(User)
class UserResolver {
	@Query(() => User)
	me(@Ctx() ctx: Context): User {
		console.log({ name: ctx.appName, ipAddress: ctx.ipAddress }); // Log the IP address for debugging
		return {
			id: '1',
			name: 'John Doe',
			address: {
				street: '123 Main St',
				city: 'Anytown',
				state: 'CA',
				zip: 12345,
			},
		};
	}
}

export const schema = await buildSchema({ emitSchemaFile: false, resolvers: [UserResolver], validate: true, container: Container });
