type Status = 'transit' | 'successTwo' | 'late';

export function badgeTripStatus(status: Status) {
	switch (status) {
		case 'transit':
			return 'Em Trânsito';
		case 'successTwo':
			return 'Entregue';
		case 'late':
			return 'Atrasado';
		default:
			return 'Desconhecido';
	}
}
