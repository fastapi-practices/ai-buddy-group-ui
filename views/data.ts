import type { AIGroupResult } from '../api';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const AI_GROUP_VISIBILITY_OPTIONS = [
  { label: $t('ai_group.visibility.all'), value: 0 },
  { label: $t('ai_group.visibility.none'), value: 1 },
  { label: $t('ai_group.visibility.specified'), value: 2 },
];

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('ai_group.field.name'),
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('ai_group.field.name'),
    rules: 'required',
  },
  {
    component: 'Textarea',
    componentProps: {
      autoSize: { minRows: 4, maxRows: 6 },
      placeholder: $t('ai_group.field.descriptionPlaceholder'),
    },
    fieldName: 'description',
    label: $t('ai_group.field.description'),
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<AIGroupResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'name', title: $t('ai_group.field.name'), width: 180 },
    {
      field: 'description',
      title: $t('ai_group.field.description'),
      align: 'left',
      minWidth: 220,
    },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 220,
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'config', text: $t('ai_group.action.config') },
          { code: 'config_user', text: $t('ai_group.action.configUser') },
          'delete',
        ],
      },
    },
  ];
}
