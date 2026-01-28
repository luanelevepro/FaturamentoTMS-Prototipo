/**
 * Vários truques para gerar cores a partir de uma string.
 * @param input - A string a ser usada para gerar a cor e as iniciais.
 * Contamos o tamanho da string em bits
 * Overload hash contra 255 (0xFF) pra cada canal de cor (r, g, b)
 * Plau, cor hexadecimal
 */
export function generateColorAndInitials(input: string): { color: string; initials: string } {
	function stringToHash(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = (hash << 5) - hash + str.charCodeAt(i);
		}
		return hash;
	}

	function hashToColor(hash: number): string {
		const r = (hash >> 16) & 0xff;
		const g = (hash >> 8) & 0xff;
		const b = hash & 0xff;

		return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
	}

	function getInitials(str: string): string {
		const initials = str
			.split(/\s+/)
			.map((word) => word[0].toUpperCase())
			.join('');
		return initials.substring(0, 2);
	}

	const hash = stringToHash(input);
	const color = hashToColor(hash);
	const initials = getInitials(input);

	return { color, initials };
}
