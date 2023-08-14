function NodeTypeBuilder(graphNode) {
  const type = new GraphQL.GraphQLObjectType({
    name: 'Person',
    description: '',
    fields: () => outputFields,
  });

  return type;
}
