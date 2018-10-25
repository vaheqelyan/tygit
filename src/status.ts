import List from "./list";

import { Inject, Service } from "typedi";
import CommitFileInput from "./commitFilePrompt";
import Diff from "./diff";
import buildStatusArray from "./fn/buildStatusArray";
import Git from "./git";
import MSG from "./messages/statusBar";
import StatusBar from "./statusBar";

@Service()
class Status extends List {
	@Inject(() => Git)
	public gitFactory: Git;

	@Inject(() => Diff)
	public diffFactory: Diff;

	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;

	@Inject(() => CommitFileInput)
	public commitFilePrompt: CommitFileInput;

	public onEnter() {
		const selected = this.getSelected();
		if (selected) {
			this.commitFilePrompt.prompt("Commit file", "COMMIT FILE");
		}
	}

	public reload(selectZeroItem: boolean = true) {
		this.element.setItems(buildStatusArray(this.gitFactory.getStatuMap()));
		if (selectZeroItem) {
			this.element.select(0);
		}
	}

	public afterTrack() {
		this.statusBarFactory.toggleContent(MSG.TRACKED);
		const status = this.gitFactory.getStatuMap();
		for (const [key] of status) {
			// @ts-ignore
			const getValue = this.getElement().getItem(`??  ${key}`);
			if (getValue) {
				getValue.setContent(`{green-bg} {white-fg}{bold}A{/bold}{/white-fg} {/green-bg} ${key}`);
				status.set(key, "A");
			}
		}
		this.screenFactory.screen.render();
	}

	public trackFiles() {
		this.gitFactory.track(err => {
			if (err) {
				console.log(err);
			}

			/*
				I'll process more complex solution 
				Cleaning after without calling git status --short after each file staging
				It is a little safe :) WIP
			*/
			this.gitFactory.clearUntracked();
			this.statusBarFactory.toggleContent(MSG.TRACKED);
			this.screenFactory.reloadFn(true, false);
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
		if (this.gitFactory.getDiffSummary() !== null) {
			const sel = this.getSelected();
			if (sel) {
				const fileName = sel.getText();
				this.statusBarFactory.setFileTitle(this.parseFileName(fileName), this.parseFileStatusType(fileName));
			}
		}
	}

	public selectingNext() {
		const select = this.getSelected();
		if (select) {
			this.diffFactory.diffOnFocus();
		}
	}

	public goDown() {
		// @ts-ignore
		this.element.down();
	}
	public goUp() {
		// @ts-ignore
		this.element.up();
	}

	protected onSelect() {
		this.setStatusBarSelectedTitle();
		this.diffFactory.diffOnFocus();
		this.screenFactory.screen.render();
	}
}

export default Status;
