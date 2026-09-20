<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  AIGroupCreateParams,
  AIGroupDetailResult,
  AIGroupResourceIdList,
  AIGroupResourceScopeType,
  AIGroupResult,
} from '../api';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SysUserResult } from '#/api';

import { computed, h, reactive, ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSysUserListApi } from '#/api';
import {
  getAllAIExpertApi,
  getAllAIKnowledgeBaseApi,
  getAllAIMcpApi,
  getAllAIModelApi,
  getAllAIProviderApi,
  getAllAISkillApi,
} from '#/plugins/ai-buddy/api';

import {
  bindAIGroupUserApi,
  createAIGroupApi,
  deleteAIGroupApi,
  getAIGroupDetailApi,
  getAIGroupListApi,
  getAIGroupUserApi,
  unbindAIGroupUserApi,
  updateAIGroupResourceApi,
} from '../api';
import {
  AI_GROUP_VISIBILITY_OPTIONS,
  querySchema,
  schema,
  useColumns,
} from './data';

type ResourceIdsKey =
  | 'expert_ids'
  | 'knowledge_ids'
  | 'mcp_ids'
  | 'model_ids'
  | 'provider_ids'
  | 'skill_ids';

interface SelectOption {
  label: string;
  value: number;
}

interface UserSelectOption extends SelectOption {
  username: string;
}

interface UserListResponse {
  items: SysUserResult[];
  total_pages?: number;
}

interface ResourceSection {
  emptyText: string;
  icon: string;
  idsKey: ResourceIdsKey;
  options: SelectOption[];
  title: string;
}

interface AIGroupFormValues extends AIGroupCreateParams {
  expert_ids: AIGroupResourceIdList;
  id?: number;
  knowledge_ids: AIGroupResourceIdList;
  mcp_ids: AIGroupResourceIdList;
  model_ids: AIGroupResourceIdList;
  provider_ids: AIGroupResourceIdList;
  skill_ids: AIGroupResourceIdList;
}

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.form.query'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AIGroupResult> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    custom: true,
    export: true,
    print: true,
    refresh: { code: 'query' },
    zoom: true,
  },
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const pageData = await getAIGroupListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
        return pageData;
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const providerOptions = ref<SelectOption[]>([]);
const modelOptions = ref<SelectOption[]>([]);
const mcpOptions = ref<SelectOption[]>([]);
const expertOptions = ref<SelectOption[]>([]);
const knowledgeOptions = ref<SelectOption[]>([]);
const skillOptions = ref<SelectOption[]>([]);
const resourcesLoading = ref(false);
const activeResourceKey = ref<ResourceIdsKey>('provider_ids');
const resourceKeywords = reactive<Record<ResourceIdsKey, string>>({
  expert_ids: '',
  knowledge_ids: '',
  mcp_ids: '',
  model_ids: '',
  provider_ids: '',
  skill_ids: '',
});
const resourceScopes = reactive<Record<ResourceIdsKey, AIGroupResourceScopeType>>({
  expert_ids: 0,
  knowledge_ids: 0,
  mcp_ids: 0,
  model_ids: 0,
  provider_ids: 0,
  skill_ids: 0,
});
const userKeyword = ref('');
const userOptions = ref<UserSelectOption[]>([]);
const usersLoading = ref(false);
const usersLoadingMore = ref(false);
const userPage = ref(1);
const userTotalPages = ref(1);
const initialUserIds = ref<number[]>([]);
const selectedUserIds = ref<number[]>([]);

const formState = reactive<AIGroupFormValues>(buildEmptyFormValues());
const currentGroup = ref<AIGroupDetailResult | AIGroupResult>();

const resourceSections = computed<ResourceSection[]>(() => [
  {
    emptyText: $t('ai-buddy-group.panel.emptyProvider'),
    icon: 'icon-[lucide--server] -mb-1 size-5',
    idsKey: 'provider_ids',
    options: providerOptions.value,
    title: $t('ai-buddy-group.resource.provider'),
  },
  {
    emptyText: $t('ai-buddy-group.panel.emptyModel'),
    icon: 'icon-[lucide--brain] -mb-1 size-5',
    idsKey: 'model_ids',
    options: modelOptions.value,
    title: $t('ai-buddy-group.resource.model'),
  },
  {
    emptyText: $t('ai-buddy-group.panel.emptyMcp'),
    icon: 'icon-[lucide--terminal-square] -mb-1 size-5',
    idsKey: 'mcp_ids',
    options: mcpOptions.value,
    title: $t('ai-buddy-group.resource.mcp'),
  },
  {
    emptyText: $t('ai-buddy-group.panel.emptyExpert'),
    icon: 'icon-[lucide--star] -mb-1 size-5',
    idsKey: 'expert_ids',
    options: expertOptions.value,
    title: $t('ai-buddy-group.resource.expert'),
  },
  {
    emptyText: $t('ai-buddy-group.panel.emptyKnowledge'),
    icon: 'icon-[lucide--book-open] -mb-1 size-5',
    idsKey: 'knowledge_ids',
    options: knowledgeOptions.value,
    title: $t('ai-buddy-group.resource.knowledge'),
  },
  {
    emptyText: $t('ai-buddy-group.panel.emptySkill'),
    icon: 'icon-[lucide--puzzle] -mb-1 size-5',
    idsKey: 'skill_ids',
    options: skillOptions.value,
    title: $t('ai-buddy-group.resource.skill'),
  },
]);

const resourceTabItems = computed(() =>
  resourceSections.value.map((section) => ({
    icon: () => h('span', { class: section.icon }),
    key: section.idsKey,
    label: section.title,
  })),
);

function onRefresh() {
  gridApi.query();
}

function buildEmptyFormValues(): AIGroupFormValues {
  return {
    description: undefined,
    expert_ids: null,
    knowledge_ids: null,
    mcp_ids: null,
    model_ids: null,
    name: '',
    provider_ids: null,
    skill_ids: null,
  };
}

function getScopeFromIds(
  ids?: AIGroupResourceIdList,
): AIGroupResourceScopeType {
  if (ids === null || ids === undefined) {
    return 0;
  }
  return ids.length === 0 ? 1 : 2;
}

function normalizeIds(ids?: null | number[]) {
  return Array.isArray(ids) ? ids : [];
}

function resetFormState(data?: AIGroupDetailResult) {
  Object.assign(formState, buildEmptyFormValues(), data || {});
  resourceScopes.provider_ids = getScopeFromIds(formState.provider_ids);
  resourceScopes.model_ids = getScopeFromIds(formState.model_ids);
  resourceScopes.mcp_ids = getScopeFromIds(formState.mcp_ids);
  resourceScopes.expert_ids = getScopeFromIds(formState.expert_ids);
  resourceScopes.knowledge_ids = getScopeFromIds(formState.knowledge_ids);
  resourceScopes.skill_ids = getScopeFromIds(formState.skill_ids);
  activeResourceKey.value = 'provider_ids';
}

function normalizeResourceFormValues(
  values: AIGroupFormValues,
): Required<Pick<AIGroupFormValues, ResourceIdsKey>> {
  const normalizeSectionIds = (key: ResourceIdsKey) => {
    const scope = resourceScopes[key];
    if (scope === 0) {
      return null;
    }
    if (scope === 1) {
      return [];
    }
    return normalizeIds(values[key]);
  };

  return {
    expert_ids: normalizeSectionIds('expert_ids'),
    knowledge_ids: normalizeSectionIds('knowledge_ids'),
    mcp_ids: normalizeSectionIds('mcp_ids'),
    model_ids: normalizeSectionIds('model_ids'),
    provider_ids: normalizeSectionIds('provider_ids'),
    skill_ids: normalizeSectionIds('skill_ids'),
  };
}


function validateResourceForm() {
  if (!currentGroup.value?.id) {
    message.warning($t('ai-buddy-group.message.selectGroupFirst'));
    return false;
  }
  return true;
}

function getSectionScope(section: ResourceSection) {
  return resourceScopes[section.idsKey];
}

function updateSectionScope(
  section: ResourceSection,
  value: AIGroupResourceScopeType,
) {
  resourceScopes[section.idsKey] = value;
  if (value === 0) {
    formState[section.idsKey] = null;
  } else if (value === 1) {
    formState[section.idsKey] = [];
  } else if (!Array.isArray(formState[section.idsKey])) {
    formState[section.idsKey] = [];
  }
}

function getSectionIds(section: ResourceSection) {
  return normalizeIds(formState[section.idsKey]);
}

function setSectionIds(section: ResourceSection, ids: number[]) {
  formState[section.idsKey] = normalizeIds(ids);
}

function getFilteredOptions(section: ResourceSection) {
  const keyword = resourceKeywords[section.idsKey].trim().toLowerCase();

  if (!keyword) {
    return section.options;
  }

  return section.options.filter((item) =>
    item.label.toLowerCase().includes(keyword),
  );
}

function isAllFilteredSelected(section: ResourceSection) {
  const filteredOptions = getFilteredOptions(section);
  const selectedIds = getSectionIds(section);
  return (
    filteredOptions.length > 0 &&
    filteredOptions.every((item) => selectedIds.includes(item.value))
  );
}

function isPartiallyFilteredSelected(section: ResourceSection) {
  const filteredOptions = getFilteredOptions(section);
  if (filteredOptions.length === 0) {
    return false;
  }

  const selectedIds = getSectionIds(section);
  const selectedCount = filteredOptions.filter((item) =>
    selectedIds.includes(item.value),
  ).length;

  return selectedCount > 0 && selectedCount < filteredOptions.length;
}

function updateAllFiltered(section: ResourceSection, checked: boolean) {
  const nextIds = new Set(getSectionIds(section));

  for (const item of getFilteredOptions(section)) {
    if (checked) {
      nextIds.add(item.value);
    } else {
      nextIds.delete(item.value);
    }
  }

  formState[section.idsKey] = [...nextIds];
}

function getAddableCount(section: ResourceSection) {
  const selectedIds = getSectionIds(section);
  return section.options.filter(
    (item) => !selectedIds.includes(item.value),
  ).length;
}

function isSectionOptionSelected(section: ResourceSection, value: number) {
  return getSectionIds(section).includes(value);
}

function normalizeUserIds(ids: number[]) {
  return [...new Set(ids)];
}

function getUserListItems(response: unknown) {
  return (response as UserListResponse).items ?? [];
}

function getUserTotalPages(response: unknown) {
  return Math.max((response as UserListResponse).total_pages ?? 1, 1);
}

function appendUserOptions(items: SysUserResult[]) {
  const optionMap = new Map(userOptions.value.map((item) => [item.value, item]));
  for (const item of items) {
    optionMap.set(item.id, {
      label: item.nickname || item.username,
      username: item.username,
      value: item.id,
    });
  }
  userOptions.value = [...optionMap.values()];
}

async function loadUserOptions(reset = true) {
  if (reset) {
    userPage.value = 1;
    userTotalPages.value = 1;
    userOptions.value = [];
    usersLoading.value = true;
  } else if (
    usersLoading.value ||
    usersLoadingMore.value ||
    userPage.value >= userTotalPages.value
  ) {
    return;
  } else {
    usersLoadingMore.value = true;
  }

  try {
    const size = 200;
    const username = userKeyword.value.trim() || undefined;
    const nextPage = reset ? 1 : userPage.value + 1;
    const response = await getSysUserListApi({
      page: nextPage,
      size,
      username,
    });
    userPage.value = nextPage;
    userTotalPages.value = getUserTotalPages(response);
    appendUserOptions(getUserListItems(response));
  } finally {
    if (reset) {
      usersLoading.value = false;
    } else {
      usersLoadingMore.value = false;
    }
  }
}

function onUserListScroll(event: Event) {
  const target = event.target as HTMLElement;
  const distanceToBottom =
    target.scrollHeight - target.scrollTop - target.clientHeight;
  if (distanceToBottom <= 24) {
    loadUserOptions(false);
  }
}

async function openUserDrawer(row: AIGroupResult) {
  currentGroup.value = row;
  userKeyword.value = '';
  await loadUserOptions();
  const users = await getAIGroupUserApi(row.id);
  initialUserIds.value = users.map((item) => item.user_id);
  selectedUserIds.value = [...initialUserIds.value];
  userDrawerApi
    .setData(row)
    .setState({
      title: $t('ai-buddy-group.userDrawer.title'),
    })
    .open();
}

async function loadResourceOptions() {
  resourcesLoading.value = true;
  try {
    const providers = await getAllAIProviderApi();
    const providerNameMap = new Map(
      providers.map((item) => [item.id, item.name] as const),
    );
    providerOptions.value = providers.map((item) => ({
      label: item.name,
      value: item.id,
    }));

    const [modelGroups, mcps, experts, knowledgeBases, skills] =
      await Promise.all([
        Promise.all(
          providers.map((item) => getAllAIModelApi({ provider_id: item.id })),
        ),
        getAllAIMcpApi(),
        getAllAIExpertApi(),
        getAllAIKnowledgeBaseApi(),
        getAllAISkillApi(),
      ]);

    modelOptions.value = modelGroups.flat().map((item) => ({
      label: `${providerNameMap.get(item.provider_id) ?? item.provider_id} · ${item.model_id}`,
      value: item.id,
    }));
    mcpOptions.value = mcps.map((item) => ({
      label: item.name,
      value: item.id,
    }));
    expertOptions.value = experts.map((item) => ({
      label: item.name,
      value: item.id,
    }));
    knowledgeOptions.value = knowledgeBases.map((item) => ({
      label: item.name,
      value: item.id,
    }));
    skillOptions.value = skills.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  } finally {
    resourcesLoading.value = false;
  }
}

async function openConfigDrawer(row: AIGroupResult) {
  await loadResourceOptions();
  const detail = await getAIGroupDetailApi(row.id);
  currentGroup.value = detail;
  resetFormState(detail);
  drawerApi
    .setData(detail)
    .setState({
      title: $t('ai-buddy-group.drawer.title'),
    })
    .open();
}

async function onActionClick({
  code,
  row,
}: OnActionClickParams<AIGroupResult>) {
  switch (code) {
    case 'config': {
      await openConfigDrawer(row);
      break;
    }
    case 'config_user': {
      await openUserDrawer(row);
      break;
    }
    case 'delete': {
      await deleteAIGroupApi([row.id]);
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      onRefresh();
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-1/3',
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    modalApi.lock();
    try {
      const data =
        await formApi.getValues<
          Pick<AIGroupCreateParams, 'description' | 'name'>
        >();
      await createAIGroupApi({
        description: data.description?.trim() || undefined,
        name: data.name.trim(),
      });
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      onRefresh();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
    }
  },
});

const [Drawer, drawerApi] = useVbenDrawer({
  cancelText: $t('ai-buddy-group.drawer.cancel'),
  class: 'ai-group-resource-drawer',
  confirmText: $t('ai-buddy-group.drawer.save'),
  contentClass: 'h-full overflow-hidden p-0',
  destroyOnClose: true,
  footerClass: 'px-5 py-3',
  header: true,
  title: $t('ai-buddy-group.drawer.title'),
  async onConfirm() {
    if (!validateResourceForm()) {
      return;
    }

    drawerApi.lock();
    try {
      const payload = normalizeResourceFormValues(formState);
      await updateAIGroupResourceApi(currentGroup.value!.id!, payload);
      message.success($t('ui.actionMessage.operationSuccess'));
      await drawerApi.close();
      onRefresh();
    } finally {
      drawerApi.unlock();
    }
  },
  onClosed() {
    currentGroup.value = undefined;
    resetFormState();
  },
});

const [UserDrawer, userDrawerApi] = useVbenDrawer({
  cancelText: $t('ai-buddy-group.userDrawer.cancel'),
  class: 'ai-group-user-drawer',
  confirmText: $t('ai-buddy-group.userDrawer.save'),
  contentClass: 'h-full overflow-hidden p-0',
  destroyOnClose: true,
  footerClass: 'px-5 py-3',
  header: true,
  title: $t('ai-buddy-group.userDrawer.title'),
  async onConfirm() {
    if (!currentGroup.value?.id) {
      message.warning($t('ai-buddy-group.message.selectGroupFirst'));
      return;
    }

    const selectedIds = normalizeUserIds(selectedUserIds.value);
    const previousIds = new Set(initialUserIds.value);
    const selectedIdSet = new Set(selectedIds);
    const addUserIds = selectedIds.filter((id) => !previousIds.has(id));
    const removeUserIds = initialUserIds.value.filter(
      (id) => !selectedIdSet.has(id),
    );

    userDrawerApi.lock();
    try {
      if (addUserIds.length > 0) {
        await bindAIGroupUserApi(currentGroup.value.id, {
          user_ids: addUserIds,
        });
      }
      if (removeUserIds.length > 0) {
        await unbindAIGroupUserApi(currentGroup.value.id, {
          user_ids: removeUserIds,
        });
      }
      message.success($t('ui.actionMessage.operationSuccess'));
      await userDrawerApi.close();
      onRefresh();
    } finally {
      userDrawerApi.unlock();
    }
  },
  onClosed() {
    currentGroup.value = undefined;
    userKeyword.value = '';
    initialUserIds.value = [];
    selectedUserIds.value = [];
    userOptions.value = [];
  },
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          {{ $t('ai-buddy-group.action.add') }}
        </VbenButton>
      </template>
    </Grid>

    <Modal
      content-class="px-4 py-4 md:px-5 md:py-5"
      :title="$t('ai-buddy-group.modal.addTitle')"
    >
      <Form />
    </Modal>

    <Drawer>
      <a-card
        class="resource-config-card h-full overflow-y-auto rounded-[var(--radius)]"
        variant="borderless"
      >
        <a-tabs
          v-model:active-key="activeResourceKey"
          animated
          class="resource-config-tabs h-full"
          tab-placement="start"
          :items="resourceTabItems"
          :tab-bar-style="{ width: '20%', 'margin-top': '20px' }"
        >
          <template #contentRender="{ item }">
            <template v-for="section in resourceSections" :key="section.idsKey">
              <main
                v-if="item.key === section.idsKey"
                class="box-border flex h-full min-h-0 min-w-0 flex-col pt-6 pr-6 pb-6"
              >
                <header class="mb-4 flex items-center">
                  <a-radio-group
                    button-style="solid"
                    :options="AI_GROUP_VISIBILITY_OPTIONS"
                    option-type="button"
                    :value="getSectionScope(section)"
                    @update:value="
                      (value) => updateSectionScope(section, value)
                    "
                  />
                </header>

                <section class="relative min-h-0 flex-1 overflow-hidden">
                  <div
                    v-if="getSectionScope(section) === 0"
                    class="absolute inset-0 flex items-center justify-center text-center text-sm font-medium text-muted-foreground"
                  >
                    {{ $t('ai-buddy-group.panel.allVisibleHint') }}
                  </div>

                  <div
                    v-else-if="getSectionScope(section) === 1"
                    class="absolute inset-0 flex items-center justify-center text-center text-sm font-medium text-muted-foreground"
                  >
                    {{ $t('ai-buddy-group.panel.noneVisibleHint') }}
                  </div>

                  <template v-else>
                    <div class="flex h-full min-h-0 flex-col gap-4">
                      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <a-input
                          v-model:value="resourceKeywords[section.idsKey]"
                          allow-clear
                          class="min-w-0 flex-1"
                          :placeholder="
                            $t('ai-buddy-group.panel.searchPlaceholder', [
                              section.title,
                            ])
                          "
                        />
                        <div class="flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <a-checkbox
                            :disabled="getFilteredOptions(section).length === 0"
                            :checked="isAllFilteredSelected(section)"
                            :indeterminate="isPartiallyFilteredSelected(section)"
                            @update:checked="
                              (checked) => updateAllFiltered(section, checked)
                            "
                          >
                            {{ $t('ai-buddy-group.panel.selectFiltered') }}
                          </a-checkbox>
                          <span>
                            {{
                              $t('ai-buddy-group.panel.addable', [
                                getAddableCount(section),
                              ])
                            }}
                          </span>
                          <span>
                            {{
                              $t('ai-buddy-group.panel.selected', [
                                getSectionIds(section).length,
                              ])
                            }}
                          </span>
                        </div>
                      </div>

                      <section class="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-muted/20">
                        <div
                          v-if="resourcesLoading"
                          class="flex h-full min-h-[360px] items-center justify-center"
                        >
                          <a-spin />
                        </div>

                        <div
                          v-else-if="section.options.length === 0"
                          class="flex h-full min-h-[360px] items-center justify-center"
                        >
                          <a-empty :description="section.emptyText" />
                        </div>

                        <div
                          v-else-if="getFilteredOptions(section).length === 0"
                          class="flex h-full min-h-[360px] items-center justify-center"
                        >
                          <a-empty :description="$t('ai-buddy-group.panel.noMatch')" />
                        </div>

                        <a-checkbox-group
                          v-else
                          :value="getSectionIds(section)"
                          class="block h-full w-full"
                          @update:value="
                            (value) => setSectionIds(section, value)
                          "
                        >
                          <div class="h-full w-full overflow-y-auto">
                            <div class="w-full space-y-2 p-3">
                              <div
                                v-for="resource in getFilteredOptions(section)"
                                :key="resource.value"
                                class="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors"
                                :class="
                                  isSectionOptionSelected(
                                    section,
                                    resource.value,
                                  )
                                    ? 'bg-muted/35'
                                    : 'bg-card/70 hover:border-primary/40 hover:bg-accent/55'
                                "
                              >
                                <a-checkbox :value="resource.value">
                                  <span class="break-all text-sm text-foreground">
                                    {{ resource.label }}
                                  </span>
                                </a-checkbox>
                                <div class="flex shrink-0 items-center gap-2">
                                  <a-tag
                                    v-if="
                                      isSectionOptionSelected(
                                        section,
                                        resource.value,
                                      )
                                    "
                                  >
                                    {{ $t('ai-buddy-group.panel.added') }}
                                  </a-tag>
                                  <a-tag v-else color="blue">
                                    {{ $t('ai-buddy-group.panel.available') }}
                                  </a-tag>
                                </div>
                              </div>
                            </div>
                          </div>
                        </a-checkbox-group>
                      </section>
                    </div>
                  </template>
                </section>
              </main>
            </template>
          </template>
        </a-tabs>
      </a-card>
    </Drawer>

    <UserDrawer>
      <div class="box-border flex h-full min-h-0 flex-col gap-4 p-5">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <a-input-search
            v-model:value="userKeyword"
            allow-clear
            class="min-w-0 flex-1"
            :loading="usersLoading"
            :placeholder="$t('ai-buddy-group.userDrawer.searchPlaceholder')"
            @search="() => loadUserOptions(true)"
          />
          <div class="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span>
              {{
                $t('ai-buddy-group.userDrawer.selected', [selectedUserIds.length])
              }}
            </span>
          </div>
        </div>

        <section class="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-muted/20">
          <div
            v-if="usersLoading"
            class="flex h-full min-h-[360px] items-center justify-center"
          >
            <a-spin />
          </div>

          <div
            v-else-if="userOptions.length === 0"
            class="flex h-full min-h-[360px] items-center justify-center"
          >
            <a-empty :description="$t('ai-buddy-group.userDrawer.empty')" />
          </div>

          <a-checkbox-group
            v-else
            v-model:value="selectedUserIds"
            class="block h-full w-full"
          >
            <div
              class="h-full w-full overflow-y-auto"
              @scroll="onUserListScroll"
            >
              <div class="w-full space-y-2 p-3">
                <div
                  v-for="user in userOptions"
                  :key="user.value"
                  class="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors"
                  :class="
                    selectedUserIds.includes(user.value)
                      ? 'bg-muted/35'
                      : 'bg-card/70 hover:border-primary/40 hover:bg-accent/55'
                  "
                >
                  <a-checkbox :value="user.value">
                    <span class="inline-flex min-w-0 items-baseline gap-2">
                      <span class="break-all text-sm text-foreground">
                        {{ user.label }}
                      </span>
                      <span
                        v-if="user.username !== user.label"
                        class="shrink-0 text-xs text-muted-foreground"
                      >
                        {{ user.username }}
                      </span>
                    </span>
                  </a-checkbox>
                  <div class="flex shrink-0 items-center gap-2">
                    <a-tag v-if="selectedUserIds.includes(user.value)">
                      {{ $t('ai-buddy-group.userDrawer.bound') }}
                    </a-tag>
                    <a-tag v-else color="blue">
                      {{ $t('ai-buddy-group.userDrawer.available') }}
                    </a-tag>
                  </div>
                </div>
                <div
                  v-if="usersLoadingMore"
                  class="flex items-center justify-center py-3"
                >
                  <a-spin size="small" />
                </div>
              </div>
            </div>
          </a-checkbox-group>
        </section>
      </div>
    </UserDrawer>
  </Page>
</template>

<style lang="scss">
.ai-group-resource-drawer {
  width: min(1080px, calc(100vw - 48px)) !important;
  max-width: none !important;
}

.ai-group-user-drawer {
  width: min(760px, calc(100vw - 48px)) !important;
  max-width: none !important;
}

.ai-group-resource-drawer .ant-drawer-body {
  height: 100%;
}

.ai-group-resource-drawer .resource-config-card > .ant-card-body {
  height: 100%;
  min-height: 100%;
  padding: 0;
}

.ai-group-resource-drawer .resource-config-tabs > .ant-tabs-nav {
  height: 100%;
  margin: 0;
}

.ai-group-resource-drawer .resource-config-tabs > .ant-tabs-nav::before {
  top: 0;
  bottom: 0;
}

.ai-group-resource-drawer .resource-config-tabs > .ant-tabs-nav > .ant-tabs-nav-wrap {
  height: 100%;
}

.ai-group-resource-drawer .resource-config-tabs > .ant-tabs-content-holder {
  min-width: 0;
  height: 100%;
}

.ai-group-resource-drawer .resource-config-tabs > .ant-tabs-content-holder > .ant-tabs-content,
.ai-group-resource-drawer .resource-config-tabs > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane {
  height: 100%;
}

</style>
