import * as blessed from "blessed";
import { Inject, Service } from "typedi";
import BranchPrompt from "./BranchPrompt";
import DeleteBranchPrompt from "./DeleteBranchPrompt";
import Git from "./git";
import List from "./List";
import Message from "./message";
import Screen from "./screen";
import StatusBar from "./statusBar";

@Service()
class Branches extends List {
	@Inject(() => Screen)
	public screen: Screen;
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;

	@Inject(() => Message)
	public msgFactory: Message;
	@Inject(() => BranchPrompt)
	public branchPrompt: BranchPrompt;
	@Inject(() => DeleteBranchPrompt)
	public deletePrompt: DeleteBranchPrompt;

	public switchBranchHandle = () => {
		const selected = this.getSelected();
		const branchName = selected.getText();
		// @ts-ignore
		this.element.items.forEach((value: blessed.Widgets.ListElement, index) => {
			const t = value.getText();
			if (t === branchName) {
				selected.setText(`* ${branchName}`);
			}
			if (t.split("*").length > 1) {
				const getByIndex = this.element.getItemIndex(index);
				// @ts-ignore
				this.element.getItem(getByIndex).setText(this.gitFactory.branches.current);
				this.gitFactory.setCurrentBracnh(branchName);
			}
		});

		this.statusBarFactory.toggleContent(`Ok::Switched to branch '${branchName}'`);

		this.enable();

		this.screen.screen.render();
	};
	public switchBranchErrorHandle = err => {
		this.msgFactory.display(err, (errMsg, value) => {
			if (errMsg) {
				console.log(errMsg);
			}
			if (value) {
				this.screen.screen.remove(this.msgFactory.element);
				this.screen.screen.render();
			}
		});
	};
	public onEnter = () => {
		const selected = this.getSelected();
		if (selected) {
			const branchName = selected.getText();
			if (branchName.indexOf("*") !== 0) {
				this.gitFactory.switchBranch(branchName, this.switchBranchHandle, this.switchBranchErrorHandle);

				this.disable();
			}
		}
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

	public deleteBranchHandle(branchName) {
		// @ts-ignore
		for (let i = 0; i < this.element.items.length; i++) {
			// @ts-ignore
			if (this.element.getItem(this.element.items[i]).getText() === branchName) {
				// @ts-ignore
				this.element.removeItem(this.element.getItem(this.element.items[i]));
			}
		}
		this.screen.screen.render();
	}

	public deleteBranch() {
		if (this.screen.curElement === "Branches") {
			const selected = this.getSelected();
			if (selected) {
				const branchName = this.getSelectedBranchName();
				this.gitFactory.deleteBranch(
					branchName,
					this.deleteBranchHandle.bind(this, branchName),
					this.deletePrompt.deleteBranchHandleError,
				);
			}
		} else {
			this.deletePrompt.prompt("Delete branch", "DELETE BRANCH");
		}
	}
}

export default Branches;
