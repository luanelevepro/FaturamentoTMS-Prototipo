import React from 'react';
import ViewerNFe from '../viewer-nfe';
import { NFeData } from '../../../types/fiscal-documentos';

const WrapperNFe: React.FC<{ documento: unknown }> = ({ documento }) => (
  <ViewerNFe documento={documento as NFeData} />
);

export default WrapperNFe;
