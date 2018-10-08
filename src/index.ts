#!/usr/bin/env node
import "reflect-metadata";
import { Container } from "typedi";
const argv = require("minimist")(process.argv.slice(2));
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
					Container.set("git-path", gitPath);
					const sc = Container.get(Screen);
					sc.initStateAndRender();
					// sc.haha()
				} else {
					console.log("It is not a git repository.");
				}
			});
		} else {
			console.log("Path is not correct.");
		}
	});
} else {
	console.log("Please select the path of the git repository");
}
