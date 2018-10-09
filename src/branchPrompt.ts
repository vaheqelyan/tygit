import Git from "./git";
import Prompt from "./prompt";
import Screen from "./screen";

import { Inject, Service } from "typedi";

@Service()
class BranchPrompt extends Prompt {
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => Screen)
	public screenFactory: Screen;

	public handle = () => {
		this.screenFactory.reload();
	};
	public handleError = err => {
		this.screenFactory.alertError(err);
	};

	public onSubmit(branchName) {
		this.gitFactory.newBranch(branchName, this.handle, this.handleError);
		this.screenFactory.screen.remove(this.element);
		this.screenFactory.screen.render();
	}
}

export default BranchPrompt;
