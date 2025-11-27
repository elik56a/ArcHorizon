
import { SketchData } from '../../../types';

export const normalizeTypes = (data: SketchData): SketchData => {
    data.rooms.forEach(r => {
        if (r.type) r.type = r.type.toLowerCase() as any;
    });
    data.elements.forEach(el => {
        if (el.type) el.type = el.type.toLowerCase() as any;
        if (el.type === ('door_internal' as any) || el.type === ('internal_door' as any)) {
            el.type = 'door';
        }
    });
    return data;
};
