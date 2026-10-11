import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Plus, FileText, Clock3 } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "./ui/command";
import type { Answer, Source } from "../api";
import { name } from "../api";
export default function WorkspaceSearch({
  open,
  onOpenChange,
  sources,
  history,
  onNavigate,
  onSource,
  onImport,
  onAnswer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
  history: Answer[];
  onNavigate: (view: "workbench" | "sources" | "cards" | "evaluations") => void;
  onSource: (id: string) => void;
  onImport: () => void;
  onAnswer: (answer: Answer) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Title className="sr-only">Search the workspace</Dialog.Title>
      <Dialog.Description className="sr-only">
        Find documents, saved answers, or a workspace view.
      </Dialog.Description>
      <CommandInput
        aria-label="Search the workspace"
        placeholder="Search documents, answers, actions…"
      />
      <CommandList>
        <CommandEmpty>No matching items.</CommandEmpty>
        <CommandGroup heading="Go to">
          {(
            [
              ["workbench", "Investigation desk"],
              ["sources", "Source library"],
              ["cards", "Evidence cards"],
              ["evaluations", "Evaluation runs"],
            ] as const
          ).map(([id, label]) => (
            <CommandItem
              key={id}
              onSelect={() => {
                onNavigate(id);
                onOpenChange(false);
              }}
            >
              <ArrowRight size={16} />
              {label}
              <CommandShortcut>VIEW</CommandShortcut>
            </CommandItem>
          ))}
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              onImport();
            }}
          >
            <Plus size={16} />
            Import a source
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Documents">
          {sources.map((doc) => (
            <CommandItem
              key={doc.id}
              value={doc.title}
              onSelect={() => {
                onOpenChange(false);
                onSource(doc.id);
              }}
            >
              <FileText size={16} />
              {name(doc.title)}
              <CommandShortcut>{doc.sha256.slice(0, 8)}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        {history.length > 0 && (
          <CommandGroup heading="Saved answers">
            {history.slice(0, 8).map((item) => (
              <CommandItem
                key={item.id}
                value={item.id + " " + item.question}
                onSelect={() => {
                  onAnswer(item);
                  onOpenChange(false);
                }}
              >
                <Clock3 size={16} />
                {item.question}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      <div className="command-help">
        <span>↑ ↓ Navigate</span>
        <span>↵ Open</span>
        <span>Esc Close</span>
      </div>
    </CommandDialog>
  );
}
