import List from "./list";

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Inject, Service } from "typedi";
import Checkout from "./checkout";
import CommitFileInput from "./commitFilePrompt";
import buildStatusArray from "./fn/buildStatusArray";
import Git from "./git";
import LogWidget from "./log/logWidget";
import MSG from "./messages/statusBar";
import Rm from "./rm";
import StatusBar from "./statusBar";

@Service()
class Status extends List {
	@Inject(() => Rm)
	private rmFactory: Rm;
	@Inject(() => Git)
	private gitFactory: Git;

	@Inject(() => Checkout)
	private checkoutFactory: Checkout;

	@Inject(() => StatusBar)
	private statusBarFactory: StatusBar;

	@Inject(() => CommitFileInput)
	private commitFilePrompt: CommitFileInput;

	@Inject(() => LogWidget)
	private logFactory: LogWidget;

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

			this.gitFactory.clearUntracked();
			this.statusBarFactory.toggleContent(MSG.TRACKED);
			this.screenFactory.updateFactory.updateAfterTrack();
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
			this.logFactory.logOnFocus();
		} else {
			// @ts-ignore
			if (this.getElement().items.length === 0) {
				this.gitFactory.clearLogs();
				this.logFactory.emptyList();
			}
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

	public checkoutFile() {
		this.checkoutFactory.checkout();
	}

	public ignore() {
		const flag = this.getFlag();
		if (flag) {
			if (flag === "??") {
				const gitIgnoreDir = join(this.gitFactory.dir, ".gitignore");
				const findIgnore = existsSync(gitIgnoreDir);
				if (findIgnore) {
					const ignoreFile = this.getSelectedFileName();
					const read = readFileSync(gitIgnoreDir, "utf8");
					writeFileSync(gitIgnoreDir, read + "\n" + ignoreFile, "utf8");
					this.statusBarFactory.setTitleAndRender(`Ignored ${ignoreFile}`);

					this.commitFilePrompt.setType("COMMIT FILE");

					this.gitFactory.commitFile(
						`Added ${ignoreFile} to the .gitignore`,
						".gitignore",
						this.commitFilePrompt.setSpawnResponse,
						this.commitFilePrompt.onClose,
					);
				}
			}
		}
	}

	public remove(i) {
		this.element.removeItem(i);
		this.screenFactory.screen.render();
	}
	public rm() {
		this.rmFactory.rm();
	}

	protected onSelect = () => {
		this.setStatusBarSelectedTitle();
		this.logFactory.logOnFocus();
		this.screenFactory.screen.render();
	};
}

export default Status;
