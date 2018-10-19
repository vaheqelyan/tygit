import * as fuzzysearch from "fuzzysearch";
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
	public screenFactory: Screen;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;
	@Inject(() => Diff)
	public diffFactory: Diff;
	@Inject(() => Message)
	public msgFactory: Message;

	private dataRes: string;

	public handlePull = (data: Buffer) => {
		this.dataRes = data.toString("utf8");
	};

	public onSubmit(value) {
		this.gitFactory.pull(value, this.handlePull, this.onClose);
		this.statusBarFactory.setTitleAndRender(MSG.PULLING, false);
		this.screen.screen.remove(this.element);
		this.screen.screen.render();
	}

	private onClose = () => {
		if (fuzzysearch("CONFLICT", this.dataRes)) {
			this.statusBarFactory.toogleContent(MSG.PULLED_WITH_CONFLICT);
		} else {
			this.statusBarFactory.toogleContent(MSG.PULLED);
		}

		this.screenFactory.reloadFn(true, false);
	};
}
export default PullInput;
