import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function DatePicker({ date, setDate }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-tcd-panel-line bg-tcd-panel-2 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-tcd-panel-line focus:outline-none focus:ring-2 focus:ring-tcd-teal/50",
            !date && "text-slate-400"
          )}
        >
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 rounded-md border border-tcd-panel-line bg-tcd-panel p-3 text-slate-200 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={setDate}
            showOutsideDays={true}
            className="p-3"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex justify-center items-center rounded-md border border-tcd-panel-line hover:bg-tcd-panel-line"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-slate-400 rounded-md w-8 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-tcd-panel-line first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-8 w-8 p-0 font-normal hover:bg-tcd-panel-line rounded-md aria-selected:opacity-100"
              ),
              day_selected:
                "bg-tcd-teal text-tcd-ink hover:bg-tcd-teal hover:text-tcd-ink focus:bg-tcd-teal focus:text-tcd-ink",
              day_today: "bg-tcd-panel-line text-slate-100",
              day_outside: "text-slate-500 opacity-50",
              day_disabled: "text-slate-500 opacity-50",
              day_range_middle: "aria-selected:bg-tcd-panel-line aria-selected:text-slate-200",
              day_hidden: "invisible",
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
