import * as fuzzysearch from "fuzzysearch";
import { Inject } from "typedi";
import Git from "./git";
import Message from "./message";
import MSG from "./messages/statusBar";
import Prompt from "./prompt";
import Screen from "./screen";
import Status from "./status";
import StatusBar from "./statusBar";

class PullInput extends Prompt {
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => Status)
	public statusFactory: Status;
	@Inject(() => Screen)
	public screenFactory: Screen;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;
	@Inject(() => Message)
	public msgFactory: Message;

	private spawnResponse: string;

	public handlePull = (data: Buffer) => {
		this.spawnResponse = data.toString();
	};

	public onSubmit(value) {
		this.gitFactory.pull(value, this.handlePull, this.onClose);
		this.statusBarFactory.setTitleAndRender(MSG.PULLING, false);
		this.screen.screen.remove(this.element);
		this.screen.screen.render();
	}

	private onClose = code => {
		if (code !== 0) {
			if (fuzzysearch("conflict", this.spawnResponse)) {
				this.spawnResponse = null;
				this.statusBarFactory.toggleContent(MSG.PULLED_WITH_CONFLICT);
				this.screenFactory.updateFactory.reloadStatus();
			} else {
				this.screenFactory.alertError(this.spawnResponse);
			}
		} else {
			this.spawnResponse = null;
			this.statusBarFactory.setTitle(MSG.PULLED);
			this.screenFactory.updateFactory.reloadStatus();
		}
	};
}
export default PullInput;
