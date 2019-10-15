const uuidv4 = require(`uuid/v4`);

const {
  makeRemoteExecutableSchema,
  introspectSchema,
  transformSchema,
  mergeSchemas,
  RenameTypes
} = require(`graphql-tools`);

const fetch = require(`node-fetch`);
const { createHttpLink } = require(`apollo-link-http`);

const {
  NamespaceUnderFieldTransform,
  StripNonQueryTransform
} = require(`./transforms`);

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  options
) => {
  const { addThirdPartySchema, createNode } = actions;
  const { typeName, fieldName, paramName, sources } = options;

  const schemas = {};

  for (const { url, key, headers = {}, fetchOptions = {} } of sources) {
    const link = createHttpLink({
      uri: url,
      fetch,
      headers,
      fetchOptions
    });

    const remoteSchema = makeRemoteExecutableSchema({
      schema: await introspectSchema(link),
      link
    });

    const nodeId = createNodeId(
      `gatsby-source-graphql-multiple-${typeName}-${key}`
    );

    const node = createSchemaNode({
      id: nodeId,
      typeName,
      fieldName,
      paramName,
      paramValue: key,
      createContentDigest
    });

    createNode(node);

    const resolver = (parent, args, context) => {
      context.nodeModel.createPageDependency({ path: context.path, nodeId });
      return {};
    };

    schemas[key] = transformSchema(remoteSchema, [
      new StripNonQueryTransform(),
      new RenameTypes(name => `${typeName}_${name}`),
      new NamespaceUnderFieldTransform({
        typeName,
        fieldName,
        paramName,
        resolver
      })
    ]);
  }

  const merged = mergeSchemas({
    schemas: Object.values(schemas),
    resolvers: {
      Query: {
        [fieldName]: {
          resolve: (parent, args, context, info) => {
            const key = args[paramName];
            const schema = schemas[key];

            if (!schema) {
              return {};
            }

            return info.mergeInfo.delegateToSchema({
              schema,
              operation: "query",
              fieldName,
              args: {
                [paramName]: key
              },
              context,
              info
            });
          }
        }
      }
    }
  });

  addThirdPartySchema({ schema: merged });
};

function createSchemaNode({
  id,
  typeName,
  fieldName,
  paramName,
  paramValue,
  createContentDigest
}) {
  const nodeContent = uuidv4();
  const nodeContentDigest = createContentDigest(nodeContent);
  return {
    id,
    typeName: typeName,
    fieldName: fieldName,
    [paramName]: paramValue,
    parent: null,
    children: [],
    internal: {
      type: `GraphQLMultipleSource`,
      contentDigest: nodeContentDigest,
      ignoreType: true
    }
  };
}
