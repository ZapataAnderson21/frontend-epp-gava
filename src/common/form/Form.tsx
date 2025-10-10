import { motion } from "framer-motion";

interface FormProps {
  name: string;
  children: React.ReactNode;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  baseDelay?: number;     // delay inicial opcional
  stagger?: number;       // separación entre elementos
}

export default function Form({
  name,
  children,
  handleSubmit,
  baseDelay = 0.1,
  stagger = 0.08
}: FormProps) {

  // Variantes del contenedor del form (controla el delay entre hijos)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: baseDelay,
        staggerChildren: stagger
      }
    }
  };

  // Variantes para cada hijo del form
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
        <motion.h1
          className="text-2xl font-bold mb-4"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1 }}
        >
          {name}
        </motion.h1>
      </div>

      <motion.div
        className="flex flex-col items-start justify-start gap-4 w-full h-full text-gray-600"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.form
          className="flex flex-col gap-4 w-full max-w-2xl"
          onSubmit={handleSubmit}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Array.isArray(children)
            ? children.map((child, i) => (
                <motion.div key={i} variants={itemVariants}>
                  {child}
                </motion.div>
              ))
            : <motion.div variants={itemVariants}>{children}</motion.div>
          }
        </motion.form>
      </motion.div>
    </div>
  );
}
