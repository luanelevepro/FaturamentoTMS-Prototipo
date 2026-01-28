import type { Delivery, Trip } from '@/types';

export function tripStatusLabelPt(status: Trip['status']): string {
  switch (status) {
    case 'Planned':
      return 'Aguardando';
    case 'Picking Up':
      return 'Em Coleta';
    case 'In Transit':
      return 'Em Rota';
    case 'Completed':
      return 'Concluído';
    case 'Delayed':
      return 'Atrasado';
    default:
      return String(status);
  }
}

export function deliveryStatusLabelPt(status: Delivery['status']): string {
  switch (status) {
    case 'Pending':
      return 'Pendente';
    case 'Delivered':
      return 'Entregue';
    case 'Returned':
      return 'Devolvido';
    default:
      return String(status);
  }
}

