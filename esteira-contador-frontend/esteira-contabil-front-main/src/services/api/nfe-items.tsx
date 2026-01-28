export interface NFEItem {
  id: string;
  dt_created: string;
  dt_updated: string;
  ds_ordem: number;
  id_fis_nfe: string;
  ds_produto: string;
  cd_produto_anp: string | null;
  ds_produto_anp_descricao: string | null;
  ds_codigo: string;
  ds_unidade: string;
  vl_base_calculo_icms: string;
  vl_quantidade: string;
  vl_unitario: string;
  vl_total: string;
  vl_icms: string;
  ds_icms_tag: string;
  ds_cst: string;
  ds_origem: string;
  vl_pis: string;
  vl_porcentagem_pis: string;
  vl_base_calculo_pis: string;
  cd_cst_pis: string;
  vl_cofins: string;
  vl_porcentagem_cofins: string;
  vl_base_calculo_cofins: string;
  cd_cst_cofins: string;
  ds_unidade_tributavel: string;
  vl_quantidade_tributavel: string;
  vl_total_tributavel: string;
  vl_unitario_tributavel: string;
  ds_porcentagem_icms: string;
  ds_enquadramento_ipi: string | null;
  ds_ipi_nao_tributavel_cst: string | null;
  ds_pis_nao_tributavel_cst: string | null;
  ds_cofins_nao_tributavel_cst: string | null;
  ds_base_calculo_mono: string | null;
  ds_porcentagem_mono: string | null;
  vl_icms_mono: string | null;
  cd_ncm: string;
  cd_cest: string;
  cd_cfop: string;
  cd_barras: string;
  fis_nfe_itens_alter_entrada: unknown[];
  fis_nfe: {
    fis_fornecedor: {
      id: string;
      dt_created: string;
      dt_updated: string;
      id_externo: string | null;
      id_empresa_externo: string | null;
      ds_nome: string;
      ds_endereco: string;
      ds_cep: string;
      ds_inscricao: string;
      ds_telefone: string;
      ds_inscricao_municipal: string;
      ds_bairro: string;
      ds_email: string;
      ds_codigo_municipio: number;
      ds_complemento: string;
      dt_cadastro: string | null;
      ds_ibge: string | null;
      ds_documento: string;
      ds_codigo_uf: string | null;
      ds_status: string;
      id_fis_empresas: string;
    };
  };
}

export const getNFEItems = async (nfeId: string, companyId: string): Promise<NFEItem[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fiscal/nfe/items/${nfeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Company-ID': companyId,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar itens da NFE: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar itens da NFE:', error);
    throw error;
  }
};
