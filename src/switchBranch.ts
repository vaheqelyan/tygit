import * as blessed from "blessed";
import { Inject } from "typedi";

import Branches from "./branch";
import Git from "./git";
import MSG from "./messages/statusBar";
import Screen from "./screen";
import StatusBar from "./statusBar";
class SwitchBranch {
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => Screen)
	private screenFactory: Screen;
	@Inject() private statusBarFactory: StatusBar;

	@Inject(() => Branches)
	private brancFactory: Branches;

	private spawnResponse: string;

	public switch() {
		const selected = this.brancFactory.getSelected();
		if (selected) {
			const branchName = selected.getText();
			if (branchName.indexOf("*") !== 0) {
				this.gitFactory.switchBranch(branchName, this.setSpawnResponse, this.onClose);

				this.brancFactory.disable();
			}
		}
	}

	private setSpawnResponse = (response: Buffer) => {
		this.spawnResponse = response.toString();
	};

	private markNewCurrentBranch() {
		const selected = this.brancFactory.getSelected();
		const branchName = selected.getText();
		// @ts-ignore
		this.brancFactory.getElement().items.forEach((value: blessed.Widgets.ListElement, index) => {
			const t = value.getText();
			if (t === branchName) {
				selected.setText(`* ${branchName}`);
			}
			if (t.split("*").length > 1) {
				const getByIndex = this.brancFactory.getElement().getItemIndex(index);
				this.brancFactory
					.getElement()
					// @ts-ignore
					.getItem(getByIndex)
					.setText(this.gitFactory.getCurrentBranch());
				this.gitFactory.setCurrentBracnh(branchName);
			}
		});

		this.statusBarFactory.toggleContent(MSG.SWITCHED_BRANCH);

		this.brancFactory.enable();
		this.screenFactory.updateFactory.reloadStatus();

		this.screenFactory.screen.render();
	}

	private onClose = (code: number) => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.markNewCurrentBranch();
		}
	};
}

export default SwitchBranch;
