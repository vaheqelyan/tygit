import { Inject } from "typedi";

import Branches from "./branch";
import Git from "./git";
import LogWidget from "./log/logWidget";
import MSG from "./messages/statusBar";
import Screen from "./screen";
import Status from "./status";
import StatusBar from "./statusBar";

class Update {
	@Inject() private statusFactory: Status;
	@Inject(() => Screen)
	private screenFactory: Screen;
	@Inject() private gitFactory: Git;
	@Inject() private statusBarFactory: StatusBar;

	@Inject() private brancFactory: Branches;
	@Inject() private logFactory: LogWidget;

	public uStatus(cb: () => void) {
		this.gitFactory.status(() => {
			this.statusFactory.reload();
			cb();
		});
	}

	public uBranch() {
		this.gitFactory.initBranches(() => {
			this.brancFactory.reload();
		});
	}

	public uDiffSummary() {
		this.gitFactory.initDiffSummary();
	}

	public uLog() {
		this.logFactory.logOnFocus();
	}

	public updateAfterCommit() {
		this.gitFactory.deleteAllKeys();

		this.uStatus(() => {
			this.screenFactory.screen.render();

			this.uLog();
		});

		this.uDiffSummary();
	}
	public updateAfterSingleCommit() {
		const fName = this.statusFactory.getSelectedFileName();

		if (fName) {
			const flag = this.statusFactory.getFlag();

			this.gitFactory.deleteKeyAfterCommit(fName);

			this.uStatus(() => {
				this.screenFactory.screen.render();
				this.uLog();
			});

			if (!/(A|\?\?)/g.test(flag)) {
				this.uDiffSummary();
			}
		}
	}

	public updateAfterCheckout(fName) {
		this.gitFactory.deleteKeyAfterCommit(fName);
		this.uStatus(() => {
			this.screenFactory.screen.render();
			this.uLog();
		});
	}

	public updateAfterTrack() {
		this.uStatus(() => {
			this.screenFactory.screen.render();

			this.uLog();
		});
	}

	public reloadStatus() {
		this.gitFactory.deleteAllKeys();
		this.statusBarFactory.setTitleAndRender(MSG.RELOAD);
		this.uStatus(() => {
			this.screenFactory.screen.render();

			this.statusBarFactory.toggleContent(MSG.RELOADED);

			this.uLog();
		});
		this.uDiffSummary();
	}

	public updateAll() {
		this.uBranch();
		this.reloadStatus();
		this.screenFactory.screen.render();
	}

	public updateLog(branchOrFile: "file" | "branch") {
		switch (branchOrFile) {
			case "file":
				this.gitFactory.log(this.statusFactory.getSelectedFileName(), () => {
					this.logFactory.logOnFocus();
				});
				this.screenFactory.screen.render();

				break;

			case "branch":
				this.gitFactory.logBranch(() => {
					this.logFactory.logBranch();
				});

				break;
		}
	}
	public updateAfterRm(fName) {
		this.gitFactory.deleteKeyAfterCommit(fName);

		this.uStatus(() => {
			this.screenFactory.screen.render();
			this.uLog();
		});

		this.uDiffSummary();
	}
}
export default Update;
