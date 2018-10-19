#!/usr/bin/env node
import "reflect-metadata";
import { ICliOptions } from "./interfaces/cli";

import { Container } from "typedi";
const argv: ICliOptions = require("minimist")(process.argv.slice(2));
import { exists, readdir } from "fs";
import Screen from "./screen";

const [gitPath] = argv._;
if (gitPath) {
	exists(gitPath, isExists => {
		if (isExists) {
			readdir(gitPath, (err, list) => {
				if (err) {
					console.error(err);
				}
				if (list.indexOf(".git") !== -1) {
					const getTerm = argv.terminal ? argv.terminal : null;
					if (typeof getTerm === "boolean") {
						console.log("Please set the type of terminal encoding");
					} else {
						Container.set("terminal", getTerm);
						Container.set("git-path", gitPath);
						const sc = Container.get(Screen);
						sc.initStateAndRender();
					}
				} else {
					console.log("This is not a git repository");
				}
			});
		} else {
			console.log("The path is not correct");
		}
	});
} else {
	console.log("Please, choose git repository path");
}
