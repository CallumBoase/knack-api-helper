LATEST BUILD INSTRUCTIONS
Make all changes to code
$ npm run build //To package the browser.js file
update package.json with new version number
$ git add .
$ git commit -a -m "Prep for versoin release x.x.x"
$ git push origin
$ npm publish
$ git tag X.X.X //Tags the current version in github
$ git push origin X.X.X //Pushes the tag to github

This repo is published on NPM under knack-api-helper

# WHAT DOES THE BROWSERIFY BUILD COMMAND MEAN?
browserify --ignore node-fetch --standalone KnackAPI knack-api-helper.js > browser.js

1. Run browserify

2. Ignore node-fetch (ie don't bundle node-fetch into the bundle)
We ignore node-fetch because this emulates the native fetch() API in browser for nodeJS, so it would be pointless to provide this to the browser
node-fetch is used in the dependency of knack-api-helper: @callum.boase/fetch

3.--standalone KnackAPI
This makes module.exports = KnackAPI available outside the browserify bundled code in the global scope of browser javascript.
Without this, it would say KnackAPI is not defined if you try to use new KnackAPI()

4. knack-api-helper.js > browser.js
This means that the source file is knack-api-helper (and all it's dependencies) and the target file for bundled code is browser.js

Other useful notes:
https://medium.com/@gaute.meek/how-to-publish-a-js-library-to-npm-and-cdn-9d0bf9b48e11 

09/06/22
On Callum's machine, I've done node-link to publish this as locally as a global package as per https://www.youtube.com/watch?v=ooWJMd_1WjU
Now on this machine, I can test this package straight away without publishing to NPM and going through that whole process
Install in other local apps via command: node-link knack-api-helper

I've also set up netlify to publish new github commits to main branch. This way, we can lazyLoad this into Knack apps from netlify
instead of doing it via NPM
The direct link to latest deployed Netlify version of this library is https://knack-api-tester.netlify.app/KnackAPI.js


