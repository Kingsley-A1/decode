import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  return (
    <nav
      className="flex items-center justify-between gap-3"
      aria-label="Pagination"
    >
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
      >
        Previous
      </Button>
      <span className="text-sm font-medium text-slate-700">
        Page {page} of {pageCount}
      </span>
      <Button
        variant="secondary"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
      >
        Next
      </Button>
    </nav>
  );
}
