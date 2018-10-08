export default function buildStatusArray(status) {
	const notAdded = status.not_added.map(
		(value: string) => `{red-bg} {white-fg}{bold}?{/bold}{/white-fg} {/red-bg} ${value}`,
	);
	const created = status.created.map(
		(value: string) => `{green-bg} {white-fg}{bold}A{/bold}{/white-fg} {/green-bg} ${value}`,
	);
	const modified = status.modified.map(
		(value: string) => `{yellow-bg} {white-fg}{bold}M{/bold}{/white-fg} {/yellow-bg} ${value}`,
	);
	const deleted = status.deleted.map(
		(value: string) => `{red-bg} {white-fg}{bold}D{/bold}{/white-fg} {/red-bg} ${value}`,
	);
	const renamed = status.renamed.map(
		(value: string) => `{red-bg} {white-fg}{bold}R{/bold}{/white-fg} {/red-bg} ${value.from}->${value.to}`,
	);
	const conflicted = status.conflicted.map(
		(value: string) => `{red-bg} {white-fg}{bold}U{/bold}{/white-fg} {/red-bg} ${value}`,
	);
	const gitStatusUi = [...notAdded, ...created, ...modified, ...deleted, ...renamed, ...conflicted];
	return gitStatusUi;
}
