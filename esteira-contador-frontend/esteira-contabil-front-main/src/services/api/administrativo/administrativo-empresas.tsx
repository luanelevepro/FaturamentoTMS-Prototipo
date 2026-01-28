import { fetchData } from './../request-handler';

export async function getSisEmpresasByAdmEmpresasList(admEmpresas: string[]) {
    return await fetchData(`/api/administrativo/empresas`, { admEmpresas }, "POST");
}
