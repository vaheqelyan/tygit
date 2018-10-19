const STATUS_BAR_HEIGHT = 3;

function setLeftRow(width: number) {
	return Math.floor(width / 3.4);
}
function setLeftColumn(height: number) {
	return Math.floor(height / 5);
}

function setColumnForStatus(height: number) {
	return height - Math.floor(height / 5) - 3;
}

function setTopForStatus(height: number) {
	return Math.floor(height / 5);
}

function setColumnForDiff(height: number) {
	return height - STATUS_BAR_HEIGHT;
}

function setRowForDiff(width: number) {
	return width - setLeftRow(width) - 1;
}

function setRowForStatusBar(width: number) {
	return width - 1;
}

function setDiffRowPosition(width) {
	return setLeftRow(width);
}

function setColumnForStatusBar(height: number) {
	return Math.floor(height - 2.6);
}

export {
	setLeftRow,
	setLeftColumn,
	setTopForStatus,
	setColumnForStatus,
	setRowForDiff,
	setColumnForDiff,
	setRowForStatusBar,
	setColumnForStatusBar,
	setDiffRowPosition,
	STATUS_BAR_HEIGHT,
};
