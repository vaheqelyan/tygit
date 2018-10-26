import { Inject } from "typedi";
import Diff from "./diff";
import Git from "./git";
import Prompt from "./prompt";
import Screen from "./screen";
import Status from "./status";
import StatusBar from "./statusBar";

import MSG from "./messages/statusBar";

class CommitFileInput extends Prompt {
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => Status)
	public statusFactory: Status;
	@Inject(() => Screen)
	public screenFactory: Screen;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;
	@Inject(() => Diff)
	public diffFactory: Diff;
	private fileName: string;

	private spawnResponse: string;

	public handle = () => {
		const { fileName } = this;
		this.statusBarFactory.setTitleAndRender(MSG.COMMITED);

		this.gitFactory.initDiffSummary(() => {
			this.statusBarFactory.toggleContent(MSG.COMMITED);
		});

		this.statusFactory.getElement().removeItem(this.statusFactory.getSelected());
		const diffs = this.gitFactory.getDiffs();
		if (diffs.has(fileName)) {
			this.diffFactory.element.setContent(" ");
			diffs.delete(fileName);
		}
		this.gitFactory.removeFromStatusMap(fileName);
		this.statusFactory.selectingNext();
		this.screenFactory.screen.render();
	};

	public handleCommitAll = () => {
		this.statusBarFactory.setTitleAndRender(MSG.COMMITED);
		this.gitFactory.initDiffSummary(() => {
			this.statusBarFactory.resetContent();
		});

		this.statusFactory.clearAfterCommit();
		this.diffFactory.element.setContent("");

		this.gitFactory.clearAfterAllCommit();

		this.screenFactory.screen.render();
	};

	public onSubmit(value) {
		this.spawnResponse = null;
		if (this.type === "COMMIT FILE") {
			const fileName = this.statusFactory.getSelectedFileName();
			this.fileName = fileName;
			this.gitFactory.commitFile(value, fileName, this.setSpawnResponse, this.onClose);
		} else if (this.type === "COMMIT") {
			this.gitFactory.commitAllSpawn(value, this.setSpawnResponse, this.onClose);
		}

		this.statusBarFactory.setTitleAndRender(MSG.COMMITING, false);

		this.screen.screen.remove(this.element);
		this.screen.screen.render();
	}

	private onClose = code => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			if (this.type === "COMMIT FILE") {
				this.handle();
			} else if (this.type === "COMMIT") {
				this.handleCommitAll();
			}
		}
	};

	private setSpawnResponse = (response: Buffer) => {
		this.spawnResponse = response.toString();
	};
}
export default CommitFileInput;
