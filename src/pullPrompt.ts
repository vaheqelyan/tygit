import { Inject } from "typedi";
import Diff from "./diff";
import Git from "./git";
import Message from "./message";
import MSG from "./messages/statusBar";
import Prompt from "./prompt";
import Screen from "./screen";
import Status from "./status";
import StatusBar from "./statusBar";

class PullInput extends Prompt {
	@Inject(() => Git)
	public gitFactory: Git;
	@Inject(() => Status)
	public statusFactory: Status;
	@Inject(() => Screen)
	public screen: Screen;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;
	@Inject(() => Diff)
	public diffFactory: Diff;
	@Inject(() => Message)
	public msgFactory: Message;

	public handlePull = () => {
		this.statusBarFactory.setTitleAndRender(MSG.PULLED);
		this.gitFactory.initDiffSummary(() => {
			this.statusBarFactory.resetContent();
		});

		this.gitFactory.initStatus(async () => {
			this.statusFactory.reload();
			this.screen.screen.render();
			if (this.gitFactory.isNeedDiff()) {
				this.gitFactory.prettyDiff(await this.gitFactory.g.diff());
				this.diffFactory.diffOnFocus();
				this.screen.screen.render();
			}
		});
	};
	public handlePullError = err => {
		this.screen.msgFactory.display(err, (msgErr, value) => {
			if (msgErr) {
				console.log(msgErr);
			}
			if (value) {
				this.statusBarFactory.resetContent();
				this.screen.screen.remove(this.msgFactory.element);
				this.screen.screen.render();
			}
		});
	};

	public onSubmit(value) {
		this.gitFactory.pull(value, this.handlePull, this.handlePullError);
		this.statusBarFactory.setTitleAndRender(MSG.PULLING, false);
		this.screen.screen.remove(this.element);
		this.screen.screen.render();
	}
}
export default PullInput;
