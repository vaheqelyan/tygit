import Git from "./git";
import Prompt from "./prompt";
import Screen from "./screen";
import StatusBar from "./statusBar";

import { Inject, Service } from "typedi";
import MSG from "./messages/statusBar";

@Service()
class BranchPrompt extends Prompt {
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => Screen)
	public screenFactory: Screen;
	@Inject() private statusBarFactory: StatusBar;
	private spanwResponse: string;

	public onSubmit(branchName) {
		this.spanwResponse = null;
		this.gitFactory.newBranch(branchName, this.setResponse, this.onClose);
		this.statusBarFactory.setTitle(MSG.CREATING_NEW_BRANCH);
		this.screenFactory.screen.remove(this.element);
		this.screenFactory.screen.render();
	}

	private setResponse = (res: Buffer) => {
		this.spanwResponse = res.toString();
	};
	private onClose = code => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spanwResponse);
		} else {
			this.screenFactory.updateFactory.updateAll();
		}
	};
}

export default BranchPrompt;
