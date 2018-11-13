import { Inject } from "typedi";
import BranchPrompt from "./BranchPrompt";
import DeleteBranchPrompt from "./DeleteBranchPrompt";
import Git from "./git";
import List from "./List";
import LogWidget from "./log/logWidget";
import Screen from "./screen";
import SwitchBranch from "./switchBranch";

class Branches extends List {
	@Inject(() => Screen)
	private screen: Screen;
	@Inject(() => Git)
	private gitFactory: Git;

	@Inject(() => BranchPrompt)
	private branchPrompt: BranchPrompt;
	@Inject(() => DeleteBranchPrompt)
	private deletePrompt: DeleteBranchPrompt;
	@Inject(() => SwitchBranch)
	private switchBranchFactory: SwitchBranch;
	@Inject(() => LogWidget)
	private logFactory: LogWidget;

	public onEnter = () => {
		this.switchBranchFactory.switch();
	};

	public reload() {
		let val = null;
		const uiBranchComputed: string[] = this.gitFactory.getAllBranches().map((value: string) => {
			const currentBranch = this.gitFactory.getCurrentBranch();
			if (currentBranch === value) {
				val = value;
			}

			return currentBranch === value ? `* ${value}` : value;
		});
		// @ts-ignore
		this.element.setItems(uiBranchComputed);
		// @ts-ignore
		const ind = this.element.getItemIndex(`* ${val}`);
		this.element.select(ind);
	}

	public createNewBranch() {
		this.branchPrompt.prompt("Branch name?", "CREATE BRANCH");
	}

	public deleteBranch() {
		if (this.screen.curElement === "Branches") {
			const selected = this.getSelected();
			if (selected) {
				const branchName = this.getSelectedBranchName();
				this.deletePrompt.setBranchName(branchName);
				this.gitFactory.deleteBranch(branchName, this.deletePrompt.setResponse, this.deletePrompt.onClose);
			}
		} else {
			this.deletePrompt.prompt("Delete branch", "DELETE BRANCH");
		}
	}

	public showLogs = () => {
		const getCurrentB = this.gitFactory.getCurrentBranch();
		if (!this.gitFactory.branchLogs.has(getCurrentB)) {
			this.gitFactory.logBranch(() => {
				this.logFactory.logBranch();
			});
		} else {
			this.logFactory.logBranch();
		}
	};

	public jumpToLogs = () => {
		this.showLogs();
		this.logFactory.focus();
		this.screenFactory.screen.render();
	};
}

export default Branches;
