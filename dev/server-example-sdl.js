const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const GraphQLTools = require('graphql-tools');
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
    job_id: 1,
    given_name: 'Walt',
    family_name: 'Whitman',
  },
  {
    id: 2,
    job_id: 1,
    given_name: 'Ezra',
    family_name: 'Pound',
  },
  {
    id: 3,
    job_id: 2,
    given_name: 'John',
    family_name: 'Steinbeck',
  },
];

const jobs = [
  {
    id: 1,
    title: 'Poet',
  },
  {
    id: 2,
    title: 'Novelist',
  },
];

const schemaSdl = `
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
   persons(id: Int): PersonList 
 }
 type JobList {
   docs: [Job] 
 }
 type Query {
   person(id: Int): Person 
   persons(id: Int): PersonList 
   job(id: Int): Job
   jobs(id: Int): JobList
 }
`;

const resolvers = {
  Person: {
    job(parent, { id }) {
      log.info('job parent', parent);
      return { docs: jobs.filter(find(id)) };
    },
  },
  Job: {
    persons(parent, { id }) {
      log.info('persons parent', parent);
      return { docs: jobs.filter(find(id)) };
    },
  },
  Query: {
    person(_, { id }) {
      return persons.find(find(id));
    },
    persons(_, { id }) {
      return persons.filter(filter(id));
    },
    job(_, { id }) {
      log.info(id);
      return jobs.find(find(id));
    },
    jobs(_, { id }) {
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
