import { Inject } from "typedi";
import Git from "./git";
import MSG from "./messages/statusBar";
import Prompt from "./prompt";
import Screen from "./screen";
import StatusBar from "./statusBar";

class MergePrompt extends Prompt {
	@Inject(() => Git)
	private gitFactory: Git;
	@Inject(() => Screen)
	private screenFactory: Screen;
	@Inject(() => StatusBar)
	private statusBarFactory: StatusBar;

	public onSubmit(value) {
		this.gitFactory.merge(value, this.handleMerge, this.handleMergeError);
		this.screenFactory.screen.remove(this.element);
		this.statusBarFactory.setTitleAndRender(MSG.MERGING, false);
		this.screenFactory.screen.render();
	}

	private handleMerge = () => {
		this.statusBarFactory.toggleContent(MSG.MERGED);
	};

	private handleMergeError = err => {
		this.screenFactory.alertError(err);
	};
}
export default MergePrompt;
