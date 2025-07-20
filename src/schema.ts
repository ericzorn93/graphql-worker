import { ObjectType, Field, Resolver, Query, ID, buildSchema, Int } from 'type-graphql';

@ObjectType()
class User {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
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

@Resolver(User)
class UserResolver {
	@Query(() => User)
	me(): User {
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

export const schema = await buildSchema({ emitSchemaFile: false, resolvers: [UserResolver] });
