/** 
deny person entirely
{
  Person: {
    deny: true,
  },
}


deny all mutations for person
deny queries on field created at for person
{
  Person: {
    {
      query: {
        created_at: {
          deny: true;
        }
      }
    },
    {
      mutation {
        deny: true;
      }
    }

  }
}
*/

const config = {
  Person: {
    query: {
      public: {
        created_at: {
          deny: true,
        },
      },
    },
    mutation: {},
  },
  PersonList: {
    query: {
      deny: true,
      public: {
        created_at: {
          deny: true,
        },
      },
    },
    mutation: {},
  },
};

export default config;
