import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { type StoredText } from "@/lib/indexeddb";
import { Drawer } from "@/components/organisms";
import { AddTextContent } from "./content";
import { FC } from "react";

type TProps = {
  open: boolean;
  handleClose: VoidFunction;
  onTextAdded: (text: StoredText) => void;
  defaultWpm?: number;
};

export const AddTextModal: FC<TProps> = ({ open, handleClose, ...props }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer
        isOpen={open}
        onClose={handleClose}
        title="Add New Text"
        fullScreen={false}
      >
        <div className="p-4 pt-0">
          <AddTextContent handleClose={handleClose} {...props} />
        </div>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Text</DialogTitle>
          <DialogDescription>
            Upload a text file or paste content to start reading.
          </DialogDescription>
        </DialogHeader>

        <AddTextContent handleClose={handleClose} {...props} />
      </DialogContent>
    </Dialog>
  );
};
