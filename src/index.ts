#!/usr/bin/env node
import "reflect-metadata";
import preFn from "./fn/preRun";
import { ICliOptions } from "./interfaces/cli";
const argv: ICliOptions = require("minimist")(process.argv.slice(2));

const [gitPath] = argv._;
if (argv.version) {
	console.log(require("../package.json").version);
	process.exit();
}

if (argv.help) {
	console.log(`
	--version, -v  - Current version
	--terminal - Set the encode for the terminal
	--help - To get the help
	`);
	process.exit();
}

if (gitPath) {
	preFn(gitPath, argv);
} else {
	console.log("Please, choose git repository path");
}
