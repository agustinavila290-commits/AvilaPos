/**
 * Servicio para funcionalidades del sistema (backups, logs, etc.)
 */
import api from './api';

const BASE_URL = '/sistema';

// ============ BACKUPS ============

export const getBackupLogs = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/backups/`, { params });
  return response.data;
};

export const crearBackup = async () => {
  const response = await api.post(`${BASE_URL}/backups/crear/`);
  return response.data;
};

export const listarArchivosBackup = async () => {
  const response = await api.get(`${BASE_URL}/backups/listar_archivos/`);
  return response.data;
};

export const restaurarBackup = async (filename) => {
  const response = await api.post(`${BASE_URL}/backups/restaurar/`, { filename });
  return response.data;
};

export const eliminarBackup = async (filename) => {
  const response = await api.delete(`${BASE_URL}/backups/eliminar/`, { data: { filename } });
  return response.data;
};

export const getEstadisticasBackup = async () => {
  const response = await api.get(`${BASE_URL}/backups/estadisticas/`);
  return response.data;
};

export const descargarBackup = async (backupId) => {
  const response = await api.get(`${BASE_URL}/backups/${backupId}/descargar/`, {
    responseType: 'blob'
  });
  
  // Crear link de descarga
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `backup_${backupId}.sql`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

// ============ AUDIT LOGS ============

export const getAuditLogs = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/audit-logs/`, { params });
  return response.data;
};

export const getAuditLog = async (id) => {
  const response = await api.get(`${BASE_URL}/audit-logs/${id}/`);
  return response.data;
};

export const getEstadisticasAudit = async () => {
  const response = await api.get(`${BASE_URL}/audit-logs/estadisticas/`);
  return response.data;
};

// ============ EXPORTACIONES EXCEL ============

export const exportarVentasExcel = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/export/ventas/`, {
    params,
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ventas_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

export const exportarProductosExcel = async () => {
  const response = await api.get(`${BASE_URL}/export/productos/`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `productos_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

export const exportarClientesExcel = async () => {
  const response = await api.get(`${BASE_URL}/export/clientes/`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `clientes_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

export const exportarInventarioExcel = async () => {
  const response = await api.get(`${BASE_URL}/export/inventario/`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `inventario_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

export const exportarComprasExcel = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/export/compras/`, {
    params,
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `compras_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};
