import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa6';
import { Button } from '../../components';
import { SelectForm } from '../../common/form';
import { HeaderPanel, Panel } from '../../common/panel';
import ElementTable from './ElementTable';

const options = [
  { value: "all", label: "Todos" },
  { value: "security", label: "de Protección Personal (EPP)" },
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

  return (
    <Panel>
      <HeaderPanel name={`ELEMENTOS ${selected.label.toUpperCase()}`}>
          
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

          <Button
              icon={<FaPlus />}
              label="Añadir"
              onClick={() => window.location.href = `/admin/elements/new?type=${filter}`}
              bgColor="#0047a3"
              bgHoverColor="#003a80"
            />  
        </HeaderPanel>

        <ElementTable filter={filter} />
    </Panel>
  );
}
