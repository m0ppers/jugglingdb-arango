## JugglingDB-Arango

Arango adapter for jugglingdb.

[<img src="https://secure.travis-ci.org/m0ppers/jugglingdb-arango.png" />](http://travis-ci.org/#!/m0ppers/jugglingdb-arango)

## Usage

1. Setup dependencies in `package.json`:

```bash
npm install --save jugglingdb-arango
```

2. Use:

    ```javascript
        var Schema = require('jugglingdb').Schema;
        var schema = new Schema('arango');
    ```

## Running tests

Make sure you have arango server running on default port, then run

    docker run -p 8529:8529 -e ARANGO_NO_AUTH=1 -d --name arangodb-instance -d arangodb/arangodb
    export ARANGO_HOST=`docker-machine ip your-docker-machine-name`
    npm test

## MIT License

    Copyright (C) 2012-2016 by Andreas Streichardt
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

