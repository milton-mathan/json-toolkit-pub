// src/utils/dragDrop.ts
import { JSONField } from '../types';

export interface DragItem {
  id: string;
  index: number;
  type: string;
  parentId?: string;
}

export const dragDropUtils = {
  // Move field within the same level or to a different parent
  moveField: (
    fields: JSONField[],
    dragId: string,
    hoverId: string,
    hoverParentId?: string
  ): JSONField[] => {
    // Find drag and hover fields
    const { field: dragField } = findFieldWithPath(fields, dragId);
    const { field: hoverField } = findFieldWithPath(fields, hoverId);

    if (!dragField || !hoverField) return fields;

    // Remove drag field from its current position
    const fieldsWithoutDrag = removeField(fields, dragId);

    // Find the position to insert the drag field
    const insertIndex = findInsertIndex(fieldsWithoutDrag, hoverId, hoverParentId);

    // Insert drag field at the new position
    return insertField(fieldsWithoutDrag, dragField, insertIndex, hoverParentId);
  },

  // Check if a field can be dropped on another field
  canDrop: (dragId: string, hoverId: string, fields: JSONField[]): boolean => {
    // Can't drop on itself
    if (dragId === hoverId) return false;

    // Can't drop a parent on its own child
    const dragField = findField(fields, dragId);
    if (dragField && isDescendant(dragField, hoverId)) return false;

    return true;
  },

  // Get drop zone type for visual feedback
  getDropZone: (
    dragItem: DragItem,
    targetId: string,
    position: 'before' | 'after' | 'inside',
    fields: JSONField[]
  ): 'valid' | 'invalid' | 'none' => {
    if (!dragDropUtils.canDrop(dragItem.id, targetId, fields)) {
      return 'invalid';
    }

    const targetField = findField(fields, targetId);
    if (!targetField) return 'none';

    // Inside drop only valid for object/array types
    if (position === 'inside' && targetField.type !== 'object' && targetField.type !== 'array') {
      return 'invalid';
    }

    return 'valid';
  }
};

// Helper functions
const findField = (fields: JSONField[], id: string): JSONField | null => {
  for (const field of fields) {
    if (field.id === id) return field;
    if (field.children) {
      const found = findField(field.children, id);
      if (found) return found;
    }
  }
  return null;
};

const findFieldWithPath = (
  fields: JSONField[],
  id: string,
  path: string[] = []
): { field: JSONField | null; parentPath: string[] } => {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (field.id === id) {
      return { field, parentPath: path };
    }
    if (field.children) {
      const result = findFieldWithPath(field.children, id, [...path, field.id]);
      if (result.field) return result;
    }
  }
  return { field: null, parentPath: [] };
};

const removeField = (fields: JSONField[], id: string): JSONField[] => {
  return fields
    .filter(field => field.id !== id)
    .map(field => ({
      ...field,
      children: field.children ? removeField(field.children, id) : []
    }));
};

const findInsertIndex = (
  fields: JSONField[],
  referenceId: string,
  parentId?: string
): number => {
  if (parentId) {
    // Insert as child of parentId
    const parent = findField(fields, parentId);
    if (parent && parent.children) {
      const refIndex = parent.children.findIndex(f => f.id === referenceId);
      return refIndex >= 0 ? refIndex : parent.children.length;
    }
    return 0;
  } else {
    // Insert at root level
    const refIndex = fields.findIndex(f => f.id === referenceId);
    return refIndex >= 0 ? refIndex : fields.length;
  }
};

const insertField = (
  fields: JSONField[],
  fieldToInsert: JSONField,
  index: number,
  parentId?: string
): JSONField[] => {
  if (parentId) {
    // Insert as child
    return fields.map(field => {
      if (field.id === parentId) {
        const newChildren = [...(field.children || [])];
        newChildren.splice(index, 0, fieldToInsert);
        return { ...field, children: newChildren };
      } else if (field.children) {
        return { ...field, children: insertField(field.children, fieldToInsert, index, parentId) };
      }
      return field;
    });
  } else {
    // Insert at root level
    const newFields = [...fields];
    newFields.splice(index, 0, fieldToInsert);
    return newFields;
  }
};

const isDescendant = (parentField: JSONField, childId: string): boolean => {
  if (!parentField.children) return false;
  
  for (const child of parentField.children) {
    if (child.id === childId) return true;
    if (isDescendant(child, childId)) return true;
  }
  
  return false;
};