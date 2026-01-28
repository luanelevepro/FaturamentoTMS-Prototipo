import React from 'react';
import ViewerNFSe from '../viewer-nfse';
import { NFSeData } from '@/types/fiscal-documentos';

const WrapperNFSe: React.FC<{ documento: unknown }> = ({ documento }) => (
  <ViewerNFSe documento={documento as NFSeData} />
);

export default WrapperNFSe;
