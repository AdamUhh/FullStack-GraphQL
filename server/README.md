"watch": "tsc -w", // Continuously watches and compiles the ts to js, much faster, inside the dist folder
"start": "node dist/index.js", // Executes the script inside /dist/
"devStart": "nodemon dist/index.js", //Continuously executes the script inside /dist/

"slowStart":"ts-node src/index.ts" // This is a slower way to compile and execute ts to js
