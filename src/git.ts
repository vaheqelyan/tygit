import * as SimpleGitAsync from "simple-git";
import * as git from "simple-git/promise";

import { exec, ExecException, execFile, spawn } from "child_process";

import * as lupus from "lupus";

class Git {
	private dir: string;
	private gitStatus: git.StatusResult;
	private async: SimpleGitAsync.SimpleGitAsync;
	private branches: git.BranchSummary;
	private diffSummary: git.DiffResult;
	private diffs: Map<string, string> = new Map();
	private gitMapStatus: Map<string, string> = new Map();
	constructor(container) {
		this.dir = container.get("git-path");
		this.async = SimpleGitAsync(this.dir);
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

	public startDiffing(observerCallback: (fnam: string) => void) {
		const keys = Array.from(this.diffs.keys());
		if (keys.length > 0) {
			lupus(0, keys.length, n => {
				const filePath = keys[n];
				const getFlag = this.gitMapStatus.get(filePath);
				this.runDiff(getFlag.length > 1 ? "" : "HEAD", filePath, data => {
					this.diffs.set(filePath, data);
					observerCallback(filePath);
				});
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

	public clearStatus() {
		this.gitMapStatus.clear();
	}

	public clearUntracked() {
		this.gitMapStatus.clear();
		for (const [key, value] of this.gitMapStatus) {
			if (value === "??") {
				this.gitMapStatus.delete(key);
			}
		}
	}

	public getAllBranches() {
		return this.branches.all;
	}

	public getCurrentBranch(): string {
		return this.branches.current;
	}

	public setCurrentBracnh(bName: string) {
		this.branches.current = bName;
	}

	public getDiffSummary(): git.DiffResult {
		return this.diffSummary;
	}

	public getDiffs() {
		return this.diffs;
	}

	public getStatuMap() {
		return this.gitMapStatus;
	}
	private runCmd(cmd: ReadonlyArray<string>, cb: (err: ExecException, stdout: string) => void) {
		execFile("git", cmd, { cwd: this.dir }, cb);
	}

	private runDiff(isHead: string, filePath: string, cb: (data: string) => void) {
		exec(
			`git diff --color ${isHead} ${filePath} | sed -r "s/^([^-+ ]*)[-+ ]/\\1/" | less -r`,
			{ cwd: this.dir },
			(err, data) => {
				if (err) {
					console.log(err);
					return;
				}
				cb(data);
			},
		);
	}
	private parseStatus(str: string) {
		const toLines = str.split("\n");
		toLines.pop();
		for (const line of toLines) {
			const s = line.split(" ").filter(empty => empty);
			const flag: string = s[0];
			const path = s[1];

			if (flag !== "A" && flag !== "D" && flag !== "DD" && flag !== "??" && flag !== "AD") {
				this.diffs.set(path, "");
			}

			this.gitMapStatus.set(path, flag);
		}
	}
}

export default Git;
