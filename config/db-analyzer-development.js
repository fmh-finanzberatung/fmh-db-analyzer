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

module.exports = {
  /* 
  Person: {
    deny: true,
  },
  PersonList: {
    deny: true,
  },
  */
};
