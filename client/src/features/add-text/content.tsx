import { useState, useRef, useCallback, FC } from "react";
import { Upload, FileText, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { saveText, generateId, type StoredText } from "@/lib/indexeddb";

type TProps = {
  onTextAdded: (text: StoredText) => void;
  defaultWpm?: number;
  handleClose: VoidFunction;
};

export const AddTextContent: FC<TProps> = ({
  onTextAdded,
  defaultWpm = 250,
  handleClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [pastedText, setPastedText] = useState("");

  const { toast } = useToast();

  const resetForm = () => {
    setTitle("");
    setPastedText("");
    setIsDragging(false);
  };

  const onClose = () => {
    resetForm();
    handleClose();
  };

  const processText = async (
    content: string,
    fileType: "text" | "paste",
    fileName?: string,
  ) => {
    const words = content.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      toast({
        title: "Empty content",
        description: "Please add some text to read.",
        variant: "destructive",
      });
      return;
    }

    const textTitle =
      title.trim() || fileName || `Text ${new Date().toLocaleDateString()}`;

    const newText: StoredText = {
      id: generateId(),
      title: textTitle,
      content: content.trim(),
      wordCount: words.length,
      currentWordIndex: 0,
      wpm: defaultWpm,
      lastReadAt: new Date(),
      createdAt: new Date(),
      fileType,
    };

    try {
      setIsLoading(true);
      await saveText(newText);
      onTextAdded(newText);
      onClose();
      toast({
        title: "Text added",
        description: `"${textTitle}" has been added to your library.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      toast({
        title: "No text",
        description: "Please paste some text first.",
        variant: "destructive",
      });
      return;
    }
    processText(pastedText, "paste");
  };

  const handleFileChange = async (file: File) => {
    if (!file.name.endsWith(".txt")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = await file.text();
      processText(content, "text", file.name.replace(".txt", ""));
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="Enter a title for this text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="input-text-title"
        />
      </div>

      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste" data-testid="tab-paste">
            <Clipboard className="h-4 w-4 mr-2" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="upload" data-testid="tab-upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-4">
          <Textarea
            placeholder="Paste your text here..."
            className="min-h-[200px] resize-none"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            data-testid="textarea-paste"
          />
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasteSubmit}
              disabled={isLoading || !pastedText.trim()}
              data-testid="button-add-text"
            >
              {isLoading ? "Adding..." : "Add Text"}
            </Button>
          </DialogFooter>
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFileChange(e.target.files[0])
              }
              data-testid="input-file"
            />
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your file here, or
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              data-testid="button-browse-files"
            >
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported format: .txt
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
          </DialogFooter>
        </TabsContent>
      </Tabs>
    </div>
  );
};
