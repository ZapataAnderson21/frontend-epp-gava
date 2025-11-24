import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SelectForm } from '../../common/form';
import { HeaderPanel, Panel } from '../../common/panel';
import ElementTable from './ElementTable';
import AddButton from '../../common/button/AddButton';

const options = [
  { value: "all", label: "Todos" },
  { value: "epp", label: "de Protección Personal (EPP)" },
  { value: "operative", label: "Operativos" },
];

export default function Elements() {

  const { type: elementType } = useParams<{ type?: string }>();

  if (!elementType) {
    return <div className="text-red-500">Tipo de elemento no especificado.</div>;
  }

  const [filter, setFilter] = useState(elementType ?? "all");
  const [selected, setSelected] = useState(options[0]);

  useEffect(() => {
    setFilter(elementType);
    setSelected(options.find(option => option.value === elementType) || options[0]);
  }, [elementType]);

  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name={`ELEMENTOS ${selected.label.toUpperCase()}`}>
          <div className="w-fit">
            <SelectForm 
              label="Filtrar por"
              name="filter"
              value={filter}
              onChange={(value) => {
                const option = options.find(opt => opt.value === value);
                if (option) {
                  setSelected(option);
                  setFilter(option.value);
                }
              }}
              options={options}
              directionRow={true}
            />
          </div> 
          <AddButton onClick={() => {navigate(`/admin/elements/new?type=${filter}`)}} />
        </HeaderPanel>

        <ElementTable filter={filter} />
    </Panel>
  );
}
