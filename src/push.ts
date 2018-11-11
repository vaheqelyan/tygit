import { Inject } from "typedi";
import Git from "./git";
import Screen from "./screen";
import StatusBar from "./statusBar";

import MSG from "./messages/statusBar";
import PushInput from "./pushPrompt";

import Key from "./key";

class Push extends Key {
	@Inject(() => PushInput)
	private pushInputFactory: PushInput;

	@Inject(() => Git)
	private gitFactory: Git;
	@Inject(() => Screen)
	private screenFactory: Screen;
	@Inject(() => StatusBar)
	private statusBarFactory: StatusBar;
	private spawnResponse: string;

	public doPush = () => {
		this.spawnResponse = null;
		this.gitFactory.pushNoArgs(this.setSpawnResponse, this.handleClose);
		this.statusBarFactory.setTitleAndRender(MSG.PUSHING);
	};
	protected onDbKey() {
		this.pushInputFactory.prompt("Push", "PUSH");
	}

	protected onKey() {
		this.doPush();
	}

	private handleClose = (code: number) => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.statusBarFactory.toggleContent(MSG.PUSHED);
		}
	};

	private setSpawnResponse = (data: Buffer) => {
		this.spawnResponse = data.toString();
	};
}
export default Push;
