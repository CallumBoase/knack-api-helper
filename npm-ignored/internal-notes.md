This repo is published on NPM under knack-api-helper

To publish to NPM use command release-it 
Release-it is an npm package that is installed globally on Callum's machine
If using this on a different machine, install it globally too https://github.com/release-it/release-it
This will step you through the release including updating package.json, github tags & npm

To use command line to push to github use: git push origin main

To use the npm package as a CDN for front-end code: https://www.jsdelivr.com/?docs=gh
https://cdn.jsdelivr.net/npm/knack-api-helper@version/KnackAPI.js

Other useful notes:
https://medium.com/@gaute.meek/how-to-publish-a-js-library-to-npm-and-cdn-9d0bf9b48e11 

09/06/22
On Callum's machine, I've done node-link to publish this as locally as a global package as per https://www.youtube.com/watch?v=ooWJMd_1WjU
Now on this machine, I can test this package straight away without publishing to NPM and going through that whole process
Install in other local apps via command: node-link knack-api-helper

I've also set up netlify to publish new github commits to main branch. This way, we can lazyLoad this into Knack apps from netlify
instead of doing it via NPM
The direct link to latest deployed Netlify version of this library is https://knack-api-tester.netlify.app/KnackAPI.js


