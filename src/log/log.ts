import { Inject } from "typedi";
import Git from "../git";
import { ILog } from "../interfaces/git";
import Status from "../status";
import LogWidget from "./logWidget";

export default class ExecLog {
	@Inject(() => Git)
	private gitFactory: Git;

	@Inject(() => LogWidget)
	private logWidgetFactory: LogWidget;

	@Inject(() => Status)
	private statusFactory: Status;

	public execLog(filePath: string, cb: (stdout: string, fname?: string) => void) {
		this.gitFactory.runExec(
			`git log -35 --color --pretty=format:"%h %d %s - %Cgreen(%cr) %C(bold blue)<%an>%Creset" ${filePath}`,
			(err, stdout) => {
				if (err) {
					console.error(err);
					return;
				}
				if (filePath.length === 0) {
					cb(stdout);
				} else {
					cb(stdout, filePath);
				}
			},
		);
	}

	public execLogForFile(filePath, cb: (stdout: string, fname?: string) => void) {
		this.execLog(filePath, cb);
	}

	public execLogForBranch(cb: (stdout: string) => void) {
		this.execLog("", cb);
	}

	public removeHash(str): string {
		return str.substr(str.indexOf(" ") + 1);
	}

	public extractHash(str: string): string {
		return str.substr(0, str.indexOf(" "));
	}

	public makeMap(output: string): ILog[] {
		return output.split("\n").map(val => {
			return {
				hash: this.extractHash(val),
				message: this.removeHash(val).trim(),
			};
		});
	}

	public getHashFromLogMap(): string {
		const { logWidgetFactory } = this;

		const getStatusSelected = this.statusFactory.getSelectedFileName();

		const logArray = this.gitFactory.logs.get(getStatusSelected);
		// @ts-ignore
		const getListItemIndex = logWidgetFactory.getElement().getItemIndex(logWidgetFactory.getItemText());

		return logArray[getListItemIndex].hash;
	}

	public getStats() {
		const { logWidgetFactory } = this;

		const getStatusSelected = this.statusFactory.getSelectedFileName();

		const logArray = this.gitFactory.logs.get(getStatusSelected);
		// @ts-ignore
		const getListItemIndex = logWidgetFactory.getElement().getItemIndex(logWidgetFactory.getItemText());

		const getAfterChar = logArray[getListItemIndex].message.split("-");
		return getAfterChar[getAfterChar.length - 1];
	}

	public bgetStats() {
		const { logWidgetFactory } = this;
		const getCurrentBranchName = this.gitFactory.getCurrentBranch();
		const logArray = this.gitFactory.branchLogs.get(getCurrentBranchName);

		// @ts-ignore
		const getListItemIndex = logWidgetFactory.getElement().getItemIndex(logWidgetFactory.getItemText());

		const getAfterChar = logArray[getListItemIndex].message.split("-");
		return getAfterChar[getAfterChar.length - 1];
	}

	public getHashFromBranchLogMap(): string {
		const { logWidgetFactory } = this;
		const getCurrentBranchName = this.gitFactory.getCurrentBranch();
		const logArray = this.gitFactory.branchLogs.get(getCurrentBranchName);

		// @ts-ignore
		const getListItemIndex = logWidgetFactory.getElement().getItemIndex(logWidgetFactory.getItemText());

		return logArray[getListItemIndex].hash;
	}
}
