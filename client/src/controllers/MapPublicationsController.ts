import { MapPublication } from '@interfaces/mapPublications';
import { request } from '@src/utils/request';

const apiURL = '/api/map-publications';

export async function getMapPublications() {
  return await request<MapPublication[]>(apiURL, {
    method: 'GET',
  });
}

export async function addMapPublication(data: Omit<MapPublication, 'id'>) {
  return await request<{ id: string }>(apiURL, {
    method: 'POST',
    body: data,
  });
}

export async function deleteMapPublication(id: string) {
  return await request<void>(`${apiURL}/${id}`, {
    method: 'DELETE',
  });
}
