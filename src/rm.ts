import { Inject } from "typedi";

import Git from "./git";
import MSG from "./messages/statusBar";
import Screen from "./screen";
import Status from "./status";
import StatusBar from "./statusBar";

class Rm {
	@Inject(() => Status)
	private statusFactory: Status;
	@Inject(() => Screen)
	private screenFactory: Screen;
	@Inject() private gitFactory: Git;
	@Inject() private statusBarFactory: StatusBar;

	private file: string;
	private spawnResponse: string;

	public rm() {
		this.spawnResponse = null;
		const fileName = this.statusFactory.getSelectedFileName();
		if (fileName) {
			this.file = fileName;
			this.statusBarFactory.setTitleAndRender(MSG.RM);
			this.gitFactory.rm(fileName, this.setSpawnResponse, this.onClose);
		}
	}
	private setSpawnResponse = (res: Buffer) => {
		this.spawnResponse = res.toString();
	};

	private onClose = (code: number) => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.statusBarFactory.toggleContent(MSG.RM_DONE);
			this.screenFactory.updateFactory.updateAfterRm(this.file);
		}
	};
}
export default Rm;
