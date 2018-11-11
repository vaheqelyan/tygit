import { Container } from "typedi";

import { existsSync, readdirSync } from "fs";
import { ICliOptions } from "../interfaces/cli";
import Screen from "../screen";

export default function preFn(gitPath: string, { terminal }: ICliOptions) {
	if (existsSync(gitPath)) {
		const dirArray = readdirSync(gitPath);
		if (dirArray.indexOf(".git") !== -1) {
			const getTerm = terminal ? terminal : null;

			if (typeof getTerm === "boolean") {
				console.log("Please set the type of terminal encoding");
			} else {
				Container.set("terminal", getTerm);
				Container.set("git-path", gitPath);
				Container.set("terminal-size", { width: process.stdout.columns, height: process.stdout.rows });
				const sc = Container.get(Screen);
				sc.initStateAndRender();
			}
		} else {
			console.log("This is not a git repository");
		}
	} else {
		console.log("The path is not correct");
	}
}
