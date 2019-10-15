# gatsby-source-graphql-multiple

Gatsby source plugin that exposes multiple GraphQL endpoints as a single merged schema. This plugin is based on the [`gatsby-source-graphql`](https://github.com/sanderploegsma/gatsby/tree/master/packages/gatsby-source-graphql) plugin.

## Usage

To use this plugin, add the following to your Gatsby configuration:

```javascript
// gatsby-config.js
exports.plugins = [
  {
    resolve: `gatsby-source-graphql-multiple`,
    options: {
      typeName: `MyCombinedSource`,
      fieldName: `myCombinedSource`,
      // The paramName will create a query parameter on myCombinedSource that determines which source to use
      // As an example, let's imagine that each source contains content in a specific language
      paramName: `language`,
      sources: [
        {
          key: `en`,
          url: `example.com/en/graphql`
        },
        {
          key: `fr`,
          url: `example.com/fr/graphql`
        }
      ]
    }
  }
];
```

This will allow you to query content in the following way:

```graphql
query GetContent($language: String!) {
  myCombinedSource(language: $language) {
    # This part of the query is delegated to the source with key === $language
    pages {
      nodes {
        slug
      }
    }
  }
}
```

## Example use cases

This plugin works well when you have more than one GraphQL source with the same schema, such as:

- When using WPGraphQL on a WordPress site that is using the MultiSite plugin
- When using multiple Contentful spaces with the same content model (when using space-level localization as mentioned [here](https://www.contentful.com/developers/docs/concepts/locales/))
