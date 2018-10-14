import * as SimpleGitAsync from "simple-git";
import * as git from "simple-git/promise";

import { ExecException, execFile, spawn } from "child_process";

import * as lupus from "lupus";

class Git {
	public dir: string;
	public gitStatus: git.StatusResult;
	public async: SimpleGitAsync.SimpleGitAsync;
	public branches: git.BranchSummary = { all: [], detached: false, current: "", branches: {} };
	public g: git.SimpleGit;
	public diffSummary: git.DiffResult = null;
	public diffs: Map<string, string> = new Map();
	public gitMapStatus: Map<string, string> = new Map();
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

	public isNeedDiff(): boolean {
		return this.gitStatus.modified.length > 0 || this.gitStatus.conflicted.length > 0;
	}

	public parseDiff(diff: string) {
		const lines = diff.split("\n");
		lines.forEach((value, index) => {
			const [firstLetter] = value;

			switch (firstLetter) {
				case "+":
					lines[index] = `{bold}{green-fg}${value}{/green-fg}{/bold}`;
					break;

				case "-":
					lines[index] = `{bold}{red-fg}${value}{/red-fg}{/bold}`;
					break;
				case "@":
					lines[index] = `{bold}{cyan-fg}${value}{/cyan-fg}{/bold}`;
					break;
			}
		});
		return lines.join("\n");
	}

	public startDiffing(observerCallback: (fnam: string) => void) {
		const keys = Array.from(this.diffs.keys());
		if (keys.length > 0) {
			lupus(0, keys.length, n => {
				const filePath = keys[n];
				const getFlag = this.gitMapStatus.get(filePath);
				if (getFlag.length > 1) {
					this.runCmd(["diff", "--no-color", filePath], (err, out) => {
						if (err) {
							console.log(err);
						}
						this.diffs.set(filePath, this.parseDiff(out));
						observerCallback(filePath);
					});
				} else {
					this.runCmd(["diff", "--no-color", "HEAD", filePath], (err, out) => {
						if (err) {
							console.log(err);
						}
						this.diffs.set(filePath, this.parseDiff(out));
						observerCallback(filePath);
					});
				}
			});
		}
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
		this.gitMapStatus.clear();
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
		this.runCmd(["commit", "-m", `${message}`], err => {
			if (err) {
				handleExecError(err.message.toString());
				return;
			}
			handleExec();
		});
	}

	public commitFile(message: string, fileName: string, handleExec: () => void, handleExecError: (err: string) => void) {
		this.runCmd(["commit", "-m", `${message}`, fileName], err => {
			if (err) {
				handleExecError(err.message.toString());
				return;
			}
			handleExec();
		});
	}

	public pullNoArgs(handleExec: (data: Buffer) => void, onClose: (code: any) => void) {
		const pull = spawn("git", ["pull"], { cwd: this.dir });
		pull.stdout.on("data", handleExec);
		pull.on("close", onClose);
	}
	public pull(value: string, handleExec: (data: Buffer) => void, onClose: (code: any) => void) {
		const pull = spawn("git", ["pull", ...value.split(" ")], { cwd: this.dir });
		pull.stdout.on("data", handleExec);
		pull.on("close", onClose);
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
	public parseStatus(str: string) {
		const toLines = str.split("\n");
		toLines.pop();
		for (const line of toLines) {
			const s = line.split(" ").filter(empty => empty);
			const flag: string = s[0];
			const path = s[1];

			if (flag !== "A" && flag !== "D" && flag !== "DD" && flag !== "??") {
				this.diffs.set(path, "");
			}

			this.gitMapStatus.set(path, flag);
		}
	}

	public status(cb: () => void) {
		this.runCmd(["status", "--short"], (err, out) => {
			if (err) {
				console.log(err);
			}
			if (out.length > 0) {
				this.parseStatus(out);
				cb();
			} else {
				cb();
			}
		});
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

	public removeFromStatusMap(item) {
		this.gitMapStatus.delete(item);
	}
}

export default Git;
