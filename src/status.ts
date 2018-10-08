import List from "./list";

import { Inject, Service } from "typedi";
import CommitFileInput from "./commitFilePrompt";
import Diff from "./diff";
import buildStatusArray from "./fn/buildStatusArray";
import Git from "./git";
import MSG from "./messages/statusBar";
import Screen from "./screen";
import StatusBar from "./statusBar";
@Service()
class Status extends List {
	@Inject(() => Screen)
	public screen: Screen;
	@Inject(() => Git)
	public gitFactory: Git;

	@Inject(() => Diff)
	public diffFactory: Diff;

	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;

	@Inject(() => CommitFileInput)
	public commitFilePrompt: CommitFileInput;

	public onUp() {
		this.setStatusBarSelectedTitle();
		this.diffFactory.diffOnFocus();
		this.screen.screen.render();
	}
	public onDown() {
		this.setStatusBarSelectedTitle();
		this.diffFactory.diffOnFocus();
		this.screen.screen.render();
	}

	public onEnter() {
		const selected = this.getSelected();
		if (selected) {
			this.commitFilePrompt.prompt("Commit file", "COMMIT FILE");
		}
	}

	public reload() {
		this.element.setItems(buildStatusArray(this.gitFactory.gitStatus));
		this.element.select(0);
	}

	public afterTrack() {
		const { not_added } = this.gitFactory.gitStatus;

		this.statusBarFactory.toogleContent(MSG.TRACKED);

		for (const value of not_added) {
			const getValue = this.element.getItem(`?  ${value}`);
			if (getValue) {
				getValue.setContent(`{green-bg} {white-fg}{bold}A{/bold}{/white-fg} {/green-bg} ${value}`);
			}
		}

		const computeCreated = not_added.concat(this.gitFactory.gitStatus.created);
		this.gitFactory.gitStatus.created = computeCreated;

		this.screen.screen.render();
	}

	public trackFiles() {
		this.gitFactory.track(err => {
			if (err) {
				console.log(err);
			}
			this.afterTrack();
		});
		this.statusBarFactory.setTitleAndRender(MSG.TRACKING);
	}

	public clearAfterCommit() {
		this.element.setItems([]);
	}

	public commit() {
		this.commitFilePrompt.prompt("Commit message", "COMMIT");
	}

	public setStatusBarSelectedTitle() {
		if (this.gitFactory.diffSummary !== null) {
			const sel = this.getSelected();
			if (sel) {
				const fileName = sel.getText();
				this.statusBarFactory.setFileTitle(this.parseFileName(fileName), this.parseFileStatusType(fileName), false);
			}
		}
	}
}

export default Status;
