import { Inject } from "typedi";
import Git from "./git";
import Prompt from "./prompt";
import Screen from "./screen";
import Status from "./status";
import StatusBar from "./statusBar";

import MSG from "./messages/statusBar";

import Amend from "./amend";

class CommitFileInput extends Prompt {
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => Status)
	public statusFactory: Status;
	@Inject(() => Screen)
	public screenFactory: Screen;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;
	@Inject(() => Amend)
	private amendFactory: Amend;

	private spawnResponse: string;

	public checkForAmend(str: string) {
		const sym = str.substr(0, 2);
		return sym === "a ";
	}

	public onSubmit(value) {
		if (this.checkForAmend(value)) {
			this.amendFactory.amend(value);
		} else {
			this.spawnResponse = null;
			if (this.type === "COMMIT FILE") {
				const fileName = this.statusFactory.getSelectedFileName();
				this.gitFactory.commitFile(value, fileName, this.setSpawnResponse, this.onClose);
			} else if (this.type === "COMMIT") {
				this.gitFactory.commitAllSpawn(value, this.setSpawnResponse, this.onClose);
			}

			this.statusBarFactory.setTitleAndRender(MSG.COMMITING, false);
		}

		this.screen.screen.remove(this.element);
		this.screen.screen.render();
	}

	public onClose = code => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.statusBarFactory.toggleContent(MSG.COMMITED);

			if (this.type === "COMMIT FILE") {
				this.screenFactory.updateFactory.updateAfterSingleCommit();
			} else if (this.type === "COMMIT") {
				this.screenFactory.updateFactory.updateAfterCommit();
			}
		}
	};

	public setSpawnResponse = (response: Buffer) => {
		this.spawnResponse = response.toString();
	};
}
export default CommitFileInput;
