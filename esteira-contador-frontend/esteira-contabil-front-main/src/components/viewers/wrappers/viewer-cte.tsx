import React from 'react';
import ViewerCTe from '../viewer-cte';
import { CTeData } from '@/types/fiscal-documentos';

const WrapperCTe: React.FC<{ documento: unknown }> = ({ documento }) => (
  <ViewerCTe documento={documento as CTeData} />
);

export default WrapperCTe;
