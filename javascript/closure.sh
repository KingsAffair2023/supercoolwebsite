#!/bin/sh

uglifyjs -c -m -o ka.min.js --warn --keep-fnames --keep-fargs -b ascii_only=true -b beautify=false -- \
  fittext.js \
  Vec.js \
  OverscrollDetector.js \
  Animations.js \
  Dealer.js \
  CardFaceManager.js \
  GridManager.js \
  PopupManager.js \
  Countdown.js \
1> /dev/null
