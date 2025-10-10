import { motion } from "framer-motion";

interface ButtonSubmitProps {
  label: string;
  loading: boolean;
  loadingLabel?: string;
}

export default function ButtonSubmit({ loading, label, loadingLabel }: ButtonSubmitProps) {
  return (
    <motion.button
      initial={{ scale: 0.8 }} 
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type="submit"
      disabled={loading}
      className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003366] cursor-pointer hover:scale-[101%] font-bold disabled:opacity-50"
    >
      {loading ? loadingLabel : label}
    </motion.button>
  )
}
