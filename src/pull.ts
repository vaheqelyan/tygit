import { Inject } from "typedi";
import Git from "./git";
import Screen from "./screen";
import StatusBar from "./statusBar";

import MSG from "./messages/statusBar";
import PullInput from "./pullPrompt";

import * as match from "fuzzysearch";
import Key from "./key";
class Pull extends Key {
	@Inject(() => PullInput)
	private pullInputFactory: PullInput;

	@Inject(() => Git)
	private gitFactory: Git;
	@Inject(() => Screen)
	private screenFactory: Screen;
	@Inject(() => StatusBar)
	private statusBarFactory: StatusBar;
	private spawnResponse: string;

	public doPull = () => {
		this.spawnResponse = null;

		this.statusBarFactory.setTitleAndRender(MSG.PULLING);
		this.gitFactory.pullNoArgs(this.setSpawnResponse, this.handleClose);
	};

	protected onKey() {
		this.doPull();
	}
	protected onDbKey() {
		this.pullInputFactory.prompt("Pull", "PULL");
	}

	private handleClose = (code: number) => {
		if (code !== 0) {
			if (match("conflict", this.spawnResponse)) {
				this.statusBarFactory.toggleContent(MSG.PULLED_WITH_CONFLICT);

				this.screenFactory.updateFactory.reloadStatus();
			} else {
				this.screenFactory.alertError(this.spawnResponse);
			}
		} else {
			this.statusBarFactory.toggleContent(MSG.PULLED);
			this.screenFactory.updateFactory.reloadStatus();
		}
	};

	private setSpawnResponse = (data: Buffer) => {
		this.spawnResponse = data.toString();
	};
}
export default Pull;
