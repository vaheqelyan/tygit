import { Inject } from "typedi";
import Branches from "./branch";
import Git from "./git";
import Prompt from "./prompt";
import Screen from "./screen";
import StatusBar from "./statusBar";

export default class DeleteBranchPrompt extends Prompt {
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => Screen)
	public screenFactory: Screen;
	@Inject(() => Branches)
	public branchFactory: Branches;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;

	public deleteBranchHandleError = err => {
		this.screenFactory.alertError(err);
	};
	public deleteBranchHandle(branchName) {
		this.screenFactory.screen.remove(this.element);
		for (let i = 0; i < this.branchFactory.element.items.length; i++) {
			if (this.branchFactory.element.getItem(this.branchFactory.element.items[i]).getText() === branchName) {
				this.branchFactory.element.removeItem(this.branchFactory.element.getItem(this.branchFactory.element.items[i]));
			}
		}
		this.statusBarFactory.toogleContent(`Ok:: Deleted branch ${branchName}`);
		this.screenFactory.screen.render();
	}

	public onSubmit(branchName: string) {
		this.gitFactory.deleteBranch(
			branchName,
			this.deleteBranchHandle.bind(this, branchName),
			this.deleteBranchHandleError,
		);
		this.screenFactory.screen.remove(this.element);
		this.screenFactory.screen.render();
	}
}
