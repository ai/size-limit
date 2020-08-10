#!/bin/bash

file_path="node-warnings.logs"
cat /dev/null > $file_path
node --redirect-warnings=$file_path packages/size-limit/test/max-listeners-test.js

if grep -q MaxListenersExceededWarning "$file_path"; then
  echo "Possible EventEmitter memory leak detected"
  exit 1
fi
