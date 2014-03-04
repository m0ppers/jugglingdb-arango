#!/bin/sh
# hackihack until jugglingdb tests are more generic :O
sed -e "s/schema.name !== 'mongodb'/schema.name !== 'arango'/g" node_modules/jugglingdb/test/common_test.js > node_modules/jugglingdb/test/common_test.js_new && cp node_modules/jugglingdb/test/common_test.js_new node_modules/jugglingdb/test/common_test.js
