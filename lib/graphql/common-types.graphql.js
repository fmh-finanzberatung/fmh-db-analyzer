const GraphQL = require('graphql');

const IntervalTypeValues = {
  OPEN: {
    value: 'OPEN',
  },
  CLOSED: {
    value: 'CLOSED',
  },
};

const DateFields = {
  year: {
    type: GraphQL.GraphQLInt,
  },
  month: {
    type: GraphQL.GraphQLInt,
  },
  day: {
    type: GraphQL.GraphQLInt,
  },
};

const DateTimeFields = {
  ...DateFields,
  hour: {
    type: GraphQL.GraphQLInt,
  },
  minute: {
    type: GraphQL.GraphQLInt,
  },
  second: {
    type: GraphQL.GraphQLInt,
  },
  millisecond: {
    type: GraphQL.GraphQLInt,
  },
};

const DateTimeInput = new GraphQL.GraphQLInputObjectType({
  name: 'DateTimeInput',
  fields: DateTimeFields,
});

const DateInput = new GraphQL.GraphQLInputObjectType({
  name: 'DateInput',
  fields: DateFields,
});

const DateTimeOutput = new GraphQL.GraphQLObjectType({
  name: 'DateTimeOutput',
  fields: DateTimeFields,
});

const DateOutput = new GraphQL.GraphQLObjectType({
  name: 'DateOutput',
  fields: DateFields,
});

const ErrorCodeOutput = new GraphQL.GraphQLEnumType({
  name: 'ErrorCodeOutput',
  values: {
    USER_ALREADY_EXISTS: {
      value: 'USER_ALREADY_EXISTS',
      description: 'User already exists',
    },
    LOGIN_FAILED: {
      value: 'LOGIN_FAILED',
      description: 'Login failed',
    },
    REGISTRATION_FAILED: {
      value: 'REGISTRATION_FAILED',
      description: 'Registration failed',
    },
  },
});

const SuccessCodeOutput = new GraphQL.GraphQLEnumType({
  name: 'SuccessCodeOutput',
  values: {
    LOGIN_SUCCESS: {
      value: 'LOGIN_SUCCESS',
      description: 'Login success',
    },
    USER_CREATED_SUCCESS: {
      value: 'USER_CREATED_SUCCESS',
      description: 'Registration was successful',
    },
  },
});

const ErrorItemOutput = new GraphQL.GraphQLObjectType({
  name: 'ErrorItemOutput',
  fields: {
    message: {
      type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
    },
    code: {
      type: ErrorCodeOutput,
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
      type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
    },
    code: {
      type: ErrorCodeOutput,
    },
    errors: {
      type: new GraphQL.GraphQLList(ErrorItemOutput),
    },
  },
});

const SuccessOutput = new GraphQL.GraphQLObjectType({
  name: 'SuccessOutput',
  fields: {
    message: {
      type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
    },
    code: {
      type: SuccessCodeOutput,
    },
  },
});

const OrderDirectionInput = new GraphQL.GraphQLEnumType({
  name: 'OrderDirection',
  values: {
    ASC: {
      value: 'ASC',
    },
    DESC: {
      value: 'DESC',
    },
  },
});

const IntervalTypeInput = new GraphQL.GraphQLEnumType({
  name: 'IntervalType',
  values: IntervalTypeValues,
});

const DateInputRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'DateInputRangeInput',
  fields: {
    startVal: {
      type: DateInput,
    },
    startType: {
      type: IntervalTypeInput,
      default: IntervalTypeValues.CLOSED,
    },
    endVal: {
      type: DateInput,
    },
    endType: {
      type: IntervalTypeInput,
      default: IntervalTypeValues.CLOSED,
    },
  },
});

const DateTimeInputRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'DateTimeInputRangeInput',
  fields: {
    startVal: {
      type: DateTimeInput,
    },
    startType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
    endVal: {
      type: DateTimeInput,
    },
    endType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
  },
});

const StringRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'StringRangeInput',
  fields: {
    startVal: {
      type: GraphQL.GraphQLString,
    },
    startType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
    endVal: {
      type: GraphQL.GraphQLString,
    },
    endType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
  },
});

const BooleanRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'BooleanRangeInput',
  fields: {
    startVal: { type: GraphQL.GraphQLBoolean },
    startType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
    endVal: { type: GraphQL.GraphQLBoolean },
    endType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
  },
});

const FloatRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'FloatRangeInput',
  fields: {
    startVal: { type: GraphQL.GraphQLFloat },
    startType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
    endVal: { type: GraphQL.GraphQLFloat },
    endType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
  },
});

const IntRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'IntRangeInput',
  fields: {
    startVal: {
      type: GraphQL.GraphQLInt,
    },
    startType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
    endVal: {
      type: GraphQL.GraphQLInt,
    },
    endType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
  },
});

const IDRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'IDRangeInput',
  fields: {
    startVal: {
      type: GraphQL.GraphQLID,
    },
    startType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
    endVal: {
      type: GraphQL.GraphQLID,
    },
    endType: {
      type: IntervalTypeInput,
      default: IntervalTypeInput.CLOSED,
    },
  },
});

const PaginationFields = {
  page: {
    type: GraphQL.GraphQLInt,
  },
  pageSize: {
    type: GraphQL.GraphQLInt,
  },
};

const PaginationInput = new GraphQL.GraphQLInputObjectType({
  name: 'PaginationInput',
  fields: PaginationFields,
});

const PaginationOutput = new GraphQL.GraphQLObjectType({
  name: 'PaginationOutput',
  fields: {
    ...PaginationFields,
    total: {
      type: GraphQL.GraphQLInt,
    },
    pages: {
      type: GraphQL.GraphQLInt,
    },
    isFirst: {
      type: GraphQL.GraphQLBoolean,
    },
    isLast: {
      type: GraphQL.GraphQLBoolean,
    },
    first: {
      type: GraphQL.GraphQLInt,
    },
    last: {
      type: GraphQL.GraphQLInt,
    },
    prev: {
      type: GraphQL.GraphQLInt,
    },
    next: {
      type: GraphQL.GraphQLInt,
    },
  },
});

module.exports = {
  BooleanRangeInput,
  DateInput,
  DateInputRangeInput,
  DateOutput,
  DateTimeInput,
  DateTimeInputRangeInput,
  DateTimeOutput,
  ErrorOutput,
  SuccessOutput,
  FloatRangeInput,
  IDRangeInput,
  IntRangeInput,
  IntervalTypeInput,
  OrderDirectionInput,
  PaginationInput,
  PaginationOutput,
  StringRangeInput,
};
