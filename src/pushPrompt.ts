import { Inject } from "typedi";
import Git from "./git";
import MSG from "./messages/statusBar";
import Prompt from "./prompt";
import Screen from "./screen";
import StatusBar from "./statusBar";

class PushInput extends Prompt {
	@Inject(() => Screen)
	public screenFactory: Screen;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;
	@Inject(() => Git)
	public gitFactory: Git;
	private spawnResponse: string;
	public onSubmit(value) {
		this.spawnResponse = null;
		this.gitFactory.push(value, this.handle, this.handleSpawnClose);

		this.statusBarFactory.setTitleAndRender(MSG.PUSHING, false);

		this.screenFactory.screen.remove(this.element);
		this.screenFactory.screen.render();
	}
	private handle = (data: Buffer) => {
		this.spawnResponse = data.toString();
	};
	private handleSpawnClose = code => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.statusBarFactory.toggleContent(MSG.PUSHED);
		}
	};
}

export default PushInput;
