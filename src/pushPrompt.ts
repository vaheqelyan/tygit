import * as fuzzysearch from "fuzzysearch";
import { Inject } from "typedi";
import Git from "./git";
import MSG from "./messages/statusBar";
import Prompt from "./prompt";
import Screen from "./screen";
import StatusBar from "./statusBar";

class PushInput extends Prompt {
	@Inject(() => Screen)
	public screenFactory: Screen;
	@Inject(() => StatusBar)
	public statusBarFactory: StatusBar;
	@Inject(() => Git)
	public gitFactory: Git;
	public handle = (data: Buffer) => {
		const str = data.toString();
		if (fuzzysearch("rejected", str)) {
			this.screenFactory.alertError(str);
		} else if (fuzzysearch("fatal", str)) {
			this.screenFactory.alertError(str);
		} else {
			this.statusBarFactory.toogleContent(`Ok::Pushed to ${this.gitFactory.branches.current}`);
		}
	};
	public onSubmit(value) {
		this.gitFactory.push(value, this.handle);

		this.statusBarFactory.setTitleAndRender(MSG.PUSHING, false);

		this.screenFactory.screen.remove(this.element);
		this.screenFactory.screen.render();
	}
}

export default PushInput;
