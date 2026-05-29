#!/bin/bash

commit="$1"

git pull
if [[ "$commit" = "" ]]
then
  git add . && git commit -m "update" && git push
 else
  git add . && git commit -m "$commit" && git push
fi
