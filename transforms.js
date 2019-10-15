const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLNonNull
} = require(`gatsby/graphql`);

const {
  visitSchema,
  VisitSchemaKind
} = require(`graphql-tools/dist/transforms/visitSchema`);

const {
  createResolveType,
  fieldMapToFieldConfigMap
} = require(`graphql-tools/dist/stitching/schemaRecreation`);

class NamespaceUnderFieldTransform {
  constructor({ typeName, fieldName, paramName, resolver }) {
    this.typeName = typeName;
    this.fieldName = fieldName;
    this.paramName = paramName;
    this.resolver = resolver;
  }

  transformSchema(schema) {
    const query = schema.getQueryType();
    let newQuery;

    const nestedType = new GraphQLObjectType({
      name: this.typeName,
      fields: () =>
        fieldMapToFieldConfigMap(
          query.getFields(),
          createResolveType(typeName => {
            if (typeName === query.name) {
              return newQuery;
            } else {
              return schema.getType(typeName);
            }
          }),
          true
        )
    });

    newQuery = new GraphQLObjectType({
      name: query.name,
      fields: {
        [this.fieldName]: {
          type: nestedType,
          args: {
            [this.paramName]: {
              type: new GraphQLNonNull(GraphQLString)
            }
          },
          resolve: (parent, args, context, info) => {
            if (this.resolver) {
              return this.resolver(parent, args, context, info);
            } else {
              return {};
            }
          }
        }
      }
    });

    const typeMap = schema.getTypeMap();
    const allTypes = Object.keys(typeMap)
      .filter(name => name !== query.name)
      .map(key => typeMap[key]);

    return new GraphQLSchema({
      query: newQuery,
      types: allTypes
    });
  }
}

class StripNonQueryTransform {
  transformSchema(schema) {
    return visitSchema(schema, {
      [VisitSchemaKind.MUTATION]() {
        return null;
      },
      [VisitSchemaKind.SUBSCRIPTION]() {
        return null;
      }
    });
  }
}

module.exports = {
  NamespaceUnderFieldTransform,
  StripNonQueryTransform
};
