# gatsby-source-graphql-multiple

Gatsby source plugin that exposes multiple GraphQL endpoints as a single merged schema. This plugin is based on the [`gatsby-source-graphql`](https://github.com/sanderploegsma/gatsby/tree/master/packages/gatsby-source-graphql) plugin.

## Installation

To install this plugin, add the following line to your `.npmrc` file (add it to the root of your repo if it doesn't exist):

    @xebiastudio:registry=https://npm.pkg.github.com

Then, you can install it like any other package:

    npm install --save @xebiastudio/gatsby-source-graphql-multiple
    
:warning: Note: to use Yarn you have to do some extra steps, see [this issue](https://github.com/yarnpkg/yarn/issues/7552) for more information.

## Usage

To use this plugin, add the following to your Gatsby configuration:

```javascript
// gatsby-config.js
exports.plugins = [
  {
    resolve: `@xebiastudio/gatsby-source-graphql-multiple`,
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

## Maintaining

### Publishing a new version
To publish a new version, update the `version` inside `package.json` (or use `npm version major|minor|patch`), commit the change and tag the commit with the new version number (use the format `vX.Y.Z`). Then, push your changes:

    git push --tags

Whenever a new tag is created, Github Actions will automatically publish the new version to the Package Registry.
