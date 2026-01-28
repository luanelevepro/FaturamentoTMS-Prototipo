import { fetchData } from './request-handler';

interface ModulosUsuario {
	user_id: string;
	modulos: {
		moduleTypes: string[];
	};
}

interface ModulosEmpresa {
	empresa_id: string;
	modulos: {
		moduleTypes: string[];
	};
}

export async function getModulos() {
	return await fetchData('/api/modulos'); // Trás todos os módulos do sistema
}

export async function getModulosUsuario(userId: string) {
	return await fetchData(`/api/modulos/usuario/${userId}`); // Trás os módulos permitidos para um usuário
}

export async function getUserModules() {
	return await fetchData(`/api/modulos/permitidos`);
}

export async function updateModulosUsuario(modulos_usuario: ModulosUsuario) {
	return await fetchData(`/api/modulos/usuario/${modulos_usuario.user_id}`, modulos_usuario.modulos, 'POST'); // Atualiza os módulos permitidos para um usuário
}

export async function getModulosEmpresaUsuario(empresa_id: string, usuario_id: string) {
	return await fetchData(`/api/modulos/empresa/${empresa_id}/usuario/${usuario_id}`); // Trás todos os módulos de um usuário em uma empresa
}

export async function getModulosEmpresa(empresaId: string) {
	return await fetchData(`/api/modulos/empresa/${empresaId}`); // Trás todos os módulos de uma empresa
}

export async function updateModulosEmpresa(modulos_empresa: ModulosEmpresa) {
	return await fetchData(`/api/modulos/empresa/${modulos_empresa.empresa_id}`, modulos_empresa.modulos, 'POST'); // Trás todos os módulos de uma empresa
}
