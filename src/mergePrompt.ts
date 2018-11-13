import { Inject } from "typedi";
import Git from "./git";
import MSG from "./messages/statusBar";
import Prompt from "./prompt";
import StatusBar from "./statusBar";

class MergePrompt extends Prompt {
	@Inject(() => Git)
	private gitFactory: Git;
	@Inject(() => StatusBar)
	private statusBarFactory: StatusBar;

	private spawnResponse: string;

	public onSubmit(value) {
		this.gitFactory.merge(value, this.handleSpawnData, this.onClose);
		this.statusBarFactory.setTitleAndRender(MSG.MERGING, false);
		this.screenFactory.screen.remove(this.element);
		this.screenFactory.screen.render();
	}

	private onClose = code => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.handleMerge();
			this.spawnResponse = null;
		}
	};

	private handleSpawnData = (res: Buffer) => {
		this.spawnResponse = res.toString();
	};

	private handleMerge = () => {
		this.statusBarFactory.toggleContent(MSG.MERGED);
	};
}
export default MergePrompt;
