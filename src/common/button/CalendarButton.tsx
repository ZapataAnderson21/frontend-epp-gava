import { FaRegCalendar } from "react-icons/fa6";
import { Button } from "../../components";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface ReturnButtonProps {
  disabled?: boolean;
}

export default function ReturnButton({ disabled }: ReturnButtonProps) {

  const { id: projectId } = useParams<{ id: string }>();

  const [value, setValue] = useState<Date>(new Date());
  const [visible, setVisible] = useState(false);

  const navigate = useNavigate();

  const handleClickDay = (date: Date) => {
    setValue(date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    navigate(`/admin/projects/payrolls/attendances/${projectId}?date=${year}-${month}-${day}`);
  };

  return (
    <div className="relative">
      <Button
        icon={<FaRegCalendar />}
        label="Asistencias"
        onClick={() => setVisible(!visible)}
        bgColor="oklch(27.9% 0.041 260.031)"
        bgHoverColor="#000000"
        type="button"
        disabled={disabled}
      />
      {
        visible && (
          <div className="absolute z-10 mt-2 top-10 right-0">
            <Calendar
              value={value}
              onChange={(date) => setValue(date as Date)}
              onClickDay={handleClickDay}
              className="border-0 rounded-md text-sm text-gray-700"
              tileClassName={({ date, view }) => 
                view === 'month' && date.toDateString() === value.toDateString()
                  ? 'bg-blue-500 text-white rounded'
                  : 'hover:bg-blue-100'
              }
            />
          </div>
        )
      }
    </div>
  );
}
