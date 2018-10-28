import * as SimpleGitAsync from "simple-git";
import * as git from "simple-git/promise";

import { exec, ExecException, execFile, spawn } from "child_process";

import * as lupus from "lupus";

type SpawnHandle = (response: Buffer) => void;

type SpawnClose = (code: number) => void;

class Git {
	public dir: string;
	private needReReload: boolean;
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

	public needReStatus() {
		return this.needReReload;
	}

	public clearAfterAllCommit() {
		this.clearDiffs();
		this.clearStatus();
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

	public commitAllSpawn(message: string, handle: SpawnHandle, close: SpawnClose) {
		const commit = this.gitSpawn(["commit", "-m", `${message}`]);
		commit.stdout.on("data", handle);
		commit.stderr.on("data", handle);
		commit.on("close", close);
	}

	public commitFile(message: string, fileName: string, handle: SpawnHandle, close: SpawnClose) {
		const commit = this.gitSpawn(["commit", "-m", `${message}`, fileName]);
		commit.stdout.on("data", handle);
		commit.stderr.on("data", handle);
		commit.on("close", close);
	}

	public pullNoArgs(handle: SpawnHandle, close: SpawnClose) {
		const pull = this.gitSpawn(["pull"]);
		pull.stdout.on("data", handle);
		pull.stderr.on("data", handle);
		pull.on("close", close);
	}

	public pull(value: string, handle: SpawnHandle, close: SpawnClose) {
		const pull = this.gitSpawn(["pull", ...value.split(" ")]);
		pull.stdout.on("data", handle);
		pull.stderr.on("data", handle);
		pull.on("close", close);
	}

	public pushNoArgs(handleErr: SpawnHandle, close: SpawnClose) {
		const { current } = this.branches;
		const push = this.gitSpawn(["push", "origin", current]);
		push.stderr.on("data", handleErr);
		push.on("close", close);
	}

	public push(value: string, handle: SpawnHandle, close: SpawnClose) {
		const push = this.gitSpawn(["push", ...value.split(" ")]);
		push.stderr.on("data", handle);
		push.on("close", close);
	}
	public asyncDiff(cb) {
		this.async.diff(cb);
	}

	public status(cb: () => void) {
		this.runCmd(["status", "--porcelain"], (err, out) => {
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

	public merge(branchName, handle: SpawnHandle, close: SpawnClose) {
		const merge = this.gitSpawn(["merge", branchName]);
		merge.stdout.on("data", handle);

		merge.stderr.on("data", handle);
		merge.on("close", close);
	}

	public newBranch(branchName, handle: SpawnHandle, close: SpawnClose) {
		const checkout = this.gitSpawn(["checkout", "-b", branchName]);
		checkout.stdout.on("data", handle);
		checkout.stderr.on("data", handle);
		checkout.on("close", close);
	}

	public deleteBranch(branchName, handle: SpawnHandle, close: SpawnClose) {
		const del = this.gitSpawn(["branch", "-D", branchName]);
		del.stdout.on("data", handle);
		del.stderr.on("data", handle);
		del.on("close", close);
	}

	public removeFromStatusMap(item: string) {
		if (this.gitMapStatus.has(item)) {
			this.gitMapStatus.delete(item);
		}
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
	private gitSpawn(cmd: string[]) {
		return spawn("git", cmd, { cwd: this.dir });
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

			if (flag.length > 1) {
				this.needReReload = true;
			}

			this.gitMapStatus.set(path, flag);
		}
	}
}

export default Git;
