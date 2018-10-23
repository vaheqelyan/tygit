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

	public handle(fileName) {
		this.statusBarFactory.setTitleAndRender(MSG.COMMITED);

		this.gitFactory.initDiffSummary(() => {
			this.statusBarFactory.resetContent();
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
	}
	public handleError = err => {
		this.screenFactory.alertError(err);
	};

	public handleCommitAll = () => {
		this.statusBarFactory.setTitleAndRender(MSG.COMMITED);
		this.gitFactory.initDiffSummary(() => {
			this.statusBarFactory.resetContent();
		});

		this.statusFactory.clearAfterCommit();
		this.diffFactory.element.setContent("");
		this.gitFactory.clearDiffs();
		this.gitFactory.clearAfterCommmit();

		this.screenFactory.screen.render();
	};

	public onSubmit(value) {
		if (this.type === "COMMIT FILE") {
			const fileName = this.statusFactory.getSelectedFileName();
			this.gitFactory.commitFile(value, fileName, this.handle.bind(this, fileName), this.handleError);
		} else if (this.type === "COMMIT") {
			this.gitFactory.commit(value, this.handleCommitAll, this.handleError);
		}

		this.statusBarFactory.setTitleAndRender(MSG.COMMITING, false);

		this.screen.screen.remove(this.element);
		this.screen.screen.render();
	}
}
export default CommitFileInput;
