const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const CommonGraphqlTypes = require('../../lib/graphql/common-types.graphql.js');

const JobsOrderInput = new GraphQL.GraphQLInputObjectType({
  name: 'JobsOrderInput',
  fields: {
    id: {
      type: CommonGraphqlTypes.get('OrderDirectionInput'),
    },
    title: {
      type: CommonGraphqlTypes.get('OrderDirectionInput'),
    },
  },
});

const JobsSearchInput = new GraphQL.GraphQLInputObjectType({
  name: 'JobsSearchInput',
  fields: {
    id: {
      type: GraphQL.GraphQLID,
    },
    title: {
      type: GraphQL.GraphQLString,
    },
  },
});

const JobsRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'JobsRangeInput',
  fields: {
    id: {
      type: CommonGraphqlTypes.get('IDRangeInput'),
    },
    title: {
      type: CommonGraphqlTypes.get('StringRangeInput'),
    },
  },
});

const JobOutput = new GraphQL.GraphQLObjectType({
  name: 'JobOutput',
  fields: {
    id: {
      type: GraphQL.GraphQLID,
    },
    title: {
      type: GraphQL.GraphQLString,
    },
  },
});

const JobsOutput = new GraphQL.GraphQLObjectType({
  name: 'JobsOutput',
  fields: {
    pagination: {
      type: CommonGraphqlTypes.get('PaginationOutput'),
    },
    docs: {
      type: GraphQL.GraphQLList(JobOutput),
    },
    error: {
      type: CommonGraphqlTypes.get('ErrorOutput'),
    },
  },
});

const JobArgs = {
  id: {
    type: GraphQL.GraphQLID,
  },
  title: {
    type: GraphQL.GraphQLString,
  },
  order: {
    type: JobsOrderInput,
  },
  search: {
    type: JobsSearchInput,
  },
  range: {
    type: JobsRangeInput,
  },
};

const JobsArgs = Object.assign({}, JobArgs, {
  pagination: {
    type: CommonGraphqlTypes.get('PaginationInput'),
  },
});

log.info('JobsArgs', JobsArgs);

const schema = new GraphQL.GraphQLSchema({
  query: new GraphQL.GraphQLObjectType({
    name: 'Query',
    hello: {
      type: GraphQL.GraphQLString,
      resolve: () => 'world',
    },
    fields: {
      job: {
        type: JobOutput,
        args: JobArgs,
        resolve: (root, args) => {
          return {
            id: args.id,
            title: 'hello',
          };
        },
      },
      jobs: {
        type: JobsOutput,
        args: JobsArgs,
        resolve: (_) => {
          return {
            docs: [
              {
                id: 1,
                title: 'Software Engineer',
              },
            ],
            pagination: {
              page: 1,
              pageSize: 10,
              total: 1,
              pages: 1,
            },
          };
        },
      },
    },
  }),
  mutation: new GraphQL.GraphQLObjectType({
    name: 'Mutation',
    fields: () => {
      return {
        createJob: {
          type: JobOutput,
          args: JobArgs,
          resolve: (_, args) => {
            return {
              id: args.input.id,
              title: args.input.title,
            };
          },
        },
        updateJob: {
          type: JobOutput,
          args: JobArgs,
          resolve: (_, args) => {
            return {
              id: args.input.id,
              title: args.input.title,
            };
          },
        },
        deleteJob: {
          type: JobOutput,
          args: JobArgs,
          resolve: (_, _args) => {
            return true;
          },
        },
        deleteJobs: {
          type: JobsOutput,
          args: JobsArgs,
          resolve: (_, _args) => {
            return {
              pagination: {
                page: 1,
                pageSize: 10,
                total: 1,
                pages: 1,
              },
              docs: [
                {
                  id: 1,
                  title: 'Software Engineer',
                },
              ],
            };
          },
        },
      };
    },
  }),
});

tape(async (t) => {
  try {
    const queryResult = await GraphQL.graphql(
      schema,
      `
        query {
          jobs( title: "Exterior" range: { id: {startVal: 10, endVal: 20 } } ) {
            docs {
              title
            }
          }
        }
      `
    );

    log.info('queryResult', queryResult);
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
  } catch (err) {
    log.error(err);
  } finally {
    t.end();
  }
});
