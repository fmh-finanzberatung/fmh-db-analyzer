const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const GraphQLTools = require('graphql-tools');
const graphqlCommonSDLTypes = require('../lib/graphql-common-sdl-types.js');
const log = require('mk-log');
const app = express();
const port = 3010;

function find(id) {
  return (item) => {
    if (!id) return true;
    return id === item.id;
  };
}

function filter(id) {
  return (item) => {
    log.info(item);
    if (!id) return true;
    return id === item.id;
  };
}

const persons = [
  {
    id: 1,
    born_at: new Date(Date.UTC(2000, 0, 12, 12, 30, 111)),
    created_at: new Date(Date.UTC(2020, 0, 12, 12, 30, 111)),
    updated_at: new Date(Date.UTC(2020, 0, 12, 12, 30, 111)),
    job_id: 1,
    given_name: 'Walt',
    family_name: 'Whitman',
  },
  {
    id: 2,
    born_at: new Date(Date.UTC(2000, 0, 12, 12, 30, 111)),
    created_at: new Date(Date.UTC(2020, 0, 12, 12, 30, 111)),
    updated_at: new Date(Date.UTC(2020, 0, 12, 12, 30, 111)),
    job_id: 1,
    given_name: 'Ezra',
    family_name: 'Pound',
  },
  {
    id: 3,
    born_at: new Date(Date.UTC(2000, 0, 12, 12, 30, 111)),
    created_at: new Date(Date.UTC(2020, 0, 12, 12, 30, 111)),
    updated_at: new Date(Date.UTC(2020, 0, 12, 12, 30, 111)),
    job_id: 2,
    given_name: 'John',
    family_name: 'Steinbeck',
  },
];

const jobs = [
  {
    id: 1,
    started_at: new Date(Date.UTC(2019, 0, 12, 12, 30, 111)),
    created_at: new Date(Date.UTC(2019, 0, 12, 12, 30, 111)),
    updated_at: new Date(Date.UTC(2019, 0, 12, 12, 30, 111)),
    title: 'Poet',
  },
  {
    id: 2,
    started_at: new Date(Date.UTC(2019, 0, 12, 12, 30, 111)),
    created_at: new Date(Date.UTC(2019, 0, 12, 12, 30, 111)),
    updated_at: new Date(Date.UTC(2019, 0, 12, 12, 30, 111)),
    title: 'Novelist',
  },
];

const schemaSdl = `

${graphqlCommonSDLTypes}

input PersonRangeInput {
  job_id: IntRangeInput 
  given_name: StringRangeInput 
  family_name: StringRangeInput
}

input JobRangeInput {
  title: StringRangeInput 
}

input PersonOrderInput {
  given_name: OrderDirection = ASC 
  family_name: OrderDirection = ASC 
}

input JobOrderInput {
  title: OrderDirection 
}

type Person {
 id: Int
 given_name: String
 family_name: String
 job: Job
}

type PersonList {
  id: Int
  given_name: String
  family_name: String
  docs: [Person] 
}

type Job {
  id: Int
  title: String
  persons(id: Int, order: PersonOrderInput, range: PersonRangeInput): PersonList 
}

type JobList {
  docs: [Job] 
}

type Query {
  person(id: Int order: PersonOrderInput): Person 
  persons(id: Int order: PersonOrderInput range: PersonRangeInput): PersonList 
  job(id: Int order: JobOrderInput): Job
  jobs(id: Int order: JobOrderInput range: JobRangeInput): JobList
}
`;

const resolvers = {
  Person: {
    job(parent, { id, order}) {
      log.info('job parent', parent);
      return { docs: jobs.filter(find(id)) };
    },
  },
  Job: {
    persons(parent, { id, order, range }) {
      log.info('persons parent', parent);
      return { docs: jobs.filter(find(id)) };
    },
  },
  Query: {
    person(_, { id, order}) {
      return persons.find(find(id));
    },
    persons(_, { id, order, range }) {
      return persons.filter(filter(id));
    },
    job(_, { id, order }) {
      log.info(id);
      return jobs.find(find(id));
    },
    jobs(_, { id, order, range }) {
      log.info(id);
      return { docs: jobs.filter(filter(id)) };
    },
  },
};

const schema = GraphQLTools.makeExecutableSchema({
  typeDefs: schemaSdl,
  resolvers,
});

app.get('/favicon.ico', (req, res) => {
  return res.status(200).send('');
});

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

app.listen(port, () => {
  log.info(`Server listening on port ${port}`);
});
