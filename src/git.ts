import * as SimpleGitAsync from "simple-git";
import * as git from "simple-git/promise";

import { ExecException, execFile, spawn } from "child_process";
import * as fuzzysearch from "fuzzysearch";

class Git {
	public dir: string;
	public gitStatus: git.StatusResult;
	public async: SimpleGitAsync.SimpleGitAsync;
	public branches: git.BranchSummary = { all: [], detached: false, current: "", branches: {} };
	public g: git.SimpleGit;
	public diffSummary: git.DiffResult = null;
	public diffs: Map<string, string> = new Map();
	public remoteList: any;
	public ex: any;
	constructor(container) {
		this.dir = container.get("git-path");
		this.g = git(this.dir);
		this.async = SimpleGitAsync(this.dir);
	}
	public runCmd(cmd: ReadonlyArray<string>, cb: (err: ExecException, stdout: string) => void) {
		execFile("git", cmd, { cwd: this.dir }, cb);
	}

	public switchBranch(bName: string, handleExec: () => void, handleExecError: (err: string) => void) {
		this.runCmd(["checkout", bName], err => {
			if (err) {
				handleExecError(err.message.toString());
				return;
			}
			handleExec();
		});
	}

	public prettyDiff(str: string) {
		const splitLines: string[] = str.split("\n");
		const key = [];

		for (let i = 0; i < splitLines.length; i++) {
			const line: string = splitLines[i];
			const firstLeter = line[0];
			const secondLetter = line[1];

			if (fuzzysearch("diff --git", line)) {
				const val = line.split(" ")[2];

				key.push(val.substr(2));
			}

			if (fuzzysearch("diff --cc", line)) {
				const val = line.split(" ")[2];
				key.push(val);
			}

			if (firstLeter === "-" || secondLetter === "-") {
				splitLines[i] = `{bold}{red-fg}${line}{/red-fg}{/bold}`;
			}

			if (firstLeter === "+" || secondLetter === "+") {
				splitLines[i] = `{bold}{green-fg}${line}{/green-fg}{/bold}`;
			}
			if (firstLeter === "@" || secondLetter === "@") {
				splitLines[i] = `{bold}{cyan-fg}${line}{/cyan-fg}{/bold}`;
			}
		}

		const res = splitLines
			.join("\n")
			.split("diff")
			.slice(1);

		for (let i = 0; i < key.length; i++) {
			this.diffs.set(key[i], res[i]);
		}
	}

	public isNeedDiff(): boolean {
		return this.gitStatus.modified.length > 0 || this.gitStatus.conflicted.length > 0;
	}

	public initStatus(cb) {
		this.async.status((err, data) => {
			if (err) {
				console.error(err);
			}
			this.gitStatus = data;
			cb();
		});
	}

	public initBranches(cb: () => void) {
		this.async.branch((err, data) => {
			if (err) {
				console.error(err);
			}
			this.branches = data;
			cb();
		});
	}

	public initDiffSummary(cb: () => void) {
		this.async.diffSummary((err, data) => {
			if (err) {
				console.error(err);
			}
			this.diffSummary = data;
			cb();
		});
	}

	public clearAfterCommmit() {
		this.gitStatus.modified.length = 0;
		this.gitStatus.created.length = 0;
		this.gitStatus.deleted.length = 0;
		this.gitStatus.conflicted.length = 0;
		this.gitStatus.renamed.length = 0;
	}

	public track(cb: (err: Error, data: any) => void) {
		this.async.add("./*", cb);
	}

	public clearDiffs() {
		this.diffs.clear();
	}
	public getFilesForCommit(): string[] {
		return [
			...this.gitStatus.modified,
			...this.gitStatus.created,
			...this.gitStatus.renamed,
			...this.gitStatus.conflicted,
			...this.gitStatus.deleted,
		];
	}

	public commit(message: string, handleExec: () => void, handleExecError: (err: string) => void) {
		this.runCmd(["commit", "-m", `"${message}"`], err => {
			if (err) {
				handleExecError(err.message.toString());
				return;
			}
			handleExec();
		});
	}

	public commitFile(message: string, fileName: string, handleExec: () => void, handleExecError: (err: string) => void) {
		this.runCmd(["commit", "-m", `"${message}"`, fileName], err => {
			if (err) {
				handleExecError(err.message.toString());
				return;
			}
			handleExec();
		});
	}

	public pullNoArgs(handleExec: () => void, handleExecError: (err: string) => void) {
		this.runCmd(["pull"], err => {
			if (err) {
				handleExecError(err.message.toString());
				return;
			}
			handleExec();
		});
	}
	public pull(value: string, handleExec: () => void, handleExecError: (err: string) => void) {
		this.runCmd(["pull", ...value.split(" ")], err => {
			if (err) {
				handleExecError(err.message.toString());
				return;
			}
			handleExec();
		});
	}

	public pushNoArgs(handleErr) {
		const { current } = this.branches;
		const ls = spawn("git", ["push", "origin", current], { cwd: this.dir });
		ls.stderr.on("data", handleErr);
	}

	public push(value, handle: (data: Buffer) => void) {
		const ls = spawn("git", ["push", ...value.split(" ")], { cwd: this.dir });
		ls.stderr.on("data", handle);
	}
	public asyncDiff(cb) {
		this.async.diff(cb);
	}

	public merge(branchName, handle: () => void, handleError: (err: string) => void) {
		this.runCmd(["merge", branchName], err => {
			if (err) {
				handleError(err.message.toString());
				return;
			}
			handle();
		});
	}

	public newBranch(branchName, handle: () => void, handleError: (err: string) => void) {
		this.runCmd(["checkout", "-b", branchName], err => {
			if (err) {
				handleError(err.message.toString());
				return;
			}

			this.branches.all.push(branchName);
			this.branches.current = branchName;

			handle();
		});
	}

	public deleteBranch(branchName, handle: () => void, handleError: (err: string) => void) {
		this.runCmd(["branch", "-D", branchName], err => {
			if (err) {
				handleError(err.message.toString());
				return;
			}

			this.branches.all.splice(branchName, 1);

			handle();
		});
	}
}

export default Git;
