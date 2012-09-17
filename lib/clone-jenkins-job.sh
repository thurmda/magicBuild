#!/bin/bash
REPO='Buddy-Media-Local'
BRANCH='clone'
XML='temp.xml'

curl -X GET http://localhost:7080/job/$REPO-template/config.xml  | sed "s/BRANCH_NAME/$BRANCH/g" > "$XML"

curl -X POST -H "Content-Type: text/xml" --data-binary "@$XML" "http://localhost:7080/createItem?name=$REPO-$BRANCH"

rm $XML


