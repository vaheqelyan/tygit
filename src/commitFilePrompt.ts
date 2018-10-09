import { Inject } from "typedi";
import Diff from "./diff";
import Git from "./git";
import Message from "./message";
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
	@Inject(() => Message)
	public msgFactory: Message;

	public handle(fileName) {
		this.statusBarFactory.setTitleAndRender(MSG.COMMITED);
		this.gitFactory.async.diffSummary((err: Error, res: any) => {
			if (err) {
				console.log(err);
			}
			this.gitFactory.diffSummary = res;
			this.statusBarFactory.resetContent();
		});
		this.statusFactory.getElement().removeItem(this.statusFactory.getSelected());
		if (this.gitFactory.diffs.has(fileName)) {
			this.diffFactory.element.setContent(" ");
			this.gitFactory.diffs.delete(fileName);
		}
		this.gitFactory.removeFromStatusMap(fileName);
		this.screen.screen.render();
	}
	public handleError = err => {
		this.msgFactory.display(err, (errMsg, value) => {
			if (errMsg) {
				console.log(errMsg);
			}
			if (value) {
				this.screen.screen.remove(this.msgFactory.element);
				this.screen.screen.render();
			}
		});
	};

	public handleCommitAll = () => {
		this.gitFactory.async.diffSummary((err: Error, res: any) => {
			if (err) {
				console.log(err);
			}
			this.gitFactory.diffSummary = res;
			this.statusBarFactory.resetContent();
		});

		this.statusFactory.clearAfterCommit();
		this.diffFactory.element.setContent("");
		this.gitFactory.clearDiffs();
		this.gitFactory.clearAfterCommmit();

		this.screen.screen.render();
	};

	public onSubmit(value) {
		if (this.type === "COMMIT FILE") {
			const fileName = this.statusFactory.getSelectedFileName();
			this.gitFactory.commitFile(value, fileName, this.handle.bind(this, fileName), this.handleError);
		} else if (this.type === "COMMIT") {
			this.gitFactory.commit(value, this.handleCommitAll, this.handleError);
		}

		this.statusBarFactory.toogleContent(MSG.COMMITING);

		this.screen.screen.remove(this.element);
		this.screen.screen.render();
	}
}
export default CommitFileInput;
