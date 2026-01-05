# @autograder/config

Shared ESLint and Prettier configurations for the AutoGrader Platform monorepo.

## Usage

### ESLint

**For Next.js apps:**

```js
// .eslintrc.js
module.exports = {
  extends: ['@autograder/config/eslint-next'],
};
```

**For NestJS/Node apps:**

```js
// .eslintrc.js
module.exports = {
  extends: ['@autograder/config/eslint-nest'],
};
```

**For other TypeScript projects:**

```js
// .eslintrc.js
module.exports = {
  extends: ['@autograder/config/eslint-base'],
};
```

### Prettier

```js
// prettier.config.js
module.exports = require('@autograder/config/prettier');
```
