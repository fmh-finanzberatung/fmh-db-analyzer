const tape = require('tape');
const log = require('mk-log');
const GraphQL = require('graphql');
const {
  IDRangeInput,
  StringRangeInput,
  //IntRangeInput,
  //FloatRangeInput,
  OrderDirection,
  PaginationInput,
  PaginationOutput,
} = require('../../lib/graphql/common-types.graphql.js');

const JobsOrderInput = new GraphQL.GraphQLInputObjectType({
  name: 'JobsOrderInput',
  fields: {
    id: {
      type: OrderDirection,
    },
    title: {
      type: OrderDirection,
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
      type: IDRangeInput,
    },
    title: {
      type: StringRangeInput,
    },
  },
});

const ErrorItem = new GraphQL.GraphQLObjectType({
  name: 'ErrorItem',
  fields: {
    message: {
      type: GraphQL.GraphQLString,
    },
    field: {
      type: GraphQL.GraphQLString,
    },
  },
});

const ErrorOutput = new GraphQL.GraphQLObjectType({
  name: 'ErrorOutput',
  fields: {
    message: {
      type: GraphQL.GraphQLString,
    },
    errors: {
      type: GraphQL.GraphQLList(ErrorItem),
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
      type: PaginationOutput,
    },
    docs: {
      type: GraphQL.GraphQLList(JobOutput),
    },
    error: {
      type: ErrorOutput,
    },
  },
});

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
        args: {
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
        },
        resolve: (root, args) => {
          return {
            id: args.id,
            title: 'hello',
          };
        },
      },
      jobs: {
        type: JobsOutput,
        args: {
          id: {
            type: GraphQL.GraphQLID,
          },
          title: {
            type: GraphQL.GraphQLString,
          },
          order: {
            type: JobsOrderInput,
          },
          pagination: {
            type: PaginationInput,
          },
          search: {
            type: JobsSearchInput,
          },
          range: {
            type: JobsRangeInput,
          },
        },
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
    mutation: {
      createJob: {
        type: JobOutput,
        args: {
          title: {
            type: GraphQL.GraphQLString,
          },
        },
        resolve: (_, args) => {
          return {
            id: args.input.id,
            title: args.input.title,
          };
        },
      },
      updateJob: {
        type: JobOutput,
        args: {
          title: {
            type: GraphQL.GraphQLString,
          },
        },
        resolve: (_, args) => {
          return {
            id: args.input.id,
            title: args.input.title,
          };
        },
      },
      deleteJob: {
        type: JobOutput,
        args: {
          id: {
            type: GraphQL.GraphQLID,
          },
        },
        resolve: (_, _args) => {
          return true;
        },
      },
    },
  }),
});

tape(async (t) => {
  try {
    const result = await GraphQL.graphql(
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

    log.info('result', result);
  } catch (err) {
    log.error(err);
  } finally {
    t.end();
  }
});
