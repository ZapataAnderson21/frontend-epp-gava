import { motion } from "framer-motion";
import type { Worker, Attendance } from "../../data/types";
import { useApiAction } from "../../hooks";
import { ymdLocalMidnightToUtc } from "../../utils";
import { attendanceApi } from "../../data/apiUrl";
import { toast, Toaster } from "react-hot-toast";
import { useState } from "react";

interface InputCheckProps {
  attendanceId?: number;
  projectId: number;
  worker: Worker;
  delay: number;
  date: string;
  value: boolean;
}
 
export default function InputCheck( { attendanceId: initialAttendanceId, projectId, worker, date, delay, value: initialValue }: InputCheckProps ) {
  const { execute } = useApiAction();

  const [attendanceId, setAttendanceId] = useState<number | undefined>(initialAttendanceId);
  const [value, setValue] = useState<boolean>(initialValue);

  const handleCheck = async () => {
    
    if(value && attendanceId) {
      await handleDelete();
    } else {
      await handleSave();
    }
    
  }

  const handleSave = async () => {
    const body = {
      workerId: Number(worker.workerId),
      projectId: Number(projectId),
      date: ymdLocalMidnightToUtc(date, 'America/Lima')
    }

    console.log(body);

    toast.promise(
      execute(attendanceApi, "POST", body),
      {
        loading: 'Registrando asistencia...',
        success: (result) => {
          const resultData = result.data as Attendance;
          setValue(true);
          setAttendanceId(resultData.attendanceId);
          return result.message || 'Asistencia registrada.';
        },
        error: (err) => err.message || 'Error al registrar la asistencia.',
      }
    );
  }

  const handleDelete = async () => {
    toast.promise(
      execute(`${attendanceApi}${attendanceId}`, "DELETE"),
      {
        loading: 'Eliminando asistencia...',
        success: (result) => {
          setValue(false);
          setAttendanceId(undefined);
          return result.message || 'Asistencia eliminada.';
        },
        error: (err) => err.message || 'Error al eliminar la asistencia.',
      }
    );
  }

  const rowVariants = {
    hidden: { opacity: 0, y: 4 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.18, delay },
    }),
    exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />  

      <motion.li
        key={worker.workerId}
        custom={delay}
        variants={rowVariants}
        className="flex flex-row items-center gap-2"
      >
        <span className="w-full border border-gray-300 rounded-lg p-2 transition-colors duration-700">
          {worker.fullName}
        </span>
        <input
          type="checkbox"
          className="hover:bg-[#eff2ff] cursor-pointer w-10 h-10 rounded-2xl transition-colors duration-700"
          onChange={handleCheck}
          checked={value}
        />
      </motion.li>
    </>
  );
}