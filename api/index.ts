import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

export type AIGroupActionResult = null | string;

export type AIGroupResourceScopeType = 0 | 1 | 2;

export type AIGroupResourceIdList = null | number[];

export interface AIGroupCreateParams {
  name: string;
  description?: null | string;
}

export interface AIGroupUpdateParams {
  description?: null | string;
  name?: null | string;
}

export interface AIGroupResourceParams {
  expert_ids?: AIGroupResourceIdList;
  knowledge_ids?: AIGroupResourceIdList;
  mcp_ids?: AIGroupResourceIdList;
  model_ids?: AIGroupResourceIdList;
  provider_ids?: AIGroupResourceIdList;
  skill_ids?: AIGroupResourceIdList;
}

export interface AIGroupQueryParams {
  name?: null | string;
  page?: number;
  size?: number;
}

export interface AIGroupUserParams {
  user_ids: number[];
}

export interface AIGroupResult extends AIGroupCreateParams {
  id: number;
  created_time: string;
  updated_time?: null | string;
}

export interface AIGroupDetailResult
  extends AIGroupResourceParams, AIGroupResult {}

export interface AIGroupUserResult {
  id: number;
  group_id: number;
  user_id: number;
  created_time: string;
  updated_time?: null | string;
}

export async function getAllAIGroupApi() {
  return requestClient.get<AIGroupResult[]>('/api/v1/ai-groups/all');
}

export async function getAIGroupDetailApi(pk: number) {
  return requestClient.get<AIGroupDetailResult>(`/api/v1/ai-groups/${pk}`);
}

export async function getAIGroupListApi(params?: AIGroupQueryParams) {
  return requestClient.get<PaginationResult<AIGroupResult>>(
    '/api/v1/ai-groups',
    { params },
  );
}

export async function getUserAIGroupApi(userId: number) {
  return requestClient.get<AIGroupResult[]>(
    `/api/v1/ai-groups/users/${userId}`,
  );
}

export async function getAIGroupUserApi(pk: number) {
  return requestClient.get<AIGroupUserResult[]>(
    `/api/v1/ai-groups/${pk}/users`,
  );
}

export async function createAIGroupApi(data: AIGroupCreateParams) {
  return requestClient.post<AIGroupActionResult>('/api/v1/ai-groups', data);
}

export async function updateAIGroupApi(pk: number, data: AIGroupUpdateParams) {
  return requestClient.put<AIGroupActionResult>(
    `/api/v1/ai-groups/${pk}`,
    data,
  );
}

export async function updateAIGroupResourceApi(
  pk: number,
  data: AIGroupResourceParams,
) {
  return requestClient.put<AIGroupActionResult>(
    `/api/v1/ai-groups/${pk}/resources`,
    data,
  );
}

export async function bindAIGroupUserApi(pk: number, data: AIGroupUserParams) {
  return requestClient.post<AIGroupActionResult>(
    `/api/v1/ai-groups/${pk}/users`,
    data,
  );
}

export async function unbindAIGroupUserApi(
  pk: number,
  data: AIGroupUserParams,
) {
  return requestClient.delete<AIGroupActionResult>(
    `/api/v1/ai-groups/${pk}/users`,
    { data },
  );
}

export async function deleteAIGroupApi(pks: number[]) {
  return requestClient.delete<AIGroupActionResult>('/api/v1/ai-groups', {
    data: { pks },
  });
}
