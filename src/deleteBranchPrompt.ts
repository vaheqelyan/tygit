import { Inject } from "typedi";
import Branches from "./branch";
import Git from "./git";
import MSG from "./messages/statusBar";
import Prompt from "./prompt";
import Screen from "./screen";
import StatusBar from "./statusBar";

export default class DeleteBranchPrompt extends Prompt {
	@Inject(() => Git)
	private gitFactory: Git;
	@Inject(() => Branches)
	private branchFactory: Branches;
	@Inject(() => StatusBar)
	private statusBarFactory: StatusBar;

	private spawnResponse: string;
	private branchName: string;

	public deleteBranchHandle = branchName => {
		// @ts-ignore
		const { items } = this.branchFactory.getElement();
		for (let i = 0; i < items.length; i++) {
			const elitem = this.branchFactory.getElement().getItem(items[i]);
			const elitemText = elitem.getText();
			if (elitemText === branchName) {
				this.branchFactory.getElement().removeItem(elitem);
			}
		}
		this.statusBarFactory.toggleContent(MSG.BRANCH_DELETED);
		this.screenFactory.screen.render();
	};

	public onSubmit(branchName: string) {
		this.branchName = branchName;
		this.spawnResponse = null;
		this.gitFactory.deleteBranch(branchName, this.setResponse, this.onClose);
		this.statusBarFactory.setTitle(MSG.DELETING_BRANCH);
		this.screenFactory.screen.remove(this.element);
		this.screenFactory.screen.render();
	}

	public setResponse = (res: Buffer) => {
		this.spawnResponse = res.toString();
	};

	public onClose = code => {
		if (code !== 0) {
			this.screenFactory.alertError(this.spawnResponse);
		} else {
			this.deleteBranchHandle(this.branchName);
		}
	};

	public setBranchName(bName) {
		this.branchName = bName;
	}
}
