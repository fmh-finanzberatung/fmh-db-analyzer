const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('../../lib/graphql/common-types.graphql.js');
const TypesStore = require('../../lib/graphql/types-store.js');

const typesStore = TypesStore();

const resolvePerson = () => {
  return {
    id: 1,
    given_name: 'John',
    family_name: 'Doe',
    job: {
      title: 'Software Engineer',
    },
  };
};

const resolvePersons = () => {
  return {
    id: 1,
    title: 'Software Engineer',
    persons: {
      docs: [
        {
          id: 1,
          given_name: 'John',
          family_name: 'Doe',
        },
        {
          id: 1,
          given_name: 'John',
          family_name: 'Doe',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 1,
        pages: 1,
      },
    },
  };
};

const resolveJobs = () => {
  return {
    docs: [
      {
        id: 1,
        title: 'Software Engineer',
        persons: {
          docs: [
            {
              id: 1,
              given_name: 'John',
              family_name: 'Doe',
            },
          ],
        },
      },
      {
        id: 2,
        title: 'Developer',
        persons: {
          docs: [
            {
              id: 2,
              given_name: 'Jane',
              family_name: 'Doe',
            },
          ],
        },
      },
    ],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 1,
      pages: 1,
    },
  };
};

const JobArgs = {
  id: {
    type: GraphQL.GraphQLID,
  },
  title: {
    type: GraphQL.GraphQLString,
  },
};

const PersonArgs = {
  id: {
    type: GraphQL.GraphQLID,
  },
  first_name: {
    type: GraphQL.GraphQLString,
  },
  family_name: {
    type: GraphQL.GraphQLString,
  },
};

const JobTypeDef = {
  name: 'JobOutput',
  fields: () => ({
    id: { type: GraphQL.GraphQLID },
    title: {
      type: GraphQL.GraphQLString,
    },
    persons: {
      type: typesStore.fetchType('PersonList'),
    },
  }),
};

const JobListTypeDef = {
  name: 'JobListOutput',
  fields: () => ({
    docs: {
      type: new GraphQL.GraphQLList(typesStore.fetchType('Job')),
    },
    pagination: {
      type: CommonGraphqlTypes.PaginationOutput,
    },
  }),
};

const PersonListTypeDef = {
  name: 'PersonListOutput',
  fields: () => ({
    docs: {
      type: new GraphQL.GraphQLList(typesStore.fetchType('Person')),
    },
    pagination: {
      type: CommonGraphqlTypes.PaginationOutput,
    },
  }),
};

const PersonTypeDef = {
  name: 'PersonOutput',
  fields: () => ({
    id: { type: GraphQL.GraphQLID },
    given_name: {
      type: GraphQL.GraphQLString,
    },
    family_name: {
      type: GraphQL.GraphQLString,
    },
    job: {
      args: JobArgs,
      type: new GraphQL.GraphQLList(typesStore.fetchType('Job')),
    },
  }),
};

typesStore.addTypeDef('Job', JobTypeDef);
typesStore.addTypeDef('JobList', JobListTypeDef);
typesStore.addTypeDef('Person', PersonTypeDef);
typesStore.addTypeDef('PersonList', PersonListTypeDef);

const query = new GraphQL.GraphQLObjectType({
  name: 'Query',
  hello: {
    type: GraphQL.GraphQLString,
    resolve: () => 'world',
  },
  fields: {
    person: {
      args: PersonArgs,
      type: typesStore.fetchType('Person'),
      resolve: resolvePerson,
    },
    job: {
      args: JobArgs,
      type: typesStore.fetchType('Job'),
      resolve: resolvePersons,
    },
    jobs: {
      args: JobArgs,
      type: typesStore.fetchType('JobList'),
      resolve: resolveJobs,
    },
    persons: {
      args: PersonArgs,
      type: typesStore.fetchType('PersonList'),
      resolve: resolveJobs,
    },
  },
});

const schema = new GraphQL.GraphQLSchema({ query });

tape(async (t) => {
  try {
    const queryResult = await GraphQL.graphql(
      schema,
      `
        query {
          jobs( title: "Exterior" ) {
            docs {
              title
              persons {
                docs {
                  id
                  given_name
                  family_name
                  job {
                    title
                  }
                }
              }
            }
          }
        }
      `
    );

    log.info('queryResult', JSON.stringify(queryResult, null, 2));
    /* 
    const mutationResult = await GraphQL.graphql(
      schema,
      `
        mutation {
          deleteJobs( title: "Exterior" range: { id: {startVal: 10, endVal: 20 } } ) {
            docs {
              title
            }
          }
        }
      `
    );
    log.info('mutationResult', mutationResult);
    */
  } catch (err) {
    log.error(err);
  } finally {
    t.end();
  }
});
