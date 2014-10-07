#!/bin/bash

NW_HOME="/opt/node-webkit-v0.8.6-linux-x64"
APP_DIR="app"
BUILD_DIR="build"
DEST_APP_NAME="avroview"
FILES_TO_PACKAGE="*.html *.js *.css package.json vendors"

CWD=`pwd`
DEST_FILE="$BUILD_DIR/$DEST_APP_NAME"

function fatal {
  echo $1
  exit 1
}

test -x "$NW_HOME/nw" || fatal "Error: \`nw\` executable not found in $NW_HOME. Edit $0 file to specify the path where node-webkit pacjeges is located."

echo "Preparing to build app package..."

cd `dirname $0`
mkdir -p "$BUILD_DIR"
cd $APP_DIR
zip -qr "../$BUILD_DIR/app.nw" $FILES_TO_PACKAGE
cd ..
cat "$NW_HOME/nw" "./$BUILD_DIR/app.nw" > "./$DEST_FILE" && chmod +x "./$DEST_FILE"
cp "$NW_HOME/nw.pak" "./$BUILD_DIR/nw.pak"
rm "./$BUILD_DIR/app.nw"

cd "$CWD"
echo "Done. App is ready to run: ./$DEST_FILE"
