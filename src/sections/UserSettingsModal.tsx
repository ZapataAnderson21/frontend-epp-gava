import { useEffect, useState } from "react";
import { CircleX as IoCloseCircle, X as IoClose } from "lucide-react";
import type { UpdateUserDto, User } from "../data/types";
import { userApi } from "../data/apiUrl";
import { useApiAction } from "../hooks/useApiAction";
import { ButtonContainer, InputForm } from "../common/form";
import { SaveButton } from "../common/button";
import { Button } from "../components";
import toast, { Toaster } from "react-hot-toast";

interface UserSettingsModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUpdated: (user: User) => void;
}

export default function UserSettingsModal({ open, user, onClose, onUpdated }: UserSettingsModalProps) {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const { execute: updateUser, loading: saving } = useApiAction<User>();

  useEffect(() => {
    if (!open) return;
    setName(user?.name ?? "");
    setLastName(user?.lastName ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setErrors([]);
  }, [open, user]);

  if (!open) return null;

  const validate = () => {
    const nextErrors: string[] = [];
    if (!name.trim()) nextErrors.push("El nombre es requerido");
    if (!lastName.trim()) nextErrors.push("El apellido es requerido");
    if (!email.trim()) nextErrors.push("El correo es requerido");

    if (password.trim()) {
      if (password.length < 8) nextErrors.push("La contraseña debe tener al menos 8 caracteres");
      if (!/(?=.*[A-Z])/.test(password)) nextErrors.push("La contraseña debe contener al menos una mayúscula");
      if (!/(?=.*\d)/.test(password)) nextErrors.push("La contraseña debe contener al menos un número");
      if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) nextErrors.push("La contraseña debe contener al menos un carácter especial");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !validate()) return;

    const body: UpdateUserDto = {
      name: name.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      ...(password.trim() ? { password: password.trim() } : {}),
    };

    let response: { statusCode: number; message: string; data: User } | null = null;

    try {
      response = await toast.promise(
        updateUser(`${userApi}me`, "PATCH", body),
        {
          loading: "Actualizando usuario...",
          success: (result) => result.message || "Usuario actualizado exitosamente",
          error: (err) => err.message || "Error al actualizar usuario",
        }
      );
    } catch {
      return;
    }

    if (!response || response.statusCode !== 200) return;

    const updatedUser: User = response.data ?? {
      ...user,
      name: body.name ?? user.name,
      lastName: body.lastName ?? user.lastName,
      email: body.email ?? user.email,
    };

    const storedRaw = localStorage.getItem("user");
    let storedUser: Record<string, unknown> = {};
    if (storedRaw) {
      try {
        storedUser = JSON.parse(storedRaw);
      } catch {
        storedUser = {};
      }
    }

    const mergedUser = {
      ...storedUser,
      ...updatedUser,
      last_name: updatedUser.lastName ?? (storedUser as { last_name?: string }).last_name,
      lastName: updatedUser.lastName ?? (storedUser as { lastName?: string }).lastName,
    };

    localStorage.setItem("user", JSON.stringify(mergedUser));
    onUpdated(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-xl w-full max-w-xl p-8 text-gray-900 overflow-auto max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute right-2 top-2">
          <IoCloseCircle className="size-8 aspect-square cursor-pointer" onClick={onClose} />
        </div>

        <h1 className="text-xl font-extrabold mb-4">CONFIGURACIÓN DE USUARIO</h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <InputForm
            label="Nombre"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <InputForm
            label="Apellido"
            name="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <InputForm
            label="Correo"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputForm
            label="Rol"
            name="role"
            type="text"
            value={user?.userType ?? ""}
            disabled
            onChange={()=>{}}
          />

          <InputForm
            label="Nueva contraseña"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            optional={true}
          />

          {errors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="font-semibold">Revisa los siguientes campos:</p>
              <ul className="list-disc list-inside">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <ButtonContainer>
            <SaveButton loading={saving} />
            <Button
              icon={<IoClose />}
              label="Cancelar"
              onClick={onClose}
              bgColor="#9ca3af"
              bgHoverColor="#6b7280"
              type="button"
            />
          </ButtonContainer>
        </form>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
