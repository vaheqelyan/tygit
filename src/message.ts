import * as blessed from "blessed";
import { Inject, Service } from "typedi";
import Screen from "./screen";

@Service()
class Message {
	@Inject(() => Screen)
	public screenFactory: Screen;
	public element: blessed.Widgets.QuestionElement;

	// cb?: (err: any, value: boolean) => void
	public display(msg: string, cb?: (err: any, value: boolean | string) => void) {
		this.element = blessed.question({
			border: "line",
			height: "shrink",
			keys: true,
			label: " {bold}Rejected{/bold} ",
			left: "center",
			parent: this.screenFactory.screen,
			tags: true,
			top: "center",
			vi: true,
			width: "half",
		});

		this.element.ask(msg, cb);
	}
}

export default Message;
