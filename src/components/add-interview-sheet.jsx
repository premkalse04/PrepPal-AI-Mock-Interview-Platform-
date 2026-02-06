import * as React from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"; // adjust path if different
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const AddInterviewSheet = () => {
  return (
    <Sheet>
      {/* SheetTrigger as child so the Button opens the sheet */}
      <SheetTrigger asChild>
        <Button>+ Add New</Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Create new mock interview</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm">Position</label>
            <Input placeholder="Frontend Engineer" />
          </div>

          <div>
            <label className="block text-sm">Description</label>
            <Textarea placeholder="Describe the role..." />
          </div>

          <div>
            <label className="block text-sm">Tech Stack</label>
            <Input placeholder="React, Node, MongoDB" />
          </div>
        </div>

        <SheetFooter className="mt-6 flex justify-end gap-2">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={() => { /* handle submit */ }}>Create</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
