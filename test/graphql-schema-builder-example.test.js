import tape from 'tape';
import log from 'mk-log';
import * as GraphQL from 'graphql';

async function main() {
  tape(async (t) => {
    const UserType = new GraphQL.GraphQLObjectType({
      name: 'User',
      fields: {
        givenName: { type: GraphQL.GraphQLString },
        familyName: { type: GraphQL.GraphQLString },
        city: { type: GraphQL.GraphQLString },
      },
    });

    const CompanyType = new GraphQL.GraphQLObjectType({
      name: 'Company',
      fields: {
        legalName: { type: GraphQL.GraphQLString },
        city: { type: GraphQL.GraphQLString },
        employees: {
          type: new GraphQL.GraphQLList(UserType),
          resolve: (_parent, _args, _context, _info) => {
            return [{ familyName: 'tada' }];
          },
        },
      },
    });

    const queryDef = new GraphQL.GraphQLObjectType({
      name: 'Query',
      fields: {
        hello: {
          type: GraphQL.GraphQLString,
          resolve: () => {
            return 'Hello World';
          },
        },
        user: {
          type: UserType,
          args: {
            id: { type: GraphQL.GraphQLID },
            givenName: { type: GraphQL.GraphQLString },
            familyName: { type: GraphQL.GraphQLString },
            city: { type: GraphQL.GraphQLString },
          },
          resolve: (_parent, _args, _context, _info) => {
            return {
              id: 10,
              givenName: 'test',
            };
          },
        },
        company: {
          type: CompanyType,
          args: {
            id: { type: GraphQL.GraphQLID },
          },
          resolve: (_parent, _args, _context, _info) => {
            log.info('company resolver parent ', _parent);
            log.info('company resolver args   ', _args);
            log.info('company resolver context', _context);
            log.info('company resolver info   ', _info);
            return {
              id: 3,
              legalName: 'legal test name',
              city: 'company location',
            };
          },
        },
      },
    });

    const schema = new GraphQL.GraphQLSchema({ query: queryDef });

    // log.info(schema);

    const userQuery = `
      { hello, user(id: 1) { familyName givenName } } `;

    try {
      const userResult = await GraphQL.graphql({ schema, source: userQuery });
      log.info(userResult);
    } catch (err) {
      log.error(err);
    }

    const companyQuery = `
      {
        company(id: 1) { 
          city 
          employees { 
            familyName 
          }  
        } 
      }`;

    try {
      const companyResult = await GraphQL.graphql({
        schema,
        source: companyQuery,
      });
      log.info(companyResult);
    } catch (err) {
      log.error(err);
    }
    t.end();
  });
}

main();
