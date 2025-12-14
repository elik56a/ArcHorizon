
import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { ArcSpecsForm } from './specs/ArcSpecsForm';
import { PlumbingSpecsForm } from './specs/PlumbingSpecsForm';

export const SpecsTab: React.FC = () => {
    const { getDiscipline } = useProjectStore();
    const discipline = getDiscipline();

    switch (discipline) {
        case 'plumbing':
            return <PlumbingSpecsForm />;
        case 'elec':
            return <div className="p-8 text-center text-gray-500 text-sm font-bold">Electrical Spec Form Coming Soon</div>;
        case 'hvac':
            return <div className="p-8 text-center text-gray-500 text-sm font-bold">HVAC Spec Form Coming Soon</div>;
        case 'arc':
        default:
            return <ArcSpecsForm />;
    }
};
