import { Inject } from "typedi";

import Git from "./git";
import MSG from "./messages/statusBar";
import Screen from "./screen";
import StatusBar from "./statusBar";

class Amend {
	@Inject(() => Screen)
	private screenFactory: Screen;
	@Inject() private gitFactory: Git;
	@Inject() private statusBarFactory: StatusBar;

	private spawnResponse: string;

	public setSpawnResponse = (res: Buffer) => {
		this.spawnResponse = res.toString();
	};
	public onClose = (code: number) => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.screenFactory.updateFactory.updateLog("branch");

			this.screenFactory.screen.render();

			this.statusBarFactory.toggleContent(MSG.AMEND_DONE);
		}
	};

	public amend(message: string) {
		this.spawnResponse = null;
		this.statusBarFactory.toggleContent(MSG.AMEND);
		this.gitFactory.amend(message, this.setSpawnResponse, this.onClose);
	}
}
export default Amend;
