export default function truncate(str: string, maxlength: number) {
	if (str.length > maxlength) {
		return `...${str.substring(maxlength - 3)}`;
	}

	return str;
}
