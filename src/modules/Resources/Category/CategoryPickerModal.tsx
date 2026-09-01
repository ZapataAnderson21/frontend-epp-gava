import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown as FiChevronDown,
  ChevronRight as FiChevronRight,
  Plus as FiPlus,
  Search as FiSearch,
  X as FiX,
} from "lucide-react";
import { useApiAction, useFetch } from "../../../hooks"; // ajusta el path si es necesario
import { categoryResourceApi } from "../../../data/apiUrl";
import type { CategoryResource } from "../../../data/types";
import { AddButton } from "../../../common/button";

type TreeNode = CategoryResource & { children: TreeNode[] };

interface CategoryPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (category: CategoryResource) => void;
}

function buildTree(flat: CategoryResource[]): TreeNode[] {
  const byId = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  flat.forEach((c) => byId.set(c.categoryResourceId, { ...c, children: [] }));

  byId.forEach((node) => {
    if (node.parentCategoryId == null) {
      roots.push(node);
    } else {
      const parent = byId.get(node.parentCategoryId);
      if (parent) parent.children.push(node);
      else roots.push(node); // por si llega huérfano
    }
  });

  // ordenar alfabéticamente en cada nivel (opcional)
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export default function CategoryPickerModal({ open, onClose, onSelect }: CategoryPickerModalProps) {
  const [reload, setReload] = useState(0);                     // fuerza refetch después de crear
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set()); // ids expandidos
  const [drafts, setDrafts] = useState<Record<string, string>>({});  // texto "nuevo hijo" por parentId o "root"
  const overlayRef = useRef<HTMLDivElement>(null);

  // fetch categorías
  const { data: categories, loading, error } = useFetch<CategoryResource[]>(categoryResourceApi, [reload]);

  // acción POST para crear
  const { execute, loading: creating } = useApiAction<CategoryResource>();

  // cerrar con ESC y clic fuera
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  const tree = useMemo(() => buildTree(categories ?? []), [categories]);

  // filtro simple por nombre que mantiene el árbol (muestra matches y sus ancestros)
  const filteredTree = useMemo(() => {
    if (!query.trim()) return tree;
    const q = query.trim().toLowerCase();

    const matchOrDesc = (node: TreeNode): TreeNode | null => {
      const selfMatch = node.name.toLowerCase().includes(q);
      const matchedChildren = node.children
        .map(matchOrDesc)
        .filter((x): x is TreeNode => !!x);
      if (selfMatch || matchedChildren.length) {
        return { ...node, children: matchedChildren };
      }
      return null;
    };
    return tree.map(matchOrDesc).filter((x): x is TreeNode => !!x);
  }, [tree, query]);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const setDraft = (key: string, val: string) =>
    setDrafts((d) => ({ ...d, [key]: val }));

  const handleCreate = async (parentId: number | null) => {
    const key = (parentId ?? "root").toString();
    const name = (drafts[key] ?? "").trim();
    if (!name) return;

    const payload = { name, parentCategoryId: parentId };
    const res = await execute(categoryResourceApi, "POST", payload);

    if (res.statusCode === 201) {
      setDraft(key, "");
      if (parentId != null) {
        setExpanded((prev) => new Set(prev).add(parentId));
      }
      setReload((n) => n + 1);
    }
  };

  if (!open) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Categorías</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Cerrar">
            <FiX size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            className="w-full pl-9 pr-3 h-10 border rounded-md outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Buscar ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-auto space-y-2 pr-1">
          {loading && (
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 animate-pulse rounded" />
              <div className="h-8 bg-gray-200 animate-pulse rounded" />
              <div className="h-8 bg-gray-200 animate-pulse rounded" />
            </div>
          )}

          {error && (
            <div className="text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && filteredTree.map((node) => (
            <TreeRow
              key={node.categoryResourceId}
              node={node}
              depth={0}
              expanded={expanded}
              onToggle={toggle}
              onPick={(c) => { onSelect(c); onClose(); }}
              drafts={drafts}                          // 👈 pasamos el mapa completo
              setDraft={setDraft}                      // 👈 setter por clave
              onCreate={(pid) => handleCreate(pid)}    // 👈 create para cualquier nivel
              creating={creating}
            />
          ))}

          {/* (Opcional) añadir categoría raíz al final de la lista */}
          <div className="mt-2 flex items-center gap-2">
            <input
              className="flex-1 h-9 border rounded-md px-3 outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Añadir categoría raíz ..."
              value={drafts["root"] ?? ""}
              onChange={(e) => setDraft("root", e.target.value)}
            />
            <AddButton
              onClick={() => handleCreate(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  onPick,
  drafts,            // 👈 mapa completo
  setDraft,          // 👈 (key, value)
  onCreate,          // 👈 (parentId)
  creating,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onPick: (c: CategoryResource) => void;
  drafts: Record<string, string>;
  setDraft: (key: string, v: string) => void;
  onCreate: (parentId: number | null) => void;
  creating: boolean;
}) {
  const isOpen = expanded.has(node.categoryResourceId);
  const hasChildren = node.children.length > 0;
  const key = node.categoryResourceId.toString();     // 👈 clave única por nodo
  const value = drafts[key] ?? "";                    // 👈 valor propio del nodo

  return (
    <div>
      <div
        className="flex items-center gap-2"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button
          type="button"
          onClick={() => onToggle(node.categoryResourceId)}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
        >
          {isOpen ? <FiChevronDown /> : <FiChevronRight />}
        </button>

        <button
          type="button"
          onClick={() => onPick(node)}
          className="flex-1 h-10 px-3 border rounded-lg text-left hover:bg-gray-50"
        >
          {node.name}
        </button>
      </div>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {hasChildren &&
            node.children.map((child) => (
              <TreeRow
                key={child.categoryResourceId}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                onPick={onPick}
                drafts={drafts}                // 👈 seguimos pasando el mapa
                setDraft={setDraft}
                onCreate={onCreate}
                creating={creating}
              />
            ))}

          {/* input para añadir hijo de ESTE nodo */}
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
          >
            <input
              className="flex-1 h-9 border rounded-lg px-3 outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Añadir categoría ..."
              value={value}                               // 👈 usa su propio valor
              onChange={(e) => setDraft(key, e.target.value)} // 👈 escribe en su clave
            />
            <button
              type="button"
              onClick={() => onCreate(node.categoryResourceId)} // 👈 crea bajo ESTE nodo
              disabled={creating || !value.trim()}
              className="h-9 px-3 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1"
            >
              <FiPlus /> Añadir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
