// The same as puting question mark ? (selectedFile?: string) === (selectedFile: string = "")export default function writeFooterContent(
export default function writeStatusBarContent(
	branchName: string,
	insertions: number,
	deletions: number,
	selectedFile: string = "",
): string {
	return `${branchName} {bold}{green-fg}+${insertions}{/green-fg}{/bold}/{bold}{red-fg}-${deletions}{/red-fg}{/bold} ${selectedFile}`;
}
