export default function buildStatusArray(status: Map<string, string>) {
	const arr = [];
	for (const [key, value] of status) {
		switch (value) {
			case "M":
				arr.push(`{yellow-bg} {white-fg}{bold}M{/bold}{/white-fg} {/yellow-bg} ${key}`);
				break;
			case "A":
				arr.push(`{green-bg} {white-fg}{bold}A{/bold}{/white-fg} {/green-bg} ${key}`);
				break;
			case "D":
				arr.push(`{red-bg} {white-fg}{bold}D{/bold}{/white-fg} {/red-bg} ${key}`);
				break;
		}
		if (value.length > 1) {
			arr.push(`{red-bg} {white-fg}{bold}${value}{/bold}{/white-fg} {/red-bg} ${key}`);
		}
	}
	return arr;
}
