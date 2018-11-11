import * as SimpleGitAsync from "simple-git";
import * as git from "simple-git/promise";

import { exec, ExecException, execFile, spawn } from "child_process";

import ExecLog from "./log/log";

import { Inject } from "typedi";

import { ILog, SpawnClose, SpawnHandle } from "./interfaces/git";

class Git {
	public dir: string;
	public logs: Map<string, ILog[]> = new Map();

	public branchLogs: Map<string, ILog[]> = new Map();
	private needReReload: boolean;
	private async: SimpleGitAsync.SimpleGitAsync;
	private branches: git.BranchSummary;
	private diffSummary: git.DiffResult;
	private gitMapStatus: Map<string, string> = new Map();

	@Inject(() => ExecLog)
	private logFactory: ExecLog;
	constructor(container) {
		this.dir = container.get("git-path");
		this.async = SimpleGitAsync(this.dir);
	}

	public needReStatus() {
		return this.needReReload;
	}

	public clearAfterAllCommit() {
		this.clearLogs();
		this.clearStatus();
	}

	public clearLogs() {
		this.logs.clear();
	}

	public runExec(cmd, cb) {
		exec(cmd, { cwd: this.dir }, cb);
	}

	public runExecFile(cmd: string[], cb) {
		execFile("git", cmd, { cwd: this.dir }, cb);
	}

	public switchBranch(bName: string, handle: SpawnHandle, close: SpawnClose) {
		const checkout = this.gitSpawn(["checkout", bName]);
		checkout.stdout.on("data", handle);
		checkout.stderr.on("data", handle);
		checkout.on("close", close);
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

	public getStatuMap() {
		return this.gitMapStatus;
	}

	public log(filePath, cb: (logs: ILog[], file: string) => void) {
		this.logFactory.execLogForFile(filePath, (out, fname) => {
			const output = out;
			this.logs.set(filePath, this.logFactory.makeMap(output));
			cb(this.logs.get(filePath), fname);
		});
	}

	public logBranch(cb: () => void) {
		this.logFactory.execLogForBranch(out => {
			const cur = this.getCurrentBranch();
			this.branchLogs.set(cur, this.logFactory.makeMap(out));
			cb();
		});
	}

	public checkoutChanges(fName, handle: SpawnHandle, close: SpawnClose) {
		const checkout = this.gitSpawn(["checkout", "--", fName]);
		checkout.stdout.on("data", handle);

		checkout.stderr.on("data", handle);
		checkout.on("close", close);
	}

	public clearLog(key) {
		if (this.gitMapStatus.has(key)) {
			this.logs.delete(key);
		}
	}

	public deleteKeyAfterCommit(key) {
		this.clearLog(key);
		this.removeFromStatusMap(key);
	}

	public deleteAllKeys() {
		this.gitMapStatus.clear();
		this.logs.clear();
	}

	public amend(message: string, handle: SpawnHandle, close: SpawnClose) {
		const amend = this.gitSpawn(["commit", "--amend", "--no-edit", "-m", message.substr(2, message.length)]);
		amend.stdout.on("data", handle);
		amend.stderr.on("data", handle);
		amend.on("close", close);
	}
	public rm(file: string, handle: SpawnHandle, close: SpawnClose) {
		const rm = this.gitSpawn(["rm", "--cached", file]);

		rm.stdout.on("data", handle);
		rm.stderr.on("data", handle);
		rm.on("close", close);
	}

	private gitSpawn(cmd: string[]) {
		return spawn("git", cmd, { cwd: this.dir });
	}
	private runCmd(cmd: ReadonlyArray<string>, cb: (err: ExecException, stdout: string) => void) {
		execFile("git", cmd, { cwd: this.dir }, cb);
	}

	private parseStatus(str: string) {
		const toLines = str.split("\n");
		toLines.pop();
		for (const line of toLines) {
			const s = line.split(" ").filter(empty => empty);
			const flag: string = s[0];
			const path = s[1];

			this.gitMapStatus.set(path, flag);
		}
	}
}
export default Git;
