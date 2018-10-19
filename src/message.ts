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
			keys: false,
			label: " {bold}{red-fg}Rejected{/red-fg}{/bold} ",
			left: "center",
			parent: this.screenFactory.screen,
			style: {
				border: {
					fg: "red",
				},
			},
			tags: true,
			top: "center",
			vi: false,
			width: "half",
		});

		this.element.remove(this.element._.cancel);
		this.element.remove(this.element._.okay);

		this.element.ask(msg, cb);
	}
}

export default Message;
