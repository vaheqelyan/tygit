import * as blessed from "blessed";
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
		const { items } = this.branchFactory.getElement();
		for (let i = 0; i < items.length; i++) {
			const elitem: blessed.Widgets.ListElement = this.branchFactory.getElement().getItem(items[i]);
			const elitemText = elitem.getText();
			if (elitemText === branchName) {
				this.branchFactory.getElement().removeItem(elitem);
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
