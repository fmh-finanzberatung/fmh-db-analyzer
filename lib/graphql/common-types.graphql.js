const GraphQL = require('graphql');

const ErrorItem = new GraphQL.GraphQLObjectType({
  name: 'ErrorItemOutput',
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

const IntervalType = new GraphQL.GraphQLEnumType({
  name: 'IntervalType',
  values: {
    OPEN: {
      value: 'OPEN',
    },
    CLOSED: {
      value: 'CLOSED',
    },
  },
});

const StringRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'StringRange',
  fields: {
    startVal: {
      type: GraphQL.GraphQLString,
    },
    startType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
    endVal: {
      type: GraphQL.GraphQLString,
    },
    endType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
  },
});

const BooleanRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'BooleanRange',
  fields: {
    startVal: { type: GraphQL.GraphQLBoolean },
    startType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
    endVal: { type: GraphQL.GraphQLBoolean },
    endType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
  },
});

const FloatRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'FloatRange',
  fields: {
    startVal: { type: GraphQL.GraphQLFloat },
    startType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
    endVal: { type: GraphQL.GraphQLFloat },
    endType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
  },
});

const IntRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'IntRange',
  fields: {
    startVal: GraphQL.GraphQLInt,
    startType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
    endVal: GraphQL.GraphQLInt,
    endType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
  },
});

const IDRangeInput = new GraphQL.GraphQLInputObjectType({
  name: 'IDRange',
  fields: {
    startVal: {
      type: GraphQL.GraphQLID,
    },
    startType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
    },
    endVal: {
      type: GraphQL.GraphQLID,
    },
    endType: {
      type: IntervalType,
      default: IntervalType.CLOSED,
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
  name: 'Pagination',
  fields: PaginationFields,
});

const PaginationOutput = new GraphQL.GraphQLObjectType({
  name: 'PaginationOutput',
  fields: Object.assign({}, PaginationFields, {
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
  }),
});

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

const DateTimeFields = Object.assign({}, DateFields, {
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
});

const DateTimeOutput = new GraphQL.GraphQLObjectType({
  name: 'DateTimeOutput',
  fields: DateTimeFields,
});

const DateOutput = new GraphQL.GraphQLObjectType({
  name: 'DateOutput',
  fields: DateFields,
});

module.exports = {
  OrderDirectionInput,
  ErrorOutput,
  IntRangeInput,
  FloatRangeInput,
  StringRangeInput,
  BooleanRangeInput,
  IDRangeInput,
  PaginationInput,
  PaginationOutput,
  DateTimeOutput,
  DateOutput,
};

/*
module.exports = `
  
  enum OrderDirection {
    DESC
    ASC
  }
  
  enum intervalType {
    OPEN    # excludes endpoints 
    CLOSED  # includes endpoints 
  }

  type Date {
    year: Int
    month: Int
    date: Int
  }

  type DateTime {
    year: Int
    month: Int
    date: Int
    hour: Int
    minute: Int
    second: Int
  }
  
  input PaginationInput {
    page: Int = 1
    pageSize: Int = 10
  }
  
  input BooleanRange {
    startVal: Boolean 
    startType: intervalType = CLOSED 
    endVal: Boolean 
    endType: intervalType = CLOSED 
  }
  
  input FloatRange {
    startVal: Float 
    startType: intervalType = CLOSED 
    endVal: Float 
    endType: intervalType = CLOSED 
  }
  
  input IntRange {
    startVal: Int 
    startType: intervalType = CLOSED 
    endVal: Int 
    endType: intervalType = CLOSED 
  }

  input IntRange {
    startVal: Int 
    startType: intervalType = CLOSED 
    endVal: Int 
    endType: intervalType = CLOSED 
  }
  
  input IDRange {
    startVal: Int 
    startType: intervalType = CLOSED 
    endVal: Int 
    endType: intervalType = CLOSED 
  }

  input DateInput {
    year: Int
    month: Int
    date: Int
  }
  
  input DateInputRange {
    startVal: DateInput 
    startType: intervalType = CLOSED 
    endVal: DateInput 
    endType: intervalType = CLOSED 
  }

  input DateTimeInput {
    year: Int
    month: Int
    date: Int
    hour: Int
    minute: Int
    second: Int
  }

  input DateTimeInputRange {
    startVal: DateTimeInput 
    startType: intervalType = CLOSED 
    endVal: DateTimeInput 
    endType: intervalType = CLOSED 
  }

  input StringRangeInput {
    startVal: String 
    startType: intervalType = CLOSED 
    endVal: String 
    endType: intervalType = CLOSED 
  }
  
  type Pagination {
    page: Int
    pageSize: Int
    total: Int
    pages: Int
    isFirst: Boolean
    isLast: Boolean
    first: Int
    last: Int
    prev: Int
    next: Int
  }

  type ErrorItem {
    field: String
    message: String
  }

  type Error {
    message: String,
    errors: [
      ErrorItem 
    ]
  }
`;
*/
