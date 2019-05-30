# Instagram Panel

Presser.io is an effort to rewrite some of Twitter's functionality using modern
javascript based toolchain. It was mostly an effort to learn Node.js and trying to reverse
engineer some of twitter's feature.

It has support for listing instagram post with like and commaent


## Prerequisites

You are required to have Node.js and MongoDB installed if you'd like to run the app locally.

- [Node.js](http://nodejs.org)
- [Mongodb](http://docs.mongodb.org/manual/installation/)

```
npm install
nodemon . OR node index.js

```

The configuration is in `config/config.js`. Please create your own

```js
var path = require('path'),
    rootPath = path.normalize(__dirname + '/..');
module.exports = {
  production: {
    db: '',
    root: rootPath,
    app: {
      name: 'Presser.io'
    }
  }
};
```

## Usage

```sh
# First install all the project dependencies.
# run mongodb server
~/ mongod

Express app started on port 8080
```