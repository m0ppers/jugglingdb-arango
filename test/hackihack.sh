#!/bin/sh
# hackihack until jugglingdb tests are more generic :O
sed -e "111s/mongodb/arango/g" node_modules/jugglingdb/test/common_test.js | sed -e "1377s/mongodb/arango/g" | sed -e "1386s/mongodb/arango/g" | sed -e "1392s/mongodb/arango/g" > node_modules/jugglingdb/test/common_test.js_new && cp node_modules/jugglingdb/test/common_test.js_new node_modules/jugglingdb/test/common_test.js
echo $?
echo "WATT?!"
cat node_modules/jugglingdb/test/common_test.js
