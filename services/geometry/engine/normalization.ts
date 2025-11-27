
import { SketchData } from '../../../types';

export const normalizeTypes = (data: SketchData): SketchData => {
    data.elements.forEach(el => {
        if (el.type === ('door_internal' as any) || el.type === ('internal_door' as any)) {
            el.type = 'door';
        }
    });
    return data;
};
