import { Inject, Service } from "typedi";
import Git from "../git";
import { ILog } from "../interfaces/git";
import List from "../List";
import MSG from "../messages/statusBar";
import Status from "../status";
import StatusBar from "../statusBar";
import Log from "./log";

import * as copy from "clipboardy";

@Service()
export default class LogWidget extends List {
	@Inject(() => Git)
	private gitFactory: Git;

	@Inject(() => Status)
	private statusFactory: Status;

	@Inject(() => StatusBar)
	private statusBarFactory: StatusBar;

	@Inject(() => Log)
	private logFactory: Log;

	private view: "file" | "branch";

	public readForUi(logArray: ILog[]) {
		return logArray.map(({ message }) => {
			const b = message.split("-");
			return b.slice(0, b.length - 1).join("-");
		});
	}

	public onEnter = () => {
		let getHash;
		if (this.view === "branch") {
			getHash = this.logFactory.getHashFromBranchLogMap();
		} else {
			getHash = this.logFactory.getHashFromLogMap();
		}
		copy.write(getHash);
		this.statusBarFactory.toggleContent(MSG.COPIED);
	};

	public emptyList() {
		this.getElement().clearItems();
	}

	public logBranch = () => {
		this.view = "branch";
		const element = this.getElement();
		const logArray = this.gitFactory.branchLogs.get(this.gitFactory.getCurrentBranch());
		// @ts-ignore
		element.setItems(this.readForUi(logArray));
		element.select(0);

		this.setStatusBarOnFocus();

		this.screenFactory.screen.render();
	};

	public onSelect() {
		const { logFactory } = this;
		const res = this.view === "file" ? logFactory.getStats() : logFactory.bgetStats();
		this.statusBarFactory.setTitleAndRender(res);
	}

	public logOnFocus = () => {
		const selected = this.statusFactory.getSelectedFileName();
		if (selected) {
			const element = this.getElement();

			const getFlag = this.statusFactory.getFlag();
			if (!/(UD|UA|AA|DD|D|A|\?\?)/g.test(getFlag)) {
				if (!this.gitFactory.logs.has(selected)) {
					this.disable();
					this.view = "file";
					// @ts-ignore
					element.setItems(["Wait..."]);
					this.gitFactory.log(selected, this.observFn);
				} else {
					// @ts-ignore
					const getLogs = this.gitFactory.logs.get(selected);
					// @ts-ignore
					element.setItems(this.readForUi(getLogs));
					this.enable();
					element.select(0);
				}

				this.screenFactory.screen.render();
			} else {
				this.emptyList();
			}
		} else {
			this.emptyList();
		}
	};

	public reload = () => {
		this.screenFactory.updateFactory.updateLog(this.view);
	};
	public setStatusBarOnFocus() {
		const getText = this.getItemText();
		if (getText) {
			if (getText !== "Wait...") {
				if (this.view === "file") {
					this.statusBarFactory.setTitle(this.logFactory.getStats());
				} else {
					this.statusBarFactory.setTitle(this.logFactory.bgetStats());
				}
			}
		}
	}

	private observFn = (log: ILog[], file) => {
		const selected = this.statusFactory.getSelectedFileName();
		if (selected) {
			if (file === selected) {
				if (this.gitFactory.logs.has(file)) {
					const el = this.getElement();
					// @ts-ignore
					el.setItems(this.readForUi(log));
					this.enable();
					el.select(0);

					if (this.screenFactory.curElement === "Log") {
						this.setStatusBarOnFocus();
					}

					this.screenFactory.screen.render();
				}
			}
		}
	};
}
